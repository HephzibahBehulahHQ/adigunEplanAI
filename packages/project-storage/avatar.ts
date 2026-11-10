import { CloudError, type CloudSession } from "./cloud.ts";

export const avatarBucket = "adiguneplanai-avatars";
export const maxAvatarBytes = 2 * 1024 * 1024;
export async function validateAvatarFile(
  file: Blob,
): Promise<"png" | "jpg" | "webp"> {
  if (!file.size || file.size > maxAvatarBytes)
    throw new Error("avatarInvalid");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const text = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  let width = 0,
    height = 0,
    extension: "png" | "jpg" | "webp";
  if (
    file.type === "image/png" &&
    bytes.length >= 24 &&
    bytes
      .slice(0, 8)
      .every((value, i) => value === [137, 80, 78, 71, 13, 10, 26, 10][i]) &&
    text(12, 16) === "IHDR" &&
    view.getUint32(8) === 13
  ) {
    extension = "png";
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (
    file.type === "image/jpeg" &&
    bytes.length >= 12 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  ) {
    extension = "jpg";
    for (let offset = 2; offset + 3 < bytes.length;) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 216)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker) &&
        length >= 8
      ) {
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (
    file.type === "image/webp" &&
    bytes.length >= 25 &&
    text(0, 4) === "RIFF" &&
    text(8, 12) === "WEBP" &&
    view.getUint32(4, true) + 8 === bytes.length
  ) {
    extension = "webp";
    const kind = text(12, 16);
    if (kind === "VP8X" && bytes.length >= 30) {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === "VP8L" && bytes[20] === 47) {
      width = 1 + bytes[21] + ((bytes[22] & 63) << 8);
      height =
        1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10);
    } else if (
      kind === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 157 &&
      bytes[24] === 1 &&
      bytes[25] === 42
    ) {
      width = view.getUint16(26, true) & 16383;
      height = view.getUint16(28, true) & 16383;
    }
  } else throw new Error("avatarInvalid");
  if (!width || !height || width > 4096 || height > 4096)
    throw new Error("avatarInvalid");
  return extension;
}

export function ownedAvatarPath(
  ownerId: string,
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(`${ownerId}/`) &&
    /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(value)
  );
}
type Options = {
  url: string;
  publishableKey: string;
  ownerId: string;
  session: () => Promise<CloudSession | null>;
  fetch?: typeof fetch;
};
export class PrivateAvatars {
  private readonly options: Options;
  private readonly request: typeof fetch;
  constructor(options: Options) {
    if (
      !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(options.url) ||
      !/^sb_publishable_[\w-]+$/.test(options.publishableKey) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        options.ownerId,
      )
    )
      throw new Error("Invalid avatar backend");
    this.options = options;
    this.request = options.fetch ?? globalThis.fetch.bind(globalThis);
  }
  private async current() {
    const session = await this.options.session();
    if (!session?.accessToken) throw new CloudError("signedOut");
    if (session.userId !== this.options.ownerId)
      throw new CloudError("accountChanged");
    return session;
  }
  private async send(
    session: CloudSession,
    method: string,
    path: string,
    body?: BodyInit,
    contentType = "application/json",
  ) {
    const before = await this.current();
    if (before.epoch !== session.epoch) throw new CloudError("accountChanged");
    let response: Response;
    try {
      response = await this.request(`${this.options.url}/storage/v1/${path}`, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: {
          apikey: this.options.publishableKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": contentType,
          "x-upsert": "false",
        },
        ...(body === undefined ? {} : { body }),
      });
    } catch {
      throw new CloudError("unavailable");
    }
    const after = await this.current();
    if (after.epoch !== session.epoch) throw new CloudError("accountChanged");
    if (response.status === 401 || response.status === 403)
      throw new CloudError("denied");
    if (!response.ok) throw new CloudError("unavailable");
    return response;
  }
  async upload(file: Blob): Promise<string> {
    const session = await this.current();
    const extension = await validateAvatarFile(file);
    const path = `${session.userId}/${crypto.randomUUID()}.${extension}`;
    await this.send(
      session,
      "POST",
      `object/${avatarBucket}/${path}`,
      file,
      file.type,
    );
    return path;
  }
  async signedUrl(path: string): Promise<string> {
    const session = await this.current();
    if (!ownedAvatarPath(session.userId, path)) throw new CloudError("denied");
    const response = await this.send(
      session,
      "POST",
      `object/sign/${avatarBucket}/${path}`,
      JSON.stringify({ expiresIn: 300 }),
    );
    const result: unknown = await response.json();
    const current = await this.current();
    if (current.epoch !== session.epoch) throw new CloudError("accountChanged");
    if (
      !result ||
      typeof result !== "object" ||
      !("signedURL" in result) ||
      typeof result.signedURL !== "string"
    )
      throw new CloudError("invalidResponse");
    const url = new URL(`${this.options.url}/storage/v1${result.signedURL}`);
    if (
      url.origin !== this.options.url ||
      url.pathname !== `/storage/v1/object/sign/${avatarBucket}/${path}` ||
      !url.searchParams.get("token")
    )
      throw new CloudError("invalidResponse");
    return url.href;
  }
  async remove(path: string): Promise<void> {
    const session = await this.current();
    if (!ownedAvatarPath(session.userId, path)) throw new CloudError("denied");
    await this.send(
      session,
      "DELETE",
      `object/${avatarBucket}`,
      JSON.stringify({ prefixes: [path] }),
    );
  }
}
