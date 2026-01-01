import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OpenAiService } from '../services/openAiService.js';

export default async function numbersRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/number
  fastify.get('/api/number', {
    config: { requireAuth: true },
    schema: {
      tags: ['numbers'],
      summary: 'Get random number with audio',
      description: 'Generate a random number from 1000 to 10000 and return its Spanish audio pronunciation',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            number: { type: 'integer', description: 'The generated random number' },
            audio: { type: 'string', description: 'Base64 encoded audio data' }
          },
          required: ['number', 'audio']
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
      // Generate a random number from 1000 to 10000
      const number = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
      
      // Get audio for the number
      const openAiService = new OpenAiService();
      const audioBuffer = await openAiService.getNumberAudio(number);
      
      // Convert audio buffer to base64
      const audioBase64 = audioBuffer.toString('base64');
      
      return {
        number,
        audio: audioBase64
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error generating number audio: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to generate number audio' });
    }
  });
}

