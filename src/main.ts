import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cors Protections //
  const corsOptions: CorsOptions = {
    origin: 'https://beatflow.online',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  };

  app.enableCors(); //  corsOptions must be add, but for dev mode it enable now.

  //
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(
    app.get(Reflector),
    {
      strategy: 'excludeAll',
      excludeExtraneousValues: true,
    }
  ));

  await app.listen(3001);
}

bootstrap();
