import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifyFormBody from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
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

// Register Swagger plugins FIRST, before any routes
await fastify.register(fastifySwagger, {
  swagger: {
    info: { title: 'Spanish Cards API', description: 'API for managing Spanish vocabulary cards and training', version: '1.0.0' },
    host: 'localhost:' + PORT,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'cards', description: 'Card management endpoints' },
      { name: 'training', description: 'Training and learning endpoints' },
      { name: 'users', description: 'User authentication and management' },
    ],
    securityDefinitions: {
      cookieAuth: {
        type: 'apiKey',
        name: 'spanish-cards-auth',
        in: 'cookie'
      }
    }
  }
});
await fastify.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
  uiConfig: { docExpansion: 'list', deepLinking: true, tryItOutEnabled: true }
});

// Serve static files from the ./public folder
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  //prefix: '/public/', // Optional: adds a prefix to access static files
});
fastify.register(fastifyCookie, {
  hook: 'preValidation',
  //secret: "my-secret",
})
fastify.register(fastifyFormBody);

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
fastify.get('/api/card', {
  config: { requireAuth: true },
  schema: {
    tags: ['cards'],
    summary: 'Get all cards',
    description: 'Retrieve all vocabulary cards for the authenticated user',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            word: { type: 'string' },
            translation: { type: 'string' },
            example: { type: 'string' },
            level: { type: 'integer' },
            next_repeat: { type: 'string' }
          }
        }
      },
      401: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const userId = request.userId;
    const cards = await dbService.getAllCards(userId);
    return cards;
  } catch (error) {
    fastify.log.error(`Error retrieving cards: ${error.message}`);
    reply.status(500).send({ error: 'Failed to retrieve cards' });
  }
});

fastify.get('/api/card/getArticle', {
  schema: {
    tags: ['cards'],
    summary: 'Get Spanish article for a word',
    description: 'Determine the correct Spanish article (el/la) for a given word',
    querystring: {
      type: 'object',
      required: ['word'],
      properties: {
        word: { type: 'string', description: 'The Spanish word to get the article for' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          article: { type: 'string', description: 'The correct Spanish article (el or la)' }
        }
      },
      400: {
        type: 'string',
        description: 'Missing word parameter'
      }
    }
  }
}, async (request, reply) => {
  const word = request.query.word;
  if (!word) {
    reply.status(400).send('Missing word parameter');
    return;
  }
  const openAiService = new OpenAiService();
  const article = await openAiService.getArticle(word);
  return { article };
});

fastify.get('/api/card/getTranslationSuggestions', {
  schema: {
    tags: ['cards'],
    summary: 'Get translation suggestions',
    description: 'Get translation suggestions for a Spanish word',
    querystring: {
      type: 'object',
      required: ['word'],
      properties: {
        word: { type: 'string', description: 'The Spanish word to get translations for' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: { 
              translation: 'string',
              example: 'string'
            },
            description: 'List of translation suggestions'
          }
        }
      },
      400: {
        type: 'string',
        description: 'Missing word parameter'
      }
    }
  }
}, async (request, reply) => {
  const word = request.query.word;
  if (!word) {
    reply.status(400).send('Missing word parameter');
    return;
  }
  const openAiService = new OpenAiService();
  const suggestions = await openAiService.getTranslationSuggestions(word);
  return suggestions;
});

fastify.post('/api/card', {
  schema: {
    tags: ['cards'],
    summary: 'Create a new card',
    description: 'Add a new vocabulary card to the database',
    body: {
      type: 'object',
      required: ['word', 'translation'],
      properties: {
        word: { type: 'string', description: 'The Spanish word' },
        translation: { type: 'string', description: 'The English translation' },
        example: { type: 'string', description: 'Example sentence (optional)' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          cardId: { type: 'integer' }
        }
      },
      400: {
        type: 'string',
        description: 'Missing required fields'
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
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

fastify.post('/api/card/resetAll', {
  schema: {
    tags: ['cards'],
    summary: 'Reset all cards',
    description: 'Reset the level and repeat date for all cards',
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' }
        }
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    await dbService.resetAllCards();
    return { success: true };
  } catch (error) {
    fastify.log.error(`Error resetting cards: ${error.message}`);
    reply.status(500).send({ error: 'Failed to reset cards' });
  }
});

fastify.get('/api/training', {
  schema: {
    tags: ['training'],
    summary: 'Get cards for training',
    description: 'Retrieve cards that are ready for training based on their repeat date',
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            word: { type: 'string' },
            translation: { type: 'string' },
            example: { type: 'string' },
            level: { type: 'integer' },
            repeatDate: { type: 'string' }
          }
        }
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const cards = await dbService.getCardsToTrain();
    return cards;
  } catch (error) {
    fastify.log.error(`Error retrieving cards: ${error.message}`);
    reply.status(500).send({ error: 'Failed to create training' });
  }
});

fastify.post('/api/training/cardLevelup', {
  schema: {
    tags: ['training'],
    summary: 'Update card level',
    description: 'Update the level and repeat date of a card after training',
    body: {
      type: 'object',
      required: ['id', 'level'],
      properties: {
        id: { type: 'integer', description: 'The card ID' },
        level: { type: 'integer', description: 'The current level of the card' }
      }
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            word: { type: 'string' },
            translation: { type: 'string' },
            example: { type: 'string' },
            level: { type: 'integer' },
            repeatDate: { type: 'string' }
          }
        }
      },
      400: {
        type: 'string',
        description: 'Missing required fields'
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
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

fastify.get('/api/user/logout', {
  schema: {
    tags: ['users'],
    summary: 'Logout user',
    description: 'Clear authentication cookie and redirect to home page',
    response: {
      302: {
        description: 'Redirect to home page'
      }
    }
  }
}, async (request, reply) => {
  reply.clearCookie(AUTH_COOKIE_NAME);
  reply.redirect('/index.html');
});

fastify.get('/api/user/current', {
  config: { requireAuth: true },
  schema: {
    tags: ['users'],
    summary: 'Get current user',
    description: 'Retrieve information about the currently authenticated user',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' }
        }
      },
      401: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const userId = request.userId;
  const user = await dbService.getUserById(userId);
  return user;
});

// create user
fastify.post('/api/user', {
  schema: {
    tags: ['users'],
    summary: 'Create new user',
    description: 'Register a new user account',
    body: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', description: 'User\'s full name' },
        email: { type: 'string', format: 'email', description: 'User\'s email address' },
        password: { type: 'string', description: 'User\'s password' }
      }
    },
    response: {
      302: {
        description: 'Redirect to login page on success'
      },
      400: {
        type: 'string',
        description: 'Missing required fields'
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const { name, email, password } = request.body;
  console.log(name, email, password);
  if (!name || !email || !password) {
    reply.status(400).send('Missing required fields');
    return;
  }

  try {
    await userService.createUser(name, email, password, dbService);
    reply.redirect('/login.html');
  } catch (error) {
    fastify.log.error(`Error creating user: ${error.message}`);
    reply.status(500).send({ error: 'Failed to create user' });
  }
});

// login user
fastify.post('/api/user/login', {
  schema: {
    tags: ['users'],
    summary: 'Login user',
    description: 'Authenticate user and set authentication cookie',
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', description: 'User\'s email address' },
        password: { type: 'string', description: 'User\'s password' }
      }
    },
    response: {
      302: {
        description: 'Redirect to home page on successful login'
      },
      400: {
        type: 'string',
        description: 'Missing required fields'
      },
      401: {
        type: 'string',
        description: 'Invalid credentials'
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
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
    reply.redirect('/index.html');
  } catch (error) {
    fastify.log.error(`Error logging in user: ${error.message}`);
    reply.status(500).send({ error: 'Failed to login user' });
  }
});

fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send('Route not found');
});

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

await fastify.ready()
fastify.swagger()



const start = async () => {
  try {
    await fastify.listen({ port: PORT });
    fastify.log.info('Server is listening on port ' + PORT);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();