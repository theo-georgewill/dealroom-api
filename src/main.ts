import { 
  ValidationPipe,
  VersioningType
 } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  console.log("1. Before NestFactory.create");
  const app = await NestFactory.create(AppModule);
  console.log("2. After NestFactory.create");
  app.use(cookieParser());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://dealroom-1osvogmj2-tedtek.vercel.app',
    ],
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  console.log("3. Before Swagger");
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Deal Room API')
    .setDescription(
      'API documentation for the Deal Room escrow platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  console.log("4. After Swagger");
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log("5. Before listen");
  await app.listen(process.env.PORT ?? 3000);


  console.log("6. Server listening on", process.env.PORT); 
  
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger docs available at http://localhost:${process.env.PORT ?? 3000}/docs`,
  );
}

bootstrap();