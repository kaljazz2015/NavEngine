import { EvalFunction } from "@/types/evals";
import { initnavengine } from "@/evals/initnavengine";

export const expedia: EvalFunction = async ({ modelName, logger }) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  try {
    await navengine.page.goto("https://www.expedia.com/flights");
    await navengine.page.act(
      "find round-trip flights from San Francisco (SFO) to Toronto (YYZ) for Jan 1, 2025 (up to one to two weeks)",
    );
    await navengine.page.act("Go to the first non-stop flight");
    await navengine.page.act("select the cheapest flight");
    await navengine.page.act("click on the first non-stop flight");
    await navengine.page.act("Take me to the checkout page");

    const url = navengine.page.url();
    return {
      _success: url.startsWith("https://www.expedia.com/Checkout/"),
      logs: logger.getLogs(),
      debugUrl,
      sessionUrl,
    };
  } catch (error) {
    logger.error({
      message: "Error in expedia eval",
      level: 0,
      auxiliary: {
        error: { value: error.message, type: "string" },
        trace: { value: error.stack, type: "string" },
      },
    });

    return {
      _success: false,
      logs: logger.getLogs(),
      debugUrl,
      sessionUrl,
    };
  } finally {
    await navengine.close();
  }
};
