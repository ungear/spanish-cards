import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url'; // Import this to handle __dirname equivalent
import { OpenAiService } from './services/openAiService.js';
import { DbService } from './services/dbService.js';
import {PORT} from './settings.js';
import { levelupCard } from './services/trainingService.js';
// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Serve static files from the ./public folder
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  //prefix: '/public/', // Optional: adds a prefix to access static files
});

// Initialize database service
const dbService = new DbService();

// New endpoint to get all cards
fastify.get('/api/card', async (request, reply) => {
  try {
    const cards = await dbService.getAllCards();
    return cards;
  } catch (error) {
    fastify.log.error(`Error retrieving cards: ${error.message}`);
    reply.status(500).send({ error: 'Failed to retrieve cards' });
  }
});

fastify.get('/api/card/getArticle', async (request, reply) => {
  const word = request.query.word;
  if (!word) {
    reply.status(400).send('Missing word parameter');
    return;
  }
  const openAiService = new OpenAiService();
  const article = await openAiService.getArticle(word);
  return { article };
});

fastify.get('/api/card/getTranslationSuggestions', async (request, reply) => {
  const word = request.query.word;
  if (!word) {
    reply.status(400).send('Missing word parameter');
    return;
  }
  const openAiService = new OpenAiService();
  const suggestions = await openAiService.getTranslationSuggestions(word);
  return suggestions;
});

fastify.post('/api/card', async (request, reply) => {
  const { word, translation, example } = request.body;
  
  if (!word || !translation) {
    reply.status(400).send('Missing required fields');
    return;
  }

  try {
    const cardId = dbService.saveCard(word, translation, example);
    console.log(`Card saved with ID: ${cardId}`, { word, translation, example });
    return { success: true, cardId };
  } catch (error) {
    fastify.log.error(`Error saving card: ${error.message}`);
    reply.status(500).send({ error: 'Failed to save card' });
  }
});

fastify.get('/api/training', async (request, reply) => {
  try {
    const cards = await dbService.getCardsToTrain();
    return cards;
  } catch (error) {
    fastify.log.error(`Error retrieving cards: ${error.message}`);
    reply.status(500).send({ error: 'Failed to create training' });
  }
});

fastify.post('/api/training/cardLevelup', async (request, reply) => {
  const { id, level } = request.body;
  if (!id || typeof level === "undefined") {
    reply.status(400).send('Missing required fields');
    return;
  }

  const {newLevel, newRepeatDate} = levelupCard(level);

  try {
    const cards = await dbService.updateCardLevel(id, newLevel, newRepeatDate);
    return cards;
  } catch (error) {
    fastify.log.error(`Error upgrading card: ${error.message}`);
    reply.status(500).send({ error: 'Failed to upgrade the card' });
  }
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
  fastify.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

start();