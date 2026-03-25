const fs = require('fs');

const prodSql = fs.readFileSync('../prod-actuel.sql', 'utf8');
const devSql = fs.readFileSync('../dev-actuel.sql', 'utf8');

function extractTables(sql) {
  const tables = {};
  const regex = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=([^;]+);/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    tables[match[1]] = {
      fullDef: match[0],
      columns: match[2].split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('`'))
        .map(l => l.replace(/,$/, ''))
    };
  }
  return tables;
}

function extractInserts(sql) {
  const inserts = {};
  const regex = /INSERT INTO `([^`]+)` [^;]+;/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    if (!inserts[match[1]]) inserts[match[1]] = [];
    inserts[match[1]].push(match[0]);
  }
  return inserts;
}

function extractAlters(sql) {
  const alters = {};
  // Match ALTER TABLE statements
  const regex = /ALTER TABLE `([^`]+)`([\s\S]*?);/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    if (!alters[match[1]]) alters[match[1]] = [];
    alters[match[1]].push(match[0]);
  }
  return alters;
}

const prodTables = extractTables(prodSql);
const devTables = extractTables(devSql);
const devInserts = extractInserts(devSql);
const devAlters = extractAlters(devSql);

const missingTables = [];
const modifiedTables = [];

for (const table in devTables) {
  if (!prodTables[table]) {
    missingTables.push(table);
  } else {
    // Check columns
    const devCols = devTables[table].columns.map(c => c.split(' ')[0]);
    const prodCols = prodTables[table].columns.map(c => c.split(' ')[0]);
    
    devTables[table].columns.forEach(colDef => {
      const colName = colDef.split(' ')[0];
      if (!prodCols.includes(colName)) {
        modifiedTables.push({ table, colDef });
      }
    });
  }
}

let outSql = "-- ==========================================\n";
outSql += "-- MIGRATION SCRIPT: DEV TO PROD (v2)\n";
outSql += "-- ==========================================\n\n";
outSql += "SET FOREIGN_KEY_CHECKS=0;\n\n";

outSql += "-- 1. CRÉATION DES NOUVELLES TABLES\n\n";
missingTables.forEach(t => {
  outSql += devTables[t].fullDef + "\n\n";
});

outSql += "-- 2. AJOUT DES COLONNES MANQUANTES\n\n";
modifiedTables.forEach(m => {
  outSql += `ALTER TABLE \`${m.table}\` ADD COLUMN ${m.colDef};\n`;
});

outSql += "\n-- 3. AJOUT DES CLÉS ET CONTRAINTES POUR LES NOUVELLES TABLES\n\n";
missingTables.forEach(t => {
  if (devAlters[t]) {
    devAlters[t].forEach(alt => {
      // Don't auto increment with specific value, just keep structure if possible or allow it.
      // phpMyAdmin outputs AUTO_INCREMENT=XX. That's fine for empty tables.
      outSql += alt + "\n\n";
    });
  }
});

outSql += "-- 4. INSERTION DES DONNÉES PAR DÉFAUT\n\n";
const tablesToInsert = ['business_sectors', 'categories', 'subscription_plans', 'ticket_counter'];
missingTables.forEach(t => {
  if (tablesToInsert.includes(t) && devInserts[t]) {
    devInserts[t].forEach(ins => {
      outSql += ins + "\n\n";
    });
  }
});

outSql += "SET FOREIGN_KEY_CHECKS=1;\n";

fs.writeFileSync('../migration_to_prod_v2.sql', outSql);
console.log('Script updated successfully! Saved as migration_to_prod_v2.sql');
