import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { env } from './env.js'
import { logger } from '../shared/utils/logger.js'

const { Pool } = pg

const pool = new Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

if (env.NODE_ENV === 'development') {
  // Log slow queries in development
  const originalRequest = prisma.$queryRaw
  logger.debug('Prisma client initialised')
}

export default prisma
