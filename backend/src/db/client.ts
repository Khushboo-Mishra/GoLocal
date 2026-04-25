import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Single connection pool for the entire app.
// postgres() is safe to import multiple times — it returns the same instance.
export const db = postgres(process.env.DATABASE_URL, {
  max: 10,           // max pool connections
  idle_timeout: 20,  // close idle connections after 20s
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
})

export type DB = typeof db
