/**
 * MEDICAL RECORDS ROUTES
 * Gestion des dossiers médicaux/consultations
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// Générer numéro de dossier
const generateRecordNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REC-${year}${month}${day}-${random}`;
};

// GET - Liste des dossiers
router.get('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, visit_type, start_date, end_date } = req.query;

    let sql = `
      SELECT r.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.patient_number,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
      FROM medical_records r
      LEFT JOIN medical_patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      WHERE r.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (patient_id) {
      sql += ' AND r.patient_id = ?';
      params.push(patient_id);
    }
    if (doctor_id) {
      sql += ' AND r.doctor_id = ?';
      params.push(doctor_id);
    }
    if (visit_type) {
      sql += ' AND r.visit_type = ?';
      params.push(visit_type);
    }
    if (start_date) {
      sql += ' AND r.visit_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND r.visit_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY r.visit_date DESC, r.visit_time DESC';

    const records = await query(sql, params);
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch records' });
  }
});

// GET - Détails d'un dossier
router.get('/:id', async (req, res) => {
  try {
    const records = await query(
      `SELECT r.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.patient_number,
        p.date_of_birth,
        p.blood_type,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
      FROM medical_records r
      LEFT JOIN medical_patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      WHERE r.id = ? AND r.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({ success: true, data: records[0] });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch record' });
  }
});

// POST - Créer un dossier médical
router.post('/', async (req, res) => {
  try {
    const {
      patient_id, appointment_id, doctor_id,
      visit_date, visit_time, visit_type,
      chief_complaint, history_of_present_illness, physical_examination,
      vital_signs, diagnosis, treatment_plan, notes,
      follow_up_required, follow_up_date
    } = req.body;

    if (!patient_id || !doctor_id || !visit_date || !visit_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['patient_id', 'doctor_id', 'visit_date', 'visit_time']
      });
    }

    const record_number = generateRecordNumber();

    const result = await query(
      `INSERT INTO medical_records (
        tenant_id, patient_id, appointment_id, doctor_id, record_number,
        visit_date, visit_time, visit_type,
        chief_complaint, history_of_present_illness, physical_examination,
        vital_signs, diagnosis, treatment_plan, notes,
        follow_up_required, follow_up_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, patient_id, appointment_id, doctor_id, record_number,
        visit_date, visit_time, visit_type || 'consultation',
        chief_complaint, history_of_present_illness, physical_examination,
        vital_signs ? JSON.stringify(vital_signs) : null,
        diagnosis, treatment_plan, notes,
        follow_up_required ? 1 : 0, follow_up_date
      ]
    );

    const newRecord = await query(
      'SELECT * FROM medical_records WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: newRecord[0]
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ success: false, error: 'Failed to create record' });
  }
});

// PUT - Mettre à jour un dossier
router.put('/:id', async (req, res) => {
  try {
    const {
      chief_complaint, history_of_present_illness, physical_examination,
      vital_signs, diagnosis, treatment_plan, notes,
      follow_up_required, follow_up_date
    } = req.body;

    const result = await query(
      `UPDATE medical_records SET
        chief_complaint = COALESCE(?, chief_complaint),
        history_of_present_illness = COALESCE(?, history_of_present_illness),
        physical_examination = COALESCE(?, physical_examination),
        vital_signs = COALESCE(?, vital_signs),
        diagnosis = COALESCE(?, diagnosis),
        treatment_plan = COALESCE(?, treatment_plan),
        notes = COALESCE(?, notes),
        follow_up_required = COALESCE(?, follow_up_required),
        follow_up_date = COALESCE(?, follow_up_date)
      WHERE id = ? AND tenant_id = ?`,
      [
        chief_complaint, history_of_present_illness, physical_examination,
        vital_signs ? JSON.stringify(vital_signs) : null,
        diagnosis, treatment_plan, notes,
        follow_up_required, follow_up_date,
        req.params.id, req.tenantId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({ success: true, message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ success: false, error: 'Failed to update record' });
  }
});

module.exports = router;
