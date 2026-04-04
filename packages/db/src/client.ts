import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// For migrations and scripts
const migrationClient = postgres(connectionString, { max: 1 })

// For query usage
const queryClient = postgres(connectionString)

export const db = drizzle(queryClient, { schema })
export const migrationDb = drizzle(migrationClient, { schema })

export type Database = typeof db
