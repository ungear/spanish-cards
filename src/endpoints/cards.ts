import { OpenAiService } from '../services/openAiService.js';
import { DbService } from '../services/dbService.js';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function cardsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const dbService = new DbService();

  // Get all cards
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
      const userId = request.userId as string;
      const cards = await dbService.getAllCards(userId);
      return cards;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error retrieving cards: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to retrieve cards' });
    }
  });

  // Get Spanish article for a word
  fastify.get<{
    Querystring: { word: string }
  }>('/api/card/getArticle', {
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
    const word = request.query.word as string;
    if (!word) {
      reply.status(400).send('Missing word parameter');
      return;
    }
    const openAiService = new OpenAiService();
    const article = await openAiService.getArticle(word);
    return { article };
  });

  // Get translation suggestions
  fastify.get<{
    Querystring: { word: string }
  }>('/api/card/getTranslationSuggestions', {
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

  // Create a new card
  fastify.post<{
    Body: { word: string, translation: string, example: string }
  }>('/api/card', {
    config: { requireAuth: true },
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
    const userId = request.userId;

    if (!word || !translation) {
      reply.status(400).send('Missing required fields');
      return;
    }

    try {
      const cardId = dbService.saveCard(word, translation, example, userId as string);
      console.log(`Card saved with ID: ${cardId}`, { word, translation, example, userId });
      return { success: true, cardId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error saving card: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to save card' });
    }
  });

  // Update an existing card
  fastify.put<{
    Params: { id: string },
    Body: { word: string, translation: string, example: string }
  }>('/api/card/:id', {
    config: { requireAuth: true },
    schema: {
      tags: ['cards'],
      summary: 'Update a card',
      description: 'Update an existing vocabulary card',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'The card ID to update' }
        }
      },
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
            message: { type: 'string' }
          }
        },
        400: {
          type: 'string',
          description: 'Missing required fields'
        },
        404: {
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
    const { id } = request.params;
    const { word, translation, example } = request.body;

    if (!word || !translation) {
      reply.status(400).send('Missing required fields');
      return;
    }

    try {
      const changes = dbService.updateCard(id, word, translation, example);
      
      if (changes === 0) {
        reply.status(404).send({ error: 'Card not found' });
        return;
      }

      return { success: true, message: 'Card updated successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error updating card: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to update card' });
    }
  });

  // Reset all cards
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error resetting cards: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to reset cards' });
    }
  });
} 