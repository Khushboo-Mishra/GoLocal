// scripts/migrate.ts
// Apply src/db/migrations.sql against DATABASE_URL.
//
// Use this for local + Railway. Production should still review the
// statements in Supabase SQL Editor first — this script just runs
// the file as one transactional block.
//
// Run:
//   pnpm db:migrate
//
// Note: most statements use IF NOT EXISTS / OR REPLACE / ALTER ADD
// COLUMN IF NOT EXISTS so re-runs are safe. The CREATE TYPE
// statements aren't — they'll throw on re-run, which is fine in dev.

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sqlPath = resolve(__dirname, '../src/db/migrations.sql')
  const sqlText = readFileSync(sqlPath, 'utf8')

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    max: 1,
  })

  console.log(`Applying migrations from ${sqlPath}…`)
  try {
    // Run the full file as a single statement batch.
    // `postgres` lets us send raw SQL via .unsafe().
    await sql.unsafe(sqlText)
    console.log('Migrations applied.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main()
