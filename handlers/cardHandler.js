import { OpenAiService } from '../services/openAiService.js';

export async function getArticle(req, res){
  const query = req.url.split('?')[1];
  const word = new URLSearchParams(query).get('word');
  if (!word) {
    res.statusCode = 400;
    res.write('Missing word parameter\r\n');
    return;
  }
  const openAiService = new OpenAiService();
  const article = await openAiService.getArticle(word);
  res.write(article);
}