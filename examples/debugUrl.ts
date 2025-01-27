import { NavEngine } from "@/dist";
async function debug(url: string) {
  const navengine = new NavEngine({
    env: "LOCAL",
    verbose: 2,
    debugDom: true,
  });
  await navengine.init();
  await navengine.page.goto(url);
}
(async () => {
  const url = process.argv.find((arg) => arg.startsWith("--url="));
  if (!url) {
    console.error("No URL flag provided. Usage: --url=https://example.com");
    process.exit(1);
  }
  const targetUrl = url.split("=")[1];
  console.log(`Navigating to: ${targetUrl}`);
  await debug(targetUrl);
})();