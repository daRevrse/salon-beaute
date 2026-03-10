const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyBookingFlow() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'salonhub_dev'
    });

    const tenantSlug = 'cabinet-lv';
    const [tenants] = await connection.query("SELECT id FROM tenants WHERE slug = ?", [tenantSlug]);
    const tenantId = tenants[0].id;

    const [services] = await connection.query("SELECT id FROM services WHERE tenant_id = ? LIMIT 1", [tenantId]);
    if (services.length === 0) {
        console.log('No services found for tenant');
        return;
    }
    const serviceId = services[0].id;

    console.log('--- Simulating booking for new clinical client ---');
    const testEmail = `test_medical_${Date.now()}@example.com`;
    
    // Simulate what's in public.js: router.post("/:slug/appointments"...)
    // 1. Create client
    const [clientRes] = await connection.query(
        "INSERT INTO clients (tenant_id, first_name, last_name, email, phone, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)",
        [tenantId, 'Jean', 'Dupont', testEmail, '0102030405', '1980-01-01']
    );
    const clientId = clientRes.insertId;
    console.log('Client created:', clientId);

    // 2. Create medical profile (extension)
    const patientNumber = `PAT-TEST-${Date.now().toString().substring(7)}`;
    const [patientRes] = await connection.query(
        "INSERT INTO medical_patients (tenant_id, client_id, patient_number) VALUES (?, ?, ?)",
        [tenantId, clientId, patientNumber]
    );
    const patientId = patientRes.insertId;
    console.log('Medical patient created:', patientId);

    // 3. Verify data (Join)
    const [verify] = await connection.query(
        `SELECT mp.*, c.first_name, c.last_name, c.email, c.date_of_birth
         FROM medical_patients mp
         JOIN clients c ON mp.client_id = c.id
         WHERE mp.id = ?`,
        [patientId]
    );

    console.log('Verification result:', JSON.stringify(verify[0], null, 2));

    if (verify[0] && verify[0].first_name === 'Jean' && verify[0].email === testEmail) {
        console.log('SUCCESS: Unified data model works correctly!');
    } else {
        console.log('FAILURE: Data mismatch or join failed');
    }

    // Cleanup
    await connection.query("DELETE FROM medical_patients WHERE id = ?", [patientId]);
    await connection.query("DELETE FROM clients WHERE id = ?", [clientId]);

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

verifyBookingFlow();
