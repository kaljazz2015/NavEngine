import { EvalFunction } from "@/types/evals";
import { initnavengine } from "@/evals/initnavengine";

export const rakuten_jp: EvalFunction = async ({ modelName, logger }) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  await navengine.page.goto("https://www.rakuten.co.jp/");
  await navengine.page.act({ action: "click on online supermarket" });

  await navengine.page.act({ action: "if there is a popup, close it" });

  await navengine.page.act({
    action: "navigate to Inageya Online Supermarket",
  });
  await navengine.page.act({ action: "click the search bar input" });
  await navengine.page.act({ action: "search for '香菜'" });

  const url = navengine.page.url();
  const successUrl =
    "https://netsuper.rakuten.co.jp/inageya/search/?keyword=%E9%A6%99%E8%8F%9C";

  await navengine.close();

  return {
    _success: url === successUrl,
    debugUrl,
    sessionUrl,
    logs: logger.getLogs(),
  };
};
