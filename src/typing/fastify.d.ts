import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
  
  interface FastifyContextConfig {
    requireAuth?: boolean;
  }
  
  interface FastifyRouteConfig {
    requireAuth?: boolean;
  }
}
