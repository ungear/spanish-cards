import OpenAI from "openai";
import  {OPEN_AI_ORGANIZATION, OPEN_AI_PROJECT, OPEN_AI_API_KEY } from "../secret.js";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { WritingTopic, WritingTopicLabels } from "../endpoints/writing.js";

const Translation = z.object({ 
  translation: z.string(),
  example: z.string(),
});

const WritingTaskItem = z.object({
  question: z.string(),
  answer: z.string(),
});
const WritingTask = z.object({
  items: z.array(WritingTaskItem),
});

const TranslationSuggestions = z.object({ 
  suggestions: z.array(Translation),
});
export class OpenAiService{
  private client: OpenAI;
  private model: string;

  constructor(){
    this.client = new OpenAI({
      organization: OPEN_AI_ORGANIZATION,
      project: OPEN_AI_PROJECT,
      apiKey: OPEN_AI_API_KEY,
    });
    //this.model = "gpt-4.1";
    this.model = "gpt-4.1-2025-04-14";
  }
  async getArticle(word: string){
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "developer",
          content: `
            You are a Spanish teacher. Your task is to answer, what grammatical gender have the provided nouns.
            Answer only the single word "el", "la" or "no" if the provided word is not a noun.
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

  async getTranslationSuggestions(word: string){
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
    
    const output = JSON.parse(completion.choices[0].message.content || "{}");

    return output;
  }

  async getWritingTask(topics: WritingTopic[], englishWordsToUse: string[]){
    const topicLabels = topics.map(topic => WritingTopicLabels[topic]);
    const englishWordsToUseCombined = englishWordsToUse.join(", ").toLowerCase();
    const topicLabelsCombined = topicLabels.join(", ").toLowerCase();
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "developer",
          content: `
            You are a Spanish teacher. Your task is to generate 10 sentences in English.
            The learner's task will be to compose translation for the sentences in Spanish. 
            The sentences should use the provided grammar topic.
            Each sentence should contain one word from the provided list so that the user practice the specific words on top of the grammar topics.
            `
          },
          {
            role: "user",
            content: `Topics:  ${topicLabelsCombined}. Words to use: ${englishWordsToUseCombined}`,
          },
        ],
        response_format: zodResponseFormat(WritingTask, "task"),
      });
      const output = JSON.parse(completion.choices[0].message.content || "{}");

      return output;
  }

  async getNumberAudio(number: number): Promise<Buffer> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "developer",
          content: `You are a Spanish teacher. Your task is to write out a given number as a Spanish word.
            Answer only the single Spanish text for the number, nothing else.`
        },
        {
          role: "user",
          content: number.toString(),
        },
      ],
    });
    const spanishText = completion.choices[0].message.content || number.toString();

    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];

    const audioResponse = await this.client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: randomVoice,
      input: spanishText,
      instructions: "Pronounce the text in Spanish naturally.",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    return audioBuffer;
  }
}
