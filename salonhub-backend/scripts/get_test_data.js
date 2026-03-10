const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function findTestData() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'salonhub_dev'
    });

    const [tenants] = await connection.query("SELECT id, name, slug FROM tenants WHERE business_type = 'medical' LIMIT 1");
    if (tenants.length === 0) {
      console.log('No medical tenants found');
      return;
    }

    const tenant = tenants[0];
    const [users] = await connection.query("SELECT email FROM users WHERE tenant_id = ? AND role IN ('admin', 'owner') LIMIT 1", [tenant.id]);
    
    if (users.length === 0) {
      console.log(`No staff found for tenant ${tenant.slug}`);
      return;
    }

    console.log(JSON.stringify({
      tenant_slug: tenant.slug,
      staff_email: users[0].email
    }));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

findTestData();
