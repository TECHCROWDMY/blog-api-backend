import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    
  app.enableCors({
    // Use a function to dynamically check the origin
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3001',      // Your frontend dev server (if it runs on HTTP)
        'http://localhost:3000',      // Just in case it runs on the default port
        'https://blog-api-saas.vercel.app', // HTTPS for Vercel
        'http://blog-api-saas.vercel.app'  // In case Vercel redirects or for testing
      ];

      // Allow requests with no origin (e.g., Postman, server-to-server) OR if the origin is in the list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // This will trigger the CORS error
        callback(new Error('Not allowed by CORS')); 
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
