import { OpenAiService } from "./services/openAiService.js";

const service = new OpenAiService();


// const article = await service.getArticle("tomar");
// console.log(article)

const suggestions = await service.getTranslationSuggestions("tomar");
console.log(suggestions);