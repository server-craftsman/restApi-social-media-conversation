import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            log: ['error', 'warn'],
        });
    }

    async onModuleInit() {
        try {
            this.logger.log('=== DATABASE CONNECTION DEBUG ===');
            this.logger.log(`DATABASE_URL env: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
            this.logger.log(`DATABASE_HOST env: ${process.env.DATABASE_HOST || 'Not set'}`);
            this.logger.log(`DATABASE_PORT env: ${process.env.DATABASE_PORT || 'Not set'}`);
            this.logger.log(`DATABASE_USERNAME env: ${process.env.DATABASE_USERNAME || 'Not set'}`);
            this.logger.log(`DATABASE_NAME env: ${process.env.DATABASE_NAME || 'Not set'}`);

            if (process.env.DATABASE_URL) {
                this.logger.log(`DATABASE_URL value: ${process.env.DATABASE_URL.replace(/\/\/.*:.*@/, '//***:***@')}`);
            }

            this.logger.log('Attempting database connection...');
            await this.$connect();
            this.logger.log('✅ Database connected successfully');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database:');
            this.logger.error(`Error: ${error.message}`);
            this.logger.error('Full error:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Database disconnected');
        } catch (error) {
            this.logger.error('Error disconnecting from database:', error);
        }
    }
} 