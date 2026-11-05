import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
