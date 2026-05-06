import { Injectable } from "@nestjs/common";

import { VercelAiProvider } from "@ai/vercel.provider";

@Injectable()
export class AiService {
  private providers: VercelAiProvider[];

  constructor() {
    this.providers = [new VercelAiProvider("openai"), new VercelAiProvider("anthropic")];
  }

  async parse(input: string) {
    for (const provider of this.providers) {
      try {
        return await provider.parse(input);
      } catch (error) {
        continue;
      }
    }

    throw new Error("All AI providers failed");
  }
}
