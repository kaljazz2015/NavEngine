/**
 * This file provides a function to initialize a Navengine instance for use in evaluations.
 * It configures the Navengine environment and sets default options based on the current environment
 * (e.g., local or BROWSERBASE), caching preferences, and verbosity. It also establishes a logger for
 * capturing logs emitted by Navengine.
 *
 * We create a central config object (`NavEngineConfig`) that defines all parameters for Navengine.
 *
 * The `initnavengine` function takes the model name, an optional DOM settling timeout, and an EvalLogger,
 * then uses these to override some default values before creating and initializing the Navengine instance.
 */

import { enableCaching, env } from "./env";
import { AvailableModel, ConstructorParams, LogLine, Navengine } from "@/dist";
import { EvalLogger } from "./logger";

/**
 * NavEngineConfig:
 * This configuration object follows a similar pattern to `examples/navengine.config.ts`.
 * It sets the environment, verbosity, caching preferences, and other defaults. Some values,
 * like `apiKey` and `projectId`, can be defined via environment variables if needed.
 *
 * Adjust or remove fields as appropriate for your environment.
 */
const NavEngineConfig = {
  env: env,
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  verbose: 2 as const,
  debugDom: true,
  headless: false,
  enableCaching,
  domSettleTimeoutMs: 30_000,
  modelName: "gpt-4o", // default model, can be overridden by initnavengine arguments
  modelClientOptions: {
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  logger: (logLine: LogLine) =>
    console.log(`[navengine::${logLine.category}] ${logLine.message}`),
};

/**
 * Initializes a Navengine instance for a given model:
 * - modelName: The model to use (overrides default in NavEngineConfig)
 * - domSettleTimeoutMs: Optional timeout for DOM settling operations
 * - logger: An EvalLogger instance for capturing logs
 *
 * Returns:
 * - navengine: The initialized Navengine instance
 * - logger: The provided logger, associated with the Navengine instance
 * - initResponse: Any response data returned by Navengine initialization
 */
export const initnavengine = async ({
  modelName,
  domSettleTimeoutMs,
  logger,
  configOverrides,
}: {
  modelName: AvailableModel;
  domSettleTimeoutMs?: number;
  logger: EvalLogger;
  configOverrides?: Partial<ConstructorParams>;
}) => {
  let chosenApiKey: string | undefined = process.env.DEEPSEEK_API_KEY;
  if (modelName.startsWith("claude")) {
    chosenApiKey = process.env.ANTHROPIC_API_KEY;
  }

  const config = {
    ...NavEngineConfig,
    modelName,
    ...(domSettleTimeoutMs && { domSettleTimeoutMs }),
    modelClientOptions: {
      apiKey: chosenApiKey,
    },
    logger: (logLine: LogLine) => {
      logger.log(logLine);
    },
    ...configOverrides,
  };

  const navengine = new Navengine(config);

  // Associate the logger with the Navengine instance
  logger.init(navengine);

  const initResponse = await navengine.init();
  return { navengine, logger, initResponse };
};
