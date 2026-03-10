/**
 * TRAINING ENROLLMENTS ROUTES
 * Gestion des inscriptions
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// Générer numéro d'inscription unique
const generateEnrollmentNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ENR-${year}${month}${day}-${random}`;
};

// GET - Liste des inscriptions
router.get('/', async (req, res) => {
  try {
    const { session_id, student_id, status, payment_status } = req.query;

    let sql = `
      SELECT e.*,
        c.name as student_name,
        c.email as student_email,
        s.session_number,
        co.title as course_title
      FROM training_enrollments e
      LEFT JOIN clients c ON e.student_id = c.id
      LEFT JOIN training_sessions s ON e.session_id = s.id
      LEFT JOIN training_courses co ON s.course_id = co.id
      WHERE e.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (session_id) {
      sql += ' AND e.session_id = ?';
      params.push(session_id);
    }
    if (student_id) {
      sql += ' AND e.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    if (payment_status) {
      sql += ' AND e.payment_status = ?';
      params.push(payment_status);
    }

    sql += ' ORDER BY e.enrolled_at DESC';

    const enrollments = await query(sql, params);

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
  }
});

// GET - Détails d'une inscription
router.get('/:id', async (req, res) => {
  try {
    const enrollments = await query(
      `SELECT e.*,
        c.name as student_name,
        c.email as student_email,
        c.phone as student_phone,
        s.session_number,
        s.start_date,
        s.end_date,
        co.title as course_title,
        co.duration_hours
      FROM training_enrollments e
      LEFT JOIN clients c ON e.student_id = c.id
      LEFT JOIN training_sessions s ON e.session_id = s.id
      LEFT JOIN training_courses co ON s.course_id = co.id
      WHERE e.id = ? AND e.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    res.json({ success: true, data: enrollments[0] });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch enrollment' });
  }
});

// POST - Créer une inscription
router.post('/', async (req, res) => {
  try {
    const { session_id, student_id, amount_due, payment_method, notes } = req.body;

    if (!session_id || !student_id || !amount_due) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['session_id', 'student_id', 'amount_due']
      });
    }

    // Vérifier disponibilité de la session
    const sessions = await query(
      'SELECT current_students, max_students, status FROM training_sessions WHERE id = ? AND tenant_id = ?',
      [session_id, req.tenantId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = sessions[0];
    if (session.status === 'full' || (session.max_students && session.current_students >= session.max_students)) {
      return res.status(400).json({ success: false, error: 'Session is full' });
    }

    const enrollment_number = generateEnrollmentNumber();
    const enrollment_date = new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO training_enrollments (
        tenant_id, session_id, student_id, enrollment_number,
        enrollment_date, amount_due, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, session_id, student_id, enrollment_number, enrollment_date, amount_due, payment_method, notes]
    );

    // Incrémenter le compteur d'étudiants
    await query(
      'UPDATE training_sessions SET current_students = current_students + 1 WHERE id = ?',
      [session_id]
    );

    const newEnrollment = await query(
      'SELECT * FROM training_enrollments WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: newEnrollment[0]
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ success: false, error: 'Failed to create enrollment' });
  }
});

// PATCH - Changer le statut
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'dropped', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status', valid: validStatuses });
    }

    const result = await query(
      'UPDATE training_enrollments SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    res.json({ success: true, message: `Enrollment status updated to ${status}` });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({ success: false, error: 'Failed to update enrollment status' });
  }
});

// PATCH - Mettre à jour le paiement
router.patch('/:id/payment', async (req, res) => {
  try {
    const { amount_paid, payment_status, payment_method } = req.body;

    const result = await query(
      `UPDATE training_enrollments SET
        amount_paid = COALESCE(?, amount_paid),
        payment_status = COALESCE(?, payment_status),
        payment_method = COALESCE(?, payment_method)
      WHERE id = ? AND tenant_id = ?`,
      [amount_paid, payment_status, payment_method, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment' });
  }
});

// DELETE - Annuler une inscription
router.delete('/:id', async (req, res) => {
  try {
    // Récupérer session_id avant suppression
    const enrollment = await query(
      'SELECT session_id FROM training_enrollments WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (enrollment.length === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    const result = await query(
      'DELETE FROM training_enrollments WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    // Décrémenter le compteur d'étudiants
    await query(
      'UPDATE training_sessions SET current_students = current_students - 1 WHERE id = ?',
      [enrollment[0].session_id]
    );

    res.json({ success: true, message: 'Enrollment cancelled successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete enrollment' });
  }
});

module.exports = router;
