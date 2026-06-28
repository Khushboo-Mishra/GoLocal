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
// migrations.sql is fully idempotent (IF NOT EXISTS, DO/EXCEPTION-guarded
// enum types, drop-then-create trigger, NOT EXISTS-guarded seed), so this
// is safe to run repeatedly against an existing database.

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
    // Run the full file in simple-query mode so multiple statements and
    // dollar-quoted DO/function blocks execute correctly in one round trip.
    await sql.unsafe(sqlText).simple()
    console.log('Migrations applied.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main()
