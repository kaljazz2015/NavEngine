import type { ConstructorParams, LogLine } from "@/dist";
import dotenv from "dotenv";
import { logLineToString } from "@/lib/utils";
dotenv.config();
const NavEngineConfig: ConstructorParams = {
  env:
  debugDom: true /* Enable DOM debugging features */,
  headless: false /* Run browser in headless mode */,
  logger: (message: LogLine) =>
    console.log(logLineToString(message)) /* Custom logging function */,
  domSettleTimeoutMs: 30_000 /* Timeout for DOM to settle in milliseconds */,
  browserbaseSessionCreateParams: {
    projectId: process.env.PROJECT_ID!,
  },
  enableCaching: true /* Enable caching functionality */,
  browserbaseSessionID:
    undefined /* Session ID for resuming Browserbase sessions */,
  modelName: "DeepSeek-V2.5" /* Name of the model to use */,
  modelClientOptions: {
    apiKey: process.env.DEEPSEEK_API_KEY,
  } /* Configuration options for the model client */,
};
export default NavEngineConfig;

