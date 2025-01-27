import { NavEngine } from "@/dist";
import { z } from "zod";
async function example() {
  const navengine = new NavEngine({
    env: "LOCAL",
    verbose: 1,
    debugDom: true,
    domSettleTimeoutMs: 100,
  });
  try {
    await navengine.init();
    await navengine.page.goto("https://ovolve.github.io/2048-AI/");
    console.log("⌛ Waiting for game to initialize...");
    await navengine.page.waitForSelector(".grid-container", { timeout: 10000 });
    // Main game loop
    while (true) {
      console.log("🔄 Game loop iteration...");
      // Add a small delay for UI updates
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Get current game state
      const gameState = await navengine.page.extract({
        instruction: `Extract the current game state:
          1. Score from the score counter
          2. All tile values in the 4x4 grid (empty spaces as 0)
          3. Highest tile value present`,
        schema: z.object({
          score: z.number(),
          highestTile: z.number(),
          grid: z.array(z.array(z.number())),
        }),
      });
      const transposedGrid = gameState.grid[0].map((_, colIndex) =>
        gameState.grid.map((row) => row[colIndex]),
      );
      const grid = transposedGrid.map((row, rowIndex) => ({
        [`row${rowIndex + 1}`]: row,
      }));
      console.log("Game State:", {
        score: gameState.score,
        highestTile: gameState.highestTile,
        grid: grid,
      });
      // Analyze board and decide next move
      const analysis = await navengine.page.extract({
        instruction: `Based on the current game state:
          - Score: ${gameState.score}
          - Highest tile: ${gameState.highestTile}
          - Grid: This is a 4x4 matrix ordered by row (top to bottom) and column (left to right). The rows are stacked vertically, and tiles can move vertically between rows or horizontally between columns:\n${grid
            .map((row) => {
              const rowName = Object.keys(row)[0];
              return `             ${rowName}: ${row[rowName].join(", ")}`;
            })
            .join("\n")}
          What is the best move (up/down/left/right)? Consider:
          1. Keeping high value tiles in corners (bottom left, bottom right, top left, top right)
          2. Maintaining a clear path to merge tiles
          3. Avoiding moves that could block merges
          4. Only adjacent tiles of the same value can merge
          5. Making a move will move all tiles in that direction until they hit a tile of a different value or the edge of the board
          6. Tiles cannot move past the edge of the board
          7. Each move must move at least one tile`,
        schema: z.object({
          move: z.enum(["up", "down", "left", "right"]),
          confidence: z.number(),
          reasoning: z.string(),
        }),
      });
      console.log("Move Analysis:", analysis);
      const moveKey = {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
      }[analysis.move];
      await navengine.page.keyboard.press(moveKey);
      console.log("🎯 Executed move:", analysis.move);
    }
  } catch (error) {
    console.error("❌ Error in game loop:", error);
    const isGameOver = await navengine.page.evaluate(() => {
      return document.querySelector(".game-over") !== null;
    });
    if (isGameOver) {
      console.log("🏁 Game Over!");
      return;
    }
    throw error; 
  }
}
(async () => {
  await example();
})();

