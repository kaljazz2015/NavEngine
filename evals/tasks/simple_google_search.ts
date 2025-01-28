import { EvalFunction } from "@/types/evals";
import { initnavengine } from "@/evals/initnavengine";

export const simple_google_search: EvalFunction = async ({
  modelName,
  logger,
}) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  await navengine.page.goto("https://www.google.com");

  await navengine.page.act({
    action: 'Search for "OpenAI"',
  });

  const expectedUrl = "https://www.google.com/search?q=OpenAI";
  const currentUrl = navengine.page.url();

  await navengine.close();

  return {
    _success: currentUrl.startsWith(expectedUrl),
    currentUrl,
    debugUrl,
    sessionUrl,
    logs: logger.getLogs(),
  };
};
