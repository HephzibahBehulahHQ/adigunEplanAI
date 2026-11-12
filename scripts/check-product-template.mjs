import fs from "node:fs";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { examples } from "../packages/example-projects/index.ts";

const repository = "HephzibahBehulahHQ/adigunEplanAI";
const colors = {
  navy: "#0B1220",
  gold: "#D4AF37",
  royalBlue: "#2563EB",
  ivory: "#F8FAFC",
};
const references = {
  corporateWebsiteRepository: "HephzibahBehulahHQ/HephzibahBehulahHQ.github.io",
  designSystemRepository: "HephzibahBehulahHQ/hb-design-system",
  divisionRepository: "HephzibahBehulahHQ/hb-elektroniker",
  policyRepository: "HephzibahBehulahHQ/hb-AI-policy",
  artificialIntelligenceRepository:
    "HephzibahBehulahHQ/hb-artificial-intelligence",
  masterPlanRepository: repository,
  interfaceRepository: repository,
};
const authorityPins = {
  policy: "d42d4e04ac6ab77ebafa1d4fccb724a4dde8d02e",
  designSystem: "52f01f9986d97088413ca9785bc7a2d3f2967123",
  artificialIntelligence: "4d4eb7e9108f88f6a406cec52e3e9a551eb09bdd",
  division: "1daeed88df067a235b33516fb4cce111350ab80c",
  corporate: "bd116504412b37105166805018f64a6e7bbe3cde",
};
const logoHash =
  "6d6d33bb7534d01cbff3133a3d63fc0893f1c51f36c8e66531bca95d02cb4ec4";
const targetHash =
  "c99e97fccec545612872ddc5466df9109bc9af63f0d64b9e27420c6321d961c9";
export function productTemplateIssues(bundle) {
  const {
    config: c,
    bot,
    corporate,
    brands,
    css,
    logo,
    target,
    ownerTarget,
    master,
    ownerMaster,
  } = bundle;
  const issues = [];
  const require = (condition, message) => {
    if (!condition) issues.push(message);
  };
  require(c.schemaVersion === 3 &&
    c.product?.name === "AdigunEplanAI" &&
    c.product?.repository ===
      repository, "Product identity or destination changed");
  require(c.brandKey === "elektroniker" &&
    brands.elektroniker?.name === "HB Elektroniker" &&
    brands.elektroniker?.accent ===
      "#22D3EE", "HB Elektroniker identity or accent changed");
  require(corporate.name === "Hephzibah Behulah" &&
    corporate.organization ===
      "HephzibahBehulahHQ", "Corporate identity changed");
  for (const [key, expected] of Object.entries(colors))
    require(corporate.colors?.[key] === expected &&
      css
        .toLowerCase()
        .includes(expected.toLowerCase()), `Canonical color changed: ${key}`);
  require(css
    .toLowerCase()
    .includes("#22d3ee"), "Canonical division accent is missing from CSS");
  for (const [key, expected] of Object.entries(references))
    require(c.references?.[key] ===
      expected, `Authority repository changed: ${key}`);
  require(c.authorityPins?.policy ===
    "d42d4e04ac6ab77ebafa1d4fccb724a4dde8d02e", "Adopted policy pin changed without adoption");
  for (const [key, expected] of Object.entries(authorityPins))
    require(c.authorityPins?.[key] ===
      expected, `Unreviewed authority pin: ${key}`);
  require(c.features?.administration?.owner === "Hephzibah Behulah" &&
    c.links?.corporateWebsite ===
      "https://hephzibahbehulah.com/", "Corporate ownership or public link changed");
  require(c.specification?.masterPlan === "docs/MASTER_SPECIFICATION.md" &&
    c.specification?.ownerMasterPlan === "AdidunEplanAI Master PlanGoals" &&
    c.specification?.interface === "docs/references/target-workspace.png" &&
    c.specification?.ownerInterface ===
      "AdigunEplanTarget interface.png", "Specification bindings changed");
  require(crypto.createHash("sha256").update(ownerMaster).digest("hex") ===
    "a3d63f86761366b2ec582d8ae8d426ea172c689c4a6ed4758de8ce64b8697405", "Approved owner master plan changed");
  require(c.branding?.logoPolicy === "single-corporate-logo" &&
    c.branding?.header?.productWordmark === true &&
    c.branding?.header?.divisionTextLabel === true &&
    c.branding?.header?.additionalBrandLogos ===
      false, "One-logo header policy changed");
  require(c.branding?.corporateLogo?.asset ===
    "apps/web/src/assets/approved-header-reference.png" &&
    c.branding?.corporateLogo?.alt === corporate.name &&
    c.branding?.corporateLogo?.sha256 === logoHash &&
    logo === logoHash, "Official corporate logo changed");
  require(target === targetHash &&
    ownerTarget === targetHash &&
    c.specification?.interfaceSha256 ===
      targetHash, "Approved interface reference changed");
  require(master.replace(/\r\n/g, "\n").trimEnd() ===
    ownerMaster.replace(/\r\n/g, "\n").trimEnd(), "Master-plan copies diverge");
  require(JSON.stringify(c.features?.languages) ===
    JSON.stringify(["en", "de", "yo", "pcm"]) &&
    c.features?.defaultLanguage === "en", "Required languages changed");
  require(c.features?.adigunBot?.mode === bot.mode &&
    bot.product === c.product?.name &&
    bot.division === brands.elektroniker?.name &&
    c.integrations?.assistantEndpoint ===
      bot.endpoint, "BOT capability contracts diverge");
  require(c.features?.adigunBot?.actionsRequireConfirmation === true &&
    c.features?.administration?.serverAuthorizedRoles ===
      false, "Unsupported action or administrator permissions declared");
  require(bot.hostedAI === false &&
    bot.workspaceMutations === false &&
    bot.automaticProjectSaving === false &&
    c.acceptance?.hostedAiVerified ===
      false, "Unavailable hosted AI or mutations advertised");
  require(c.acceptance?.fullSpecificationComplete === false &&
    c.acceptance?.authenticatedCloudRoundTripVerified ===
      false, "Unverified release or cloud acceptance advertised");
  require(c.acceptance?.sampleProjects?.validatedCount === examples.length &&
    c.acceptance?.sampleProjects?.requiredCount ===
      500, "Example acceptance count does not match the actual library");
  require(c.integrations?.cloudflareDeployment === null &&
    c.features?.accounts?.guestAccess?.trialMinutes ===
      null, "Unconfigured hosting or inherited trial restriction declared");
  return issues;
}
export function loadProductTemplate() {
  const root = new URL("../", import.meta.url);
  const read = (file) => fs.readFileSync(new URL(file, root), "utf8");
  const json = (file) => JSON.parse(read(file));
  const hash = (file) =>
    crypto
      .createHash("sha256")
      .update(fs.readFileSync(new URL(file, root)))
      .digest("hex");
  return {
    config: json("product.config.json"),
    bot: json("adigun-bot.config.json"),
    corporate: json("packages/design-tokens/corporate.json"),
    brands: json("packages/design-tokens/brands.json"),
    css: read("packages/design-tokens/tokens.css"),
    logo: hash("apps/web/src/assets/approved-header-reference.png"),
    target: hash("docs/references/target-workspace.png"),
    ownerTarget: hash("docs/references/target-workspace.png"),
    master: read("docs/MASTER_SPECIFICATION.md"),
    ownerMaster: read("AdidunEplanAI Master PlanGoals"),
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const issues = productTemplateIssues(loadProductTemplate());
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      "Product identity, brand, authority, master/interface and capability gates passed",
    );
}
