import fs from 'fs';
import path from 'path';
import pool from '../config/db';

async function runMigration() {
    console.log('Connecting to database...');
    try {
        const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema.sql...');
        await pool.query(sql);
        console.log('✅ Migration successful! Table and indexes created.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
