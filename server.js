import Fastify from 'fastify';
import { OpenAiService } from './services/openAiService.js';

const PORT = 3000;

const fastify = Fastify({ logger: true });

fastify.get('/api/card/getArticle', async (request, reply) => {
  const word = request.query.word;
  if(!word) {
    reply.status(400).send('Missing word parameter');
    return;
  }
  const openAiService = new OpenAiService();
  const article = await openAiService.getArticle(word);
  return { article }
});

fastify.get('/api/card/getTranslationSuggestions', async (request, reply) => {
  const word = request.query.word;
  if(!word) {
    reply.status(400).send('Missing word parameter');
    return;
  }
  const openAiService = new OpenAiService();
  const suggestions = await openAiService.getTranslationSuggestions(word);
  return { suggestions }
});

fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send('Route not found');
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT });
    fastify.log.info('Server is listening on port ' + PORT);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  reply.status(500).send({ error: 'Internal Server Error' })
})

start();