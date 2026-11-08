import markdown from "../../docs/HELP.md";
import { createBotHandler } from "./handler.mjs";

export default { fetch: createBotHandler(markdown) };
