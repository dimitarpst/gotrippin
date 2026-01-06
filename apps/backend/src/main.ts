import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://gotrippin.app',
      'https://gotrippin.maxprogress.bg', // if you still use this
    ],
    credentials: true,
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
  const config = new DocumentBuilder()
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
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps the token even after page refresh
    },
  });

  await app.listen(3001);
  console.log("🚀 Backend server running on http://localhost:3001");
  console.log("📚 Swagger docs available at http://localhost:3001/api");
}

bootstrap();
