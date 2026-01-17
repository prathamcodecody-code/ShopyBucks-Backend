import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka, Producer } from "kafkajs";

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: "shopybucks-backend",
      brokers: ["localhost:9092"],
    });

    this.producer = kafka.producer();
    await this.producer.connect();

    console.log("✅ Kafka Producer connected");
  }

  async emit(topic: string, payload: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}
