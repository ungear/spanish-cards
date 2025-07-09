import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import path from 'path';
import { fileURLToPath } from 'url'; // Import this to handle __dirname equivalent
import { OpenAiService } from './services/openAiService.js';
import { DbService } from './services/dbService.js';
import {PORT} from './settings.js';
import { levelupCard } from './services/trainingService.js';
import { userService } from './services/userService.js';
import { jwtService } from './services/jwtService.js';
// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Serve static files from the ./public folder
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  //prefix: '/public/', // Optional: adds a prefix to access static files
});
fastify.register(fastifyCookie, {
  hook: 'preValidation',
  //secret: "my-secret",
})

fastify.addHook('preValidation', async (request, reply) => {
  if (request.routeOptions.config?.requireAuth) {
    const token = request.cookies[AUTH_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    const payload = await jwtService.verifyToken(token);
    if (!payload) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    request.userId = payload.userId;
  } 
});

// Initialize database service
const dbService = new DbService();

const AUTH_COOKIE_NAME = 'spanish-cards-auth';

// New endpoint to get all cards
fastify.get('/api/card', { config: { requireAuth: true } }, async (request, reply) => {
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

fastify.post('/api/card/resetAll', async (request, reply) => {
  try {
    await dbService.resetAllCards();
    return { success: true };
  } catch (error) {
    fastify.log.error(`Error resetting cards: ${error.message}`);
    reply.status(500).send({ error: 'Failed to reset cards' });
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

// create user
fastify.post('/api/user', async (request, reply) => {
  const { name, email, password } = request.body;
  console.log(name, email, password);
  if (!name || !email || !password) {
    reply.status(400).send('Missing required fields');
    return;
  }

  try {
    const userId = await userService.createUser(name, email, password, dbService);
    return userId;
  } catch (error) {
    fastify.log.error(`Error creating user: ${error.message}`);
    reply.status(500).send({ error: 'Failed to create user' });
  }
});

// login user
fastify.post('/api/user/login', async (request, reply) => {
  const { email, password } = request.body;
  if (!email || !password) {
    reply.status(400).send('Missing required fields');
    return;
  }
  try {
    const authData = await userService.loginUser(email, password, dbService);
    if(!authData) {
      reply.status(401).send('Invalid credentials');
      return;
    }
    reply.setCookie(AUTH_COOKIE_NAME, authData.jwt, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      signed: false,
    });
    return authData.userData;
  } catch (error) {
    fastify.log.error(`Error logging in user: ${error.message}`);
    reply.status(500).send({ error: 'Failed to login user' });
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