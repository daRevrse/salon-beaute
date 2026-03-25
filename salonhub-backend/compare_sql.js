const fs = require('fs');

function parseSql(content) {
  const tables = {};
  const regex = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];
    
    // Split by comma, but ignore commas inside parentheses
    // Simple approach: just keep the raw lines, split by newlines
    let lines = columnsStr.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('/*') && !l.startsWith('--'));
      
    tables[tableName] = lines;
  }
  return tables;
}

try {
  const prodSql = fs.readFileSync('../prod (2).sql', 'utf8');
  const devSql = fs.readFileSync('./dev_schema.sql', 'utf8');

  const prodTables = parseSql(prodSql);
  const devTables = parseSql(devSql);

  const missingInProd = [];
  const modifiedTables = {};

  for (const table in devTables) {
    if (!prodTables[table]) {
      missingInProd.push(table);
    } else {
      const devLines = devTables[table];
      const prodLines = prodTables[table];
      
      // Basic comparison of lines
      const devFields = devLines.map(l => l.replace(/,$/, '').replace(/ COLLATE [^\s]+/, '').replace(/ CHARACTER SET [^\s]+/, ''));
      const prodFields = prodLines.map(l => l.replace(/,$/, '').replace(/ COLLATE [^\s]+/, '').replace(/ CHARACTER SET [^\s]+/, ''));
      
      const newFields = devFields.filter(f => !prodFields.includes(f));
      
      if (newFields.length > 0) {
        modifiedTables[table] = newFields;
      }
    }
  }

  console.log("=== TABLES MISSING IN PROD (Need to be created) ===");
  console.log(missingInProd);
  console.log("\n=== MODIFIED TABLES (Fields in DEV but not in PROD) ===");
  for (const [table, fields] of Object.entries(modifiedTables)) {
    console.log(`Table: ${table}`);
    fields.forEach(f => console.log(`  + ${f}`));
  }
} catch (e) {
  console.error(e);
}
