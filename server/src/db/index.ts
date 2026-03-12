import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL PRIMARY KEY,
      sender     VARCHAR(100) NOT NULL,
      text       TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  console.log('Database initialized')
}