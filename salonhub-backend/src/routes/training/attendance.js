/**
 * TRAINING ATTENDANCE ROUTES
 * Gestion des présences
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// GET - Liste des présences
router.get('/', async (req, res) => {
  try {
    const { enrollment_id, session_date, status } = req.query;

    let sql = `
      SELECT a.*,
        e.enrollment_number,
        c.name as student_name
      FROM training_attendance a
      LEFT JOIN training_enrollments e ON a.enrollment_id = e.id
      LEFT JOIN clients c ON e.student_id = c.id
      WHERE a.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (enrollment_id) {
      sql += ' AND a.enrollment_id = ?';
      params.push(enrollment_id);
    }
    if (session_date) {
      sql += ' AND a.session_date = ?';
      params.push(session_date);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.session_date DESC';

    const [attendance] = await query(sql, params);

    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

// POST - Enregistrer une présence
router.post('/', async (req, res) => {
  try {
    const { enrollment_id, session_date, check_in_time, check_out_time, status, notes } = req.body;

    if (!enrollment_id || !session_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['enrollment_id', 'session_date']
      });
    }

    const [result] = await query(
      `INSERT INTO training_attendance (
        tenant_id, enrollment_id, session_date, check_in_time, check_out_time, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        check_in_time = VALUES(check_in_time),
        check_out_time = VALUES(check_out_time),
        status = VALUES(status),
        notes = VALUES(notes)`,
      [req.tenantId, enrollment_id, session_date, check_in_time, check_out_time, status || 'present', notes]
    );

    res.status(201).json({ success: true, message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to record attendance' });
  }
});

// PATCH - Mettre à jour une présence
router.patch('/:id', async (req, res) => {
  try {
    const { check_in_time, check_out_time, status, notes } = req.body;

    const [result] = await query(
      `UPDATE training_attendance SET
        check_in_time = COALESCE(?, check_in_time),
        check_out_time = COALESCE(?, check_out_time),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
      WHERE id = ? AND tenant_id = ?`,
      [check_in_time, check_out_time, status, notes, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.json({ success: true, message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to update attendance' });
  }
});

module.exports = router;
