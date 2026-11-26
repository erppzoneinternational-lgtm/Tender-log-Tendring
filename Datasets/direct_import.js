const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '../backend/pzone.db');
const csvPath = 'PZ. Database - Cables Types and Accessories.csv';

const db = new sqlite3.Database(dbPath);

const results = [];

fs.createReadStream(csvPath)
    .pipe(csv({
        mapHeaders: ({ header }) => header.trim().replace(/^[\u200B\uFEFF]/, '')
    }))
    .on('data', (data) => results.push(data))
    .on('end', () => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            let successCount = 0;
            let errorCount = 0;

            results.forEach(row => {
                const id = crypto.randomUUID();
                let columns = ['id'];
                let values = [id];

                for (const [key, val] of Object.entries(row)) {
                    if (!key.trim()) continue;

                    let colName = key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

                    if (key === 'Item Name') colName = 'item_id';
                    else if (key === 'Item Category') colName = 'item_category';
                    else if (key === 'Brand') colName = 'brand_id';
                    else if (key === 'Cable Glands') colName = 'cable_glands_id';
                    else if (key === 'Cable Terminals') colName = 'cable_terminals_id';
                    else if (key.endsWith(' ID')) {
                        colName = key.replace(/ ID$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_id';
                    }

                    columns.push(colName);
                    values.push(val === '' ? null : val);
                }

                if (columns.length > 0) {
                    const placeholders = columns.map(() => '?').join(', ');
                    const sql = `INSERT OR IGNORE INTO cable_types (${columns.join(', ')}) VALUES (${placeholders})`;
                    db.run(sql, values, function (err) {
                        if (err) {
                            console.error("Row Error:", err.message);
                            errorCount++;
                        } else successCount++;
                    });
                }
            });

            db.run("COMMIT", (err) => {
                if (err) console.error("Transaction Error:", err);
                console.log(`Direct Import Complete! Success: ${successCount}, Errors: ${errorCount}`);
                db.close();
            });
        });
    });
