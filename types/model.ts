import type { ClientOptions as OpenAIClientOptions } from "openai";
import { z } from "zod";

export const AvailableModelSchema = z.enum([
  "deepseek-vl2",
]);

export type AvailableModel = z.infer<typeof AvailableModelSchema>;

export type ModelProvider = "deepseek";

export type ClientOptions = OpenAIClientOptions;
