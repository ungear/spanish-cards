import OpenAI from "openai";
import  {OPEN_AI_ORGANIZATION, OPEN_AI_PROJECT, OPEN_AI_API_KEY } from "../secret.js";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const Translation = z.object({ 
  translation: z.string(),
  example: z.string(),
});

const TranslationSuggestions = z.object({ 
  suggestions: z.array(Translation),
});
export class OpenAiService{
  constructor(){
    this.client = new OpenAI({
      organization: OPEN_AI_ORGANIZATION,
      project: OPEN_AI_PROJECT,
      apiKey: OPEN_AI_API_KEY,
    });
    //this.model = "gpt-4.1";
    this.model = "gpt-4.1-2025-04-14";
  }
  async getArticle(word){
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "developer",
          content: `
            You are a Spanish teacher. Your task is to answer, what grammatical gender have the provided nouns.
            Answer only the single word "masculine", "feminine" or "no" if the provided word is not a noun.
            `
        },
        {
            role: "user",
            content: word,
        },
      ],
    });
    
    return completion.choices[0].message.content;
  }

  async getTranslationSuggestions(word){
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "developer",
          content: `
            You are a Spanish teacher. Your task is provide translation suggestions from Spanish to English.
            Provide up to 5 suggestions for a passed word. Examples should contain SPanish example only, the translation of English is not required.
            `
        },
        {
            role: "user",
            content: word,
        },
      ],
      response_format: zodResponseFormat(TranslationSuggestions, "suggestions"),
    });
    
    const output = JSON.parse(completion.choices[0].message.content);

    return output;
  }
}
