import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as dns from "dns";
import { AppModule } from "./app.module";

async function bootstrap() {
  // Shared hosting environments often have broken IPv6 routing.
  // Force DNS resolution to prefer IPv4 so outbound HTTPS fetches (Supabase) don't fail.
  if (typeof (dns as any).setDefaultResultOrder === "function") {
    (dns as any).setDefaultResultOrder("ipv4first");
  }

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const rawOrigins = [
    config.get<string>("FRONTEND_ORIGIN_DEV"),
    config.get<string>("FRONTEND_ORIGIN_PROD"),
  ].filter((value): value is string => Boolean(value));
  // Normalize so they match browser Origin (no trailing slash); trim env whitespace
  const frontendOrigins = rawOrigins.map((o) => o.trim().replace(/\/+$/, ""));

  // Enable CORS for frontend communication
  app.enableCors({
    origin: frontendOrigins.length > 0 ? frontendOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  // Global validation pipe with Zod integration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Go Trippin API")
    .setDescription("Backend API for Go Trippin travel planner")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter your Supabase access token",
        in: "header",
      },
      "JWT-auth" // This name will be used in @ApiBearerAuth() decorators
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps the token even after page refresh
    },
  });

  const port = process.env.PORT || 3001;
  
  // Add error handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Working directory: ${process.cwd()}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
