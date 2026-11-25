import { createOpenRouter } from "@openrouter/ai-sdk-provider"


const openrouter = createOpenRouter();
export const model = openrouter.chat("openai/gpt-6-luna");
