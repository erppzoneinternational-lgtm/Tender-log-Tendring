import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// 1. Initialize Supabase Client with ANON key (RLS must be open, per the architecture contract)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Backend: Mass Seeder] Missing Supabase URL or ANON Key in ../.env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// If your Supabase table names don't exactly match the auto-generated names, define them here!
// Key: The raw filename (e.g., "PZ. Database - Cable Glands.csv")
// Value: Your exact Supabase table name (e.g., "cable_gland_types")
const TABLE_MAP = {
  'PZ. Database - Cable Glands.csv': 'cable_glands', // Change this if your table is named differently
  'PZ. Database - Cables Types and Accessories.csv': 'cable_types',
  'PZ. Database - Items Category.csv': 'item_categories',
  // Add any others here that failed in the console...
};

// Normalize Table Names
function sanitizeFilenameToTable(filename) {
  if (TABLE_MAP[filename]) return TABLE_MAP[filename];

  // Remove the standard "PZ. Database - " prefix
  const rawPrefix = filename.replace(/^PZ\.\s*Database\s*-\s*/, '');
  // Remove the .csv extension
  const cleanName = rawPrefix.replace(/\.csv$/i, '');
  // Replace spaces/dashes with underscores and lowercase
  return cleanName.trim().replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

/**
 * Parses and inserts a single CSV file.
 */
async function processDataset(csvPath) {
  const filename = path.basename(csvPath);
  
  // Special handling: Skip files that have dedicated relational handling or shouldn't be bulk inserted raw
  if (filename === 'PZ. Database - Items.csv' || filename === 'PZ. Database - Brands.csv') {
    console.log(`[Backend: Mass Seeder] Skipping ${filename} (Reserved for Magic Relational Pipeline)`);
    return;
  }

  const tableName = sanitizeFilenameToTable(filename);
  console.log(`[Backend: Mass Seeder] Initiating extraction for table: '${tableName}'`);

  const rows = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({
        // Automatically trim and snake_case headers for PostgreSQL
        mapHeaders: ({ header }) => {
          let cleanHeader = header.trim().replace(/^[\u200B\uFEFF]/, ''); // remove zero-width spaces
          cleanHeader = cleanHeader.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
          
          // ID standardization
          if (cleanHeader.endsWith('_id')) {
             return cleanHeader; // Let explicit IDs map directly
          }
          if (cleanHeader === 'id') return cleanHeader;
          
          return cleanHeader;
        }
      }))
      .on('data', (data) => {
        // Strip out completely blank strings to strict nulls payload wide
        const cleanRow = {};
        for(const [k, v] of Object.entries(data)) {
           if (k !== '') { 
              cleanRow[k] = v === '' ? null : v;
           }
        }
        rows.push(cleanRow);
      })
      .on('end', async () => {
        if (rows.length === 0) {
          console.log(`[Backend: Mass Seeder] Skipping '${tableName}', file is empty.`);
          return resolve();
        }

        try {
          // Batch insert per 1,000 arrays to avoid request bloat
          const batchSize = 1000;
          let insertedCount = 0;

          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const { error: insertErr } = await supabase.from(tableName).insert(batch);
            
            if (insertErr) {
              console.error(`[Backend: Mass Seeder] Batch insert error on '${tableName}' at rows ${i}-${i+batch.length}: ${insertErr.message}`);
              // Stop progressing this file on a massive error
              throw new Error(insertErr.message);
            }
            insertedCount += batch.length;
          }

          console.log(`[Backend: Mass Seeder] SUCCESS: Ingested ${insertedCount} rows into '${tableName}'.`);
          resolve();

        } catch (error) {
          console.error(`[Backend: Mass Seeder] FAILED processing '${tableName}'`);
          resolve(); // Resolve anyway so the main loop can hit the next file without crashing
        }
      })
      .on('error', (err) => {
        console.error(`[Backend: Mass Seeder] FileReader Error on ${filename}:`, err.message);
        resolve();
      });
  });
}

/**
 * Main Runner Loop
 */
async function runMassSeeder() {
  console.log(`[Backend: Mass Seeder] Engaging Directory Parser...`);
  const datasetsDir = __dirname;
  
  const files = fs.readdirSync(datasetsDir).filter(f => f.toLowerCase().endsWith('.csv'));
  
  console.log(`[Backend: Mass Seeder] Discovered ${files.length} valid CSV datasets.`);
  
  for (const f of files) {
    const fullPath = path.join(datasetsDir, f);
    await processDataset(fullPath);
  }

  console.log(`[Backend: Mass Seeder] Pipeline Exhausted. Massive Seed Complete.`);
}

// Execute
runMassSeeder();
