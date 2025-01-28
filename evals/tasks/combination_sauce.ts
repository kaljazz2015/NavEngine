import { EvalFunction } from "@/types/evals";
import { initnavengine } from "@/evals/initnavengine";
import { z } from "zod";

export const combination_sauce: EvalFunction = async ({
  modelName,
  logger,
  useTextExtract,
}) => {
  const { navengine, initResponse } = await initnavengine({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  try {
    await navengine.page.goto("https://www.saucedemo.com/");

    const { usernames, password } = await navengine.page.extract({
      instruction: "extract the accepted usernames and the password for login",
      schema: z.object({
        usernames: z.array(z.string()).describe("the accepted usernames"),
        password: z.string().describe("the password for login"),
      }),
      modelName,
      useTextExtract,
    });

    await navengine.page.act({
      action: `enter username 'standard_user'`,
    });

    await navengine.page.act({
      action: `enter password '${password}'`,
    });

    await navengine.page.act({
      action: "click on 'login'",
    });

    const observations = await navengine.page.observe({
      instruction: "find all the 'add to cart' buttons",
    });

    console.log("observations", observations);
    console.log("observations length", observations.length);

    const url = await navengine.page.url();

    await navengine.close();

    const usernamesCheck = usernames.length === 6;
    const urlCheck = url === "https://www.saucedemo.com/inventory.html";
    const observationsCheck = observations.length === 6;

    return {
      _success: usernamesCheck && urlCheck && observationsCheck,
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
