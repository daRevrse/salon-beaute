/**
 * MEDICAL LAB RESULTS ROUTES
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// GET - Liste
router.get('/', async (req, res) => {
  try {
    const { patient_id, status } = req.query;
    let sql = `SELECT l.*, c.first_name, c.last_name, mp.patient_number, CONCAT(u.first_name, ' ', u.last_name) as ordered_by_name
               FROM medical_lab_results l
               LEFT JOIN medical_patients mp ON l.patient_id = mp.id
               LEFT JOIN clients c ON mp.client_id = c.id
               LEFT JOIN users u ON l.ordered_by = u.id
               WHERE l.tenant_id = ?`;
    const params = [req.tenantId];

    if (patient_id) {
      sql += ' AND l.patient_id = ?';
      params.push(patient_id);
    }
    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY l.test_date DESC';
    const [results] = await query(sql, params);
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching lab results:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lab results' });
  }
});

// POST - Créer
router.post('/', async (req, res) => {
  try {
    const {
      patient_id, record_id, test_name, test_code, test_date,
      result_value, result_unit, reference_range, status,
      abnormal_flag, notes, lab_name, ordered_by, file_url
    } = req.body;

    if (!patient_id || !test_name || !test_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['patient_id', 'test_name', 'test_date']
      });
    }

    await query(
      `INSERT INTO medical_lab_results (
        tenant_id, patient_id, record_id, test_name, test_code, test_date,
        result_value, result_unit, reference_range, status,
        abnormal_flag, notes, lab_name, ordered_by, file_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, patient_id, record_id, test_name, test_code, test_date,
        result_value, result_unit, reference_range, status || 'pending',
        abnormal_flag, notes, lab_name, ordered_by, file_url
      ]
    );

    res.status(201).json({ success: true, message: 'Lab result created successfully' });
  } catch (error) {
    console.error('Error creating lab result:', error);
    res.status(500).json({ success: false, error: 'Failed to create lab result' });
  }
});

// PATCH - Mettre à jour statut
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await query(
      'UPDATE medical_lab_results SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, req.params.id, req.tenantId]
    );
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

module.exports = router;
