/**
 * MEDICAL PRESCRIPTIONS ROUTES
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

const generatePrescriptionNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PRE-${year}${month}${day}-${random}`;
};

// GET - Liste
router.get('/', async (req, res) => {
  try {
    const { patient_id, status } = req.query;
    let sql = `SELECT p.*, pat.first_name, pat.last_name, pat.patient_number, CONCAT(u.first_name, ' ', u.last_name) as doctor_name
               FROM medical_prescriptions p
               LEFT JOIN medical_patients pat ON p.patient_id = pat.id
               LEFT JOIN users u ON p.doctor_id = u.id
               WHERE p.tenant_id = ?`;
    const params = [req.tenantId];

    if (patient_id) {
      sql += ' AND p.patient_id = ?';
      params.push(patient_id);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.prescription_date DESC';
    const prescriptions = await query(sql, params);
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prescriptions' });
  }
});

// POST - Créer
router.post('/', async (req, res) => {
  try {
    const {
      patient_id, record_id, doctor_id, prescription_date,
      medication_name, dosage, frequency, duration, quantity,
      refills_allowed, instructions, expiry_date, notes
    } = req.body;

    if (!patient_id || !doctor_id || !medication_name || !dosage || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['patient_id', 'doctor_id', 'medication_name', 'dosage', 'frequency']
      });
    }

    const prescription_number = generatePrescriptionNumber();
    const finalDate = prescription_date || new Date().toISOString().split('T')[0];

    await query(
      `INSERT INTO medical_prescriptions (
        tenant_id, patient_id, record_id, doctor_id, prescription_number, prescription_date,
        medication_name, dosage, frequency, duration, quantity,
        refills_allowed, instructions, expiry_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, patient_id, record_id, doctor_id, prescription_number, finalDate,
        medication_name, dosage, frequency, duration, quantity,
        refills_allowed || 0, instructions, expiry_date, notes
      ]
    );

    res.status(201).json({ success: true, message: 'Prescription created successfully' });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ success: false, error: 'Failed to create prescription' });
  }
});

// PATCH - Changer statut
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await query(
      'UPDATE medical_prescriptions SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, req.params.id, req.tenantId]
    );
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

module.exports = router;
