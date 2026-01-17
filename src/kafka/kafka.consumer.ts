import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka } from "kafkajs";

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private kafka = new Kafka({
    clientId: "backend-service",
    brokers: ["localhost:9092"],
  });

  private consumer = this.kafka.consumer({
    groupId: "order-created-group",
  });

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: "order.created" });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());
        console.log("📦 Order Created Event:", payload);
      },
    });

    console.log("✅ Kafka consumer started");
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
