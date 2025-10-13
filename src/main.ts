import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    
  // 💡 ADD THIS LINE TO ENABLE CORS
  app.enableCors({
    origin: '*', // 🛑 TEMPORARY: This allows all domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Note: Setting credentials: true with origin: '*' can cause issues in some browsers
  }); 

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
