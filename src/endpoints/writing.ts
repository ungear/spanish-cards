import { FastifyInstance, FastifyPluginOptions } from 'fastify';

enum WritingTopic {
  Presente = 'presente',
  PretIndef = 'pret-indef',
  PretImperf = 'pret-imperf',
  Perf = 'perf',
  Imperativo = 'imperativo'
}

const WritingTopicLabels: Record<WritingTopic, string> = {
  [WritingTopic.Presente]: 'Presente',
  [WritingTopic.PretIndef]: 'Pret. Indefinido',
  [WritingTopic.PretImperf]: 'Pret. Imperfecto',
  [WritingTopic.Perf]: 'Pret. Perfecto',
  [WritingTopic.Imperativo]: 'Imperativo'
};

export default async function writingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // POST /api/writing
  fastify.post<{
    Body: { topics: string[] }
  }>('/api/writing', {
    config: { requireAuth: true },
    schema: {
      tags: ['writing'],
      summary: 'Create writing exercise',
      description: 'Create a writing exercise based on selected topics',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['topics'],
        properties: {
          topics: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of topic strings for the writing exercise'
          }
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
          type: 'object',
          properties: {
            error: { type: 'string' }
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
      const { topics } = request.body;
      console.log(topics);
      if (!topics || !Array.isArray(topics) || topics.length === 0) {
        reply.status(400).send({ error: 'Topics array is required and must not be empty' });
        return;
      }

      // TODO: Implement writing exercise logic here
      // For now, just return success
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error creating writing exercise: ${errorMessage}`);
      reply.status(500).send({ error: 'Failed to create writing exercise' });
    }
  });

  // GET /api/writing/getConfig
  fastify.get('/api/writing/getConfig', {
    schema: {
      tags: ['writing'],
      summary: 'Get writing config',
      description: 'Get writing configuration',
      response: {
        200: {
          type: 'object',
          additionalProperties: {
            type: 'string'
          }
        }
      }
    }
  }, async (request, reply) => {
    return WritingTopicLabels;
  });
}

