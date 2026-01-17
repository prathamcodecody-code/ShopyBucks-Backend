import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { join } from "path";
import * as express from "express";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as dotenv from "dotenv";
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ REQUIRED BEHIND NGINX / CLOUDFLARE
  const server = app.getHttpAdapter().getInstance();
  server.set("trust proxy", 1);

  // ================= CORS =================
  app.enableCors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://adminv2.shopybucks.com",
    "https://www.shopybucks.com",
    "http://seller.shopybucks.com"
  ],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
});



  // ================= STATIC FILES =================
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  // ================= VALIDATION =================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  console.log("🔑 RAZORPAY_KEY_ID =", process.env.RAZORPAY_KEY_ID);
console.log(
  "🔑 RAZORPAY_KEY_SECRET exists =",
  !!process.env.RAZORPAY_KEY_SECRET
);

  // ================= SWAGGER =================
  const config = new DocumentBuilder()
    .setTitle("ShopyBucks API")
    .setDescription("E-commerce backend API documentation")
    .setVersion("1.0")
    .addServer("http://apiv2.shopybucks.com") // 👈 IMPORTANT
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);


  // ================= START SERVER =================
  const PORT = process.env.PORT || 3031;
  await app.listen(PORT, "0.0.0.0");

  console.log(`🚀 Backend running on port ${PORT}`);
}

bootstrap();

