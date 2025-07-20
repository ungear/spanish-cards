import { DbService } from '../services/dbService.js';
import { userService } from '../services/userService.js';

export default async function userRoutes(fastify, options) {
  const dbService = new DbService();
  const AUTH_COOKIE_NAME = 'spanish-cards-auth';

  // Logout user
  fastify.get('/logout', {
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

  // Get current user
  fastify.get('/current', {
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

  // Create user
  fastify.post('/', {
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

  // Login user
  fastify.post('/login', {
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
} 