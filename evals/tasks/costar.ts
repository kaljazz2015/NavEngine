import { initnavengine } from "@/evals/initnavengine";
import { EvalFunction } from "@/types/evals";
import { z } from "zod";

export const costar: EvalFunction = async ({
  modelName,
  logger,
  useTextExtract,
}) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;
  // TODO: fix this eval - does not work in headless mode
  try {
    await Promise.race([
      navengine.page.goto("https://www.costar.com/"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Navigation timeout")), 30000),
      ),
    ]);

    await navengine.page.act({ action: "click on the first article" });

    await navengine.page.act({
      action: "click on the learn more button for the first job",
    });

    const articleTitle = await navengine.page.extract({
      instruction: "extract the title of the article",
      schema: z.object({
        title: z.string().describe("the title of the article").nullable(),
      }),
      modelName,
      useTextExtract,
    });

    logger.log({
      message: "got article title",
      level: 1,
      auxiliary: {
        articleTitle: {
          value: JSON.stringify(articleTitle),
          type: "object",
        },
      },
    });

    // Check if the title is more than 5 characters
    const isTitleValid =
      articleTitle.title !== null && articleTitle.title.length > 5;

    await navengine.close();

    return {
      title: articleTitle.title,
      _success: isTitleValid,
      debugUrl,
      sessionUrl,
      logs: logger.getLogs(),
    };
  } catch (error) {
    logger.error({
      message: "error in costar function",
      level: 0,
      auxiliary: {
        error: {
          value: error.message,
          type: "string",
        },
        trace: {
          value: error.stack,
          type: "string",
        },
      },
    });

    await navengine.close();

    return {
      title: null,
      _success: false,
      debugUrl,
      sessionUrl,
      logs: logger.getLogs(),
    };
  }
};
