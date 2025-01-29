import { EvalFunction } from "@/types/evals";
import { initnavengine } from "@/evals/initnavengine";

export const wikipedia: EvalFunction = async ({ modelName, logger }) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  await navengine.page.goto(`https://en.wikipedia.org/wiki/Baseball`);
  await navengine.page.act('click the "hit and run" link in this article');

  const url = "https://en.wikipedia.org/wiki/Hit_and_run_(baseball)";
  const currentUrl = navengine.page.url();

  await navengine.close();

  return {
    _success: currentUrl === url,
    expected: url,
    actual: currentUrl,
    debugUrl,
    sessionUrl,
    logs: logger.getLogs(),
  };
};
