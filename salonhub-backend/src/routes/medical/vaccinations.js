/**
 * MEDICAL VACCINATIONS ROUTES
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// GET - Liste
router.get('/', async (req, res) => {
  try {
    const { patient_id } = req.query;
    let sql = `SELECT v.*, p.first_name, p.last_name, p.patient_number, u.name as administered_by_name
               FROM medical_vaccinations v
               LEFT JOIN medical_patients p ON v.patient_id = p.id
               LEFT JOIN users u ON v.administered_by = u.id
               WHERE v.tenant_id = ?`;
    const params = [req.tenantId];

    if (patient_id) {
      sql += ' AND v.patient_id = ?';
      params.push(patient_id);
    }

    sql += ' ORDER BY v.vaccination_date DESC';
    const [vaccinations] = await query(sql, params);
    res.json({ success: true, count: vaccinations.length, data: vaccinations });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vaccinations' });
  }
});

// POST - Créer
router.post('/', async (req, res) => {
  try {
    const {
      patient_id, vaccine_name, vaccine_code, lot_number, manufacturer,
      vaccination_date, administered_by, site, dose_number,
      next_dose_date, reaction, notes
    } = req.body;

    if (!patient_id || !vaccine_name || !vaccination_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['patient_id', 'vaccine_name', 'vaccination_date']
      });
    }

    await query(
      `INSERT INTO medical_vaccinations (
        tenant_id, patient_id, vaccine_name, vaccine_code, lot_number, manufacturer,
        vaccination_date, administered_by, site, dose_number,
        next_dose_date, reaction, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, patient_id, vaccine_name, vaccine_code, lot_number, manufacturer,
        vaccination_date, administered_by, site, dose_number,
        next_dose_date, reaction, notes
      ]
    );

    res.status(201).json({ success: true, message: 'Vaccination recorded successfully' });
  } catch (error) {
    console.error('Error recording vaccination:', error);
    res.status(500).json({ success: false, error: 'Failed to record vaccination' });
  }
});

module.exports = router;
