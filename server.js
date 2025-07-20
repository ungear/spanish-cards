import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifyFormBody from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url'; // Import this to handle __dirname equivalent
import {PORT} from './settings.js';
import { jwtService } from './services/jwtService.js';
import { cardsRoutes, trainingRoutes, userRoutes } from './endpoints/index.js';
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

const AUTH_COOKIE_NAME = 'spanish-cards-auth';

// Register route plugins
await fastify.register(cardsRoutes);
await fastify.register(trainingRoutes);
await fastify.register(userRoutes);

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