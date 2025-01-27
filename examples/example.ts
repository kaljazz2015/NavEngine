/**
 * This example shows how to use custom instructions with NavEngine on Wikipedia
 */
import { NavEngine } from "@/dist";
import NavEngineConfig from "@/navengine.config";
async function example() {
  const navengine = new NavEngine({
    ...NavEngineConfig,
    systemPrompt:
      "On inputs of`secretAction`, click on the 'talk' tab. additionally, if the user says to type something, translate their input into mandarin and type it.",
  });
  await navengine.init();
  const page = navengine.page;
  await page.goto("https://en.wikipedia.org/wiki/Main_Page");
  await page.act({
    action: "secretAction",
  });
  await page.act({
    action: "search for 'history of the internet",
  });
  await navengine.close();
}
(async () => {
  await example();
})();