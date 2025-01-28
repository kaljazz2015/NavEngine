import { EvalFunction } from "@/types/evals";
import { initnavengine } from "@/evals/initnavengine";

export const extract_repo_name: EvalFunction = async ({
  modelName,
  logger,
}) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  try {
    await navengine.page.goto("https://github.com/facebook/react");

    const { extraction } = await navengine.page.extract(
      "extract the title of the Github repository. Do not include the owner of the repository.",
    );

    logger.log({
      message: "Extracted repo title",
      level: 1,
      auxiliary: {
        repo_name: {
          value: extraction,
          type: "object",
        },
      },
    });

    await navengine.close();

    return {
      _success: extraction === "react",
      extraction,
      debugUrl,
      sessionUrl,
      logs: logger.getLogs(),
    };
  } catch (error) {
    console.error("Error or timeout occurred:", error);

    await navengine.close();

    return {
      _success: false,
      error: JSON.parse(JSON.stringify(error, null, 2)),
      debugUrl,
      sessionUrl,
      logs: logger.getLogs(),
    };
  }
};
