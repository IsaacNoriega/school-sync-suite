import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disallowed for API servers that do not serve HTML pages
    crossOriginEmbedderPolicy: false,
  }));

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global pipe validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
