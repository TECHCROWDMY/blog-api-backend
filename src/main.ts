import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    
  // 💡 ADD THIS LINE TO ENABLE CORS
  app.enableCors({
    origin: ['https://blog-api-saas.vercel.app', 'http://localhost:3001'], // Allows all origins, or set to a specific array of domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Allowed methods
    credentials: true, // Allows cookies/authorization headers
  }); 

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
