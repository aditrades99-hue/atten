const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// URL encode the password since it contains an @ symbol
const connectionString = 'postgresql://postgres:trackmaruti%402000@db.yeestcdxpctmyxeyzrau.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase external connections
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase database successfully!');
    
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL schema migration...');
    await client.query(sql);
    
    console.log('SQL migration completed successfully! All tables created.');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();
