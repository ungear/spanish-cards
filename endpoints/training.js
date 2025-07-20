import { DbService } from '../services/dbService.js';
import { levelupCard } from '../services/trainingService.js';

export default async function trainingRoutes(fastify, options) {
  const dbService = new DbService();

  // Get cards for training
  fastify.get('/', {
    config: { requireAuth: true },
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
      const userId = request.userId;
      const cards = await dbService.getCardsToTrain(userId);
      return cards;
    } catch (error) {
      fastify.log.error(`Error retrieving cards: ${error.message}`);
      reply.status(500).send({ error: 'Failed to create training' });
    }
  });

  // Update card level
  fastify.post('/cardLevelup', {
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
} 