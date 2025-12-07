import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OpenAiService } from '../services/openAiService.js';

export enum WritingTopic {
  Presente,
  PretIndef,
  PretImperf,
  Perf,
  Imperativo,
}

export const WritingTopicLabels: Record<WritingTopic, string> = {
  [WritingTopic.Presente]: 'Presente',
  [WritingTopic.PretIndef]: 'Pret. Indefinido',
  [WritingTopic.PretImperf]: 'Pret. Imperfecto',
  [WritingTopic.Perf]: 'Pret. Perfecto',
  [WritingTopic.Imperativo]: 'Imperativo'
};

/**
 * Safely converts an array of strings to WritingTopic enum values
 * @param topicStrings Array of string values to convert
 * @returns Array of valid WritingTopic enum values
 * @throws Error if any invalid topic values are found
 */
function convertToWritingTopics(topicStrings: string[]): WritingTopic[] {
  const validTopics: WritingTopic[] = [];
  const invalidTopics: string[] = [];
  
  // Get all valid enum numeric values from WritingTopicLabels keys
  const validEnumValues = Object.keys(WritingTopicLabels).map(key => Number(key)).filter(val => !isNaN(val));
  
  for (const topicString of topicStrings) {
    // Try to parse as number (since enum values are numeric)
    const numericValue = Number(topicString);
    
    // Check if it's a valid integer and exists in valid enum values
    if (!isNaN(numericValue) && Number.isInteger(numericValue) && validEnumValues.includes(numericValue)) {
      validTopics.push(numericValue as WritingTopic);
    } else {
      invalidTopics.push(topicString);
    }
  }
  
  if (invalidTopics.length > 0) {
    throw new Error(`Invalid topic values: ${invalidTopics.join(', ')}. Valid values are: ${validEnumValues.join(', ')}`);
  }
  
  return validTopics;
}

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
            writingTask: { type: 'string' }
          },
          required: ['writingTask']
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

      // Safely convert string array to WritingTopic enum array
      let validTopics: WritingTopic[];
      try {
        validTopics = convertToWritingTopics(topics);
      } catch (conversionError) {
        const errorMessage = conversionError instanceof Error ? conversionError.message : 'Invalid topic values';
        reply.status(400).send({ error: errorMessage });
        return;
      }

      const openAiService = new OpenAiService();
      const writingTask = await openAiService.getWritingTask(validTopics);
      return { writingTask };
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
          properties: {
            topics: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return { topics: WritingTopicLabels };
  });
}

