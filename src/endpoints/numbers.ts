import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OpenAiService } from '../services/openAiService.js';

export default async function numbersRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/number
  fastify.get('/api/number', {
    config: { requireAuth: true },
    schema: {
      tags: ['numbers'],
      summary: 'Get random number with audio',
      description: 'Generate a random number based on the Range parameter (XX: 10-99, XXX: 100-999, XXXX: 1000-9999) and return its Spanish audio pronunciation',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          Range: {
            type: 'string',
            enum: ['XX', 'XXX', 'XXXX'],
            description: 'Number range: XX (10-99), XXX (100-999), XXXX (1000-9999)'
          }
        }
      },
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
      // Get the Range parameter from query string, default to 'XXXX' for backward compatibility
      const range = (request.query as { Range?: string })?.Range || 'XXXX';
      
      // Generate a random number based on the range
      let min: number, max: number;
      switch (range) {
        case 'XX':
          min = 10;
          max = 99;
          break;
        case 'XXX':
          min = 100;
          max = 999;
          break;
        case 'XXXX':
          min = 1000;
          max = 9999;
          break;
        default:
          // Default to XXXX range if invalid value
          min = 1000;
          max = 9999;
      }
      
      const number = Math.floor(Math.random() * (max - min + 1)) + min;
      
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

