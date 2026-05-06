import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

type TProvider = "openai" | "anthropic";

export class VercelAiProvider {
  private provider: TProvider;

  constructor(provider: TProvider) {
    this.provider = provider;
  }

  private getModel() {
    if (this.provider === "openai") {
      return openai("gpt-4.1-mini");
    }
    return anthropic("claude-sonnet-4-5");
  }

  async parse(input: string) {
    const result = await generateText({
      model: this.getModel(),
      prompt: `Convert the following text to markdown: ${input}`,
      temperature: 0,
    });

    return result.text;
  }
}
