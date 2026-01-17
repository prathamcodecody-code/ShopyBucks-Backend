import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "shopybucks-backend",
  brokers: ["localhost:9092"],
});
