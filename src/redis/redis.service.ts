import { Injectable, OnModuleDestroy } from "@nestjs/common";
import {Redis} from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: "127.0.0.1",
      port: 6379,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, data, "EX", ttlSeconds);
    } else {
      await this.client.set(key, data);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }

  // ✅ ADD THIS
  async delByPrefix(prefix: string) {
    const keys = await this.client.keys(`${prefix}*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
