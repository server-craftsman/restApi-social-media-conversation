import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get('app.redis.host') || 'localhost',
            port: this.configService.get('app.redis.port') || 6379,
            password: this.configService.get('app.redis.password') || undefined,
            db: this.configService.get('app.redis.db') || 0,
            keyPrefix: this.configService.get('app.redis.keyPrefix') || 'smartchat:',
            maxRetriesPerRequest: this.configService.get('app.redis.maxRetriesPerRequest') || 3,
            enableReadyCheck: this.configService.get('app.redis.enableReadyCheck') !== false,
        });

        this.redis.on('connect', () => {
            this.logger.log('Redis connected successfully');
        });

        this.redis.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });

        this.redis.on('ready', () => {
            this.logger.log('Redis is ready');
        });
    }

    // Basic Redis operations
    async set(key: string, value: string, ttl?: number): Promise<void> {
        try {
            if (ttl) {
                await this.redis.setex(key, ttl, value);
            } else {
                await this.redis.set(key, value);
            }
        } catch (error) {
            this.logger.error(`Error setting key ${key}:`, error);
            throw error;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.redis.get(key);
        } catch (error) {
            this.logger.error(`Error getting key ${key}:`, error);
            throw error;
        }
    }

    async del(key: string): Promise<number> {
        try {
            return await this.redis.del(key);
        } catch (error) {
            this.logger.error(`Error deleting key ${key}:`, error);
            throw error;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(`Error checking existence of key ${key}:`, error);
            throw error;
        }
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        try {
            const result = await this.redis.expire(key, seconds);
            return result === 1;
        } catch (error) {
            this.logger.error(`Error setting expiry for key ${key}:`, error);
            throw error;
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            return await this.redis.ttl(key);
        } catch (error) {
            this.logger.error(`Error getting TTL for key ${key}:`, error);
            throw error;
        }
    }

    // Cache operations
    async setCache(key: string, data: any, ttl: number = 300): Promise<void> {
        try {
            const serializedData = JSON.stringify(data);
            await this.redis.setex(key, ttl, serializedData);
            this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
        } catch (error) {
            this.logger.error(`Error setting cache for key ${key}:`, error);
            throw error;
        }
    }

    async getCache<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redis.get(key);
            if (data) {
                this.logger.debug(`Cache hit: ${key}`);
                return JSON.parse(data) as T;
            }
            this.logger.debug(`Cache miss: ${key}`);
            return null;
        } catch (error) {
            this.logger.error(`Error getting cache for key ${key}:`, error);
            throw error;
        }
    }

    async deleteCache(key: string): Promise<void> {
        try {
            await this.redis.del(key);
            this.logger.debug(`Cache deleted: ${key}`);
        } catch (error) {
            this.logger.error(`Error deleting cache for key ${key}:`, error);
            throw error;
        }
    }

    async clearCache(pattern: string = '*'): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.debug(`Cache cleared: ${keys.length} keys`);
            }
        } catch (error) {
            this.logger.error(`Error clearing cache with pattern ${pattern}:`, error);
            throw error;
        }
    }

    // Rate limiting operations
    async incrementRateLimit(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
        try {
            const now = Date.now();
            const windowStart = Math.floor(now / windowMs) * windowMs;
            const resetTime = windowStart + windowMs;

            const multi = this.redis.multi();
            multi.zadd(key, now, now.toString());
            multi.zremrangebyscore(key, 0, windowStart - 1);
            multi.zcard(key);
            multi.expire(key, Math.ceil(windowMs / 1000));

            const results = await multi.exec();
            if (!results) {
                throw new Error('Redis multi exec failed');
            }
            const count = results[2][1] as number;

            return { count, resetTime };
        } catch (error) {
            this.logger.error(`Error incrementing rate limit for key ${key}:`, error);
            throw error;
        }
    }

    async getRateLimit(key: string): Promise<{ count: number; resetTime: number }> {
        try {
            const now = Date.now();
            const windowMs = this.configService.get('app.rateLimit.windowMs') || 900000;
            const windowStart = Math.floor(now / windowMs) * windowMs;
            const resetTime = windowStart + windowMs;

            const multi = this.redis.multi();
            multi.zremrangebyscore(key, 0, windowStart - 1);
            multi.zcard(key);

            const results = await multi.exec();
            if (!results) {
                throw new Error('Redis multi exec failed');
            }
            const count = results[1][1] as number;

            return { count, resetTime };
        } catch (error) {
            this.logger.error(`Error getting rate limit for key ${key}:`, error);
            throw error;
        }
    }

    // Session management
    async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
        try {
            const serializedData = JSON.stringify(data);
            await this.redis.setex(`session:${sessionId}`, ttl, serializedData);
        } catch (error) {
            this.logger.error(`Error setting session ${sessionId}:`, error);
            throw error;
        }
    }

    async getSession<T>(sessionId: string): Promise<T | null> {
        try {
            const data = await this.redis.get(`session:${sessionId}`);
            return data ? JSON.parse(data) as T : null;
        } catch (error) {
            this.logger.error(`Error getting session ${sessionId}:`, error);
            throw error;
        }
    }

    async deleteSession(sessionId: string): Promise<void> {
        try {
            await this.redis.del(`session:${sessionId}`);
        } catch (error) {
            this.logger.error(`Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }

    // Pub/Sub operations
    async publish(channel: string, message: any): Promise<number> {
        try {
            const serializedMessage = JSON.stringify(message);
            return await this.redis.publish(channel, serializedMessage);
        } catch (error) {
            this.logger.error(`Error publishing to channel ${channel}:`, error);
            throw error;
        }
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        try {
            const subscriber = this.redis.duplicate();
            await subscriber.subscribe(channel);

            subscriber.on('message', (chan, message) => {
                if (chan === channel) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        callback(parsedMessage);
                    } catch (error) {
                        this.logger.error(`Error parsing message from channel ${channel}:`, error);
                    }
                }
            });
        } catch (error) {
            this.logger.error(`Error subscribing to channel ${channel}:`, error);
            throw error;
        }
    }

    // Health check
    async ping(): Promise<string> {
        try {
            return await this.redis.ping();
        } catch (error) {
            this.logger.error('Redis ping failed:', error);
            throw error;
        }
    }

    // Get Redis instance for advanced operations
    getRedisInstance(): Redis {
        return this.redis;
    }
} 