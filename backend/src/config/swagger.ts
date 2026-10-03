import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ENDIAMA Notícias — API",
      version: "1.0.0",
      description:
        "API REST do Portal de Notícias da ENDIAMA E.P. Inclui API pública (consumida pelo portal) e API administrativa (consumida pelo painel de gestão de conteúdos), com autenticação JWT, controlo de permissões por perfil e fluxo editorial completo.",
    },
    servers: [{ url: `${env.apiBaseUrl}/api`, description: "Servidor actual" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "array", items: { type: "object" } },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
                hasNextPage: { type: "boolean" },
                hasPreviousPage: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Autenticação e sessão" },
      { name: "Public", description: "API pública consumida pelo portal" },
      { name: "News", description: "Gestão editorial de notícias" },
      { name: "Uploads", description: "Carregamento de ficheiros" },
    ],
  },
  apis: [path.join(__dirname, "..", "modules", "**", "*.routes.ts"), path.join(__dirname, "..", "modules", "**", "*.routes.js")],
});
