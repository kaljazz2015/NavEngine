# NavEngine
Easiest Browser control framework using Deepseek

NavEngine is fully compatible with [Playwright](https://playwright.dev/), offering three simple AI APIs (`act`, `extract`, and `observe`) on top of the base Playwright `Page` class that provide the building blocks for web automation via natural language. 

Example code block:
```typescript
// Existing Playwright code unchanged
await page.goto("https://www.wikipedia.org");

// Act on the page
await page.act("click on the 'Talk'");

// Extract data from the page
const { description } = await page.extract({
  instruction: "extract the description of the page",
  schema: z.object({
    description: z.string(),
  }),
});
```
### Quickstart

To create a new project configured to our default settings, run:

```bash
npx create-browser-app --example quickstart
```

### Build and Run from Source

```bash
git clone https://github.com/Bittern12/NavEngine.git
npm install
npx playwright install
npm run build
npm run example # run the blank script at ./examples/example.ts
```

NavEngine is best when you have an API key for Deepseek LLM credentials. To add these to your project, run:

```bash
cp .env.example .env
nano .env # Edit the .env file to add API keys
```
