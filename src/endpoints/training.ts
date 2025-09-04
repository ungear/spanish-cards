import { DbService } from '../services/dbService.js';
import { levelupCard, leveldownCard } from '../services/trainingService.js';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function trainingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const dbService = new DbService();

  // Get cards for training
  fastify.get('/api/training', {
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
      const userId = request.userId as string;
      const cards = await dbService.getCardsToTrain(userId);
      return cards;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error retrieving cards: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to create training' });
    }
  });

  // Update card level
  fastify.post<{
    Body: { id: number, level: number }
  }>('/api/training/cardLevelup', {
    config: { requireAuth: true },
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
          type: 'boolean',
          description: 'The card level was updated successfully'
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
      await dbService.updateCardLevel(id.toString(), newLevel, newRepeatDate);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error upgrading card: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to upgrade the card' });
    }
  });


  fastify.post<{
    Body: { id: number }
  }>('/api/training/cardLeveldown', {
    config: { requireAuth: true },
    schema: {
      tags: ['training'],
      summary: 'Downgrade card level',
      description: 'Downgrade the level of a card',
      body: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'The card ID' }
        }
      },  
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
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
    const { id } = request.body;
    if (!id) {
      reply.status(400).send('Missing required fields');
      return;
    }
    const { newLevel, newRepeatDate } = leveldownCard();
    await dbService.updateCardLevel(id.toString(), newLevel, newRepeatDate);
  });
} 