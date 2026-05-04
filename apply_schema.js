import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

async function applySchema() {
  try {
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Drop existing tables to apply the new architecture diagram cleanly
    console.log('Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS tool_calls CASCADE;
      DROP TABLE IF EXISTS agent_decisions CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS memory CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    console.log('Applying new schema from architecture diagram...');
    await pool.query(schemaSql);
    
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await pool.end();
  }
}

applySchema();
