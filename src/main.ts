import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields from body
      forbidNonWhitelisted: true, // throw error if unknown fields sent
      transform: true, // auto-coerce types (string '5' → number 5)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Register filters (order matters — most specific first, catch-all last)
  app.useGlobalFilters(
    new AllExceptionsFilter(), // catches any unhandled exceptions
    new PrismaExceptionFilter(), // catches Prisma errors
    new HttpExceptionFilter(), // catches NestJS HTTP exceptions
  );

  // Transform all responses to standardized format { success, data }
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Financial Records API')
    .setDescription('REST API with RBAC for managing financial records')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerUrl: '/api/docs-json',
    customCss: `
      .topbar { display: none; }
    `,
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js'
    ],
    customCssUrl: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css'
    ]
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
void bootstrap();
