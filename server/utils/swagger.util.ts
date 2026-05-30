interface SwaggerOptions {
    appName: string
    appUrl: string
}

export function createOpenApiSpec({ appName, appUrl }: SwaggerOptions) {
    return {
        openapi: '3.0.3',
        info: {
            title: `${appName} API`,
            version: '1.0.0',
            description: 'API documentation generated for Nuxt/Nitro server routes.',
        },
        servers: [
            {
                url: appUrl,
            },
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints',
            },
            {
                name: 'Documentation',
                description: 'OpenAPI and Swagger UI endpoints',
            },
        ],
        paths: {
            '/api/healthcheck': {
                get: {
                    tags: ['Health'],
                    summary: 'Service health endpoint',
                    responses: {
                        200: {
                            description: 'Service is healthy',
                        },
                    },
                },
            },
            '/api/openapi.json': {
                get: {
                    tags: ['Documentation'],
                    summary: 'OpenAPI JSON specification',
                    responses: {
                        200: {
                            description: 'OpenAPI specification payload',
                        },
                    },
                },
            },
            '/api/docs': {
                get: {
                    tags: ['Documentation'],
                    summary: 'Swagger UI',
                    responses: {
                        200: {
                            description: 'Swagger UI HTML',
                        },
                    },
                },
            },
        },
    }
}

export function createSwaggerHtml() {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body { margin: 0; padding: 0; }
      #swagger-ui { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
      });
    </script>
  </body>
</html>`
}
