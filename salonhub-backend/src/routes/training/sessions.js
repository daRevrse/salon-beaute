/**
 * TRAINING SESSIONS ROUTES
 * Gestion des sessions planifiées
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// Générer numéro de session unique
const generateSessionNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SES-${year}${month}${day}-${random}`;
};

// ==========================================
// GET /api/training/sessions - Liste des sessions
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { course_id, instructor_id, status, start_date, end_date } = req.query;

    let sql = `
      SELECT s.*,
        c.title as course_title,
        c.duration_hours,
        u.name as instructor_name
      FROM training_sessions s
      LEFT JOIN training_courses c ON s.course_id = c.id
      LEFT JOIN users u ON s.instructor_id = u.id
      WHERE s.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (course_id) {
      sql += ' AND s.course_id = ?';
      params.push(course_id);
    }
    if (instructor_id) {
      sql += ' AND s.instructor_id = ?';
      params.push(instructor_id);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (start_date) {
      sql += ' AND s.start_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND s.end_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY s.start_date DESC, s.start_time ASC';

    const [sessions] = await query(sql, params);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// ==========================================
// GET /api/training/sessions/:id - Détails d'une session
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const [sessions] = await query(
      `SELECT s.*,
        c.title as course_title,
        c.description as course_description,
        c.duration_hours,
        c.price,
        u.name as instructor_name,
        u.email as instructor_email
      FROM training_sessions s
      LEFT JOIN training_courses c ON s.course_id = c.id
      LEFT JOIN users u ON s.instructor_id = u.id
      WHERE s.id = ? AND s.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Récupérer les inscriptions
    const [enrollments] = await query(
      `SELECT e.*,
        c.name as student_name,
        c.email as student_email,
        c.phone as student_phone
      FROM training_enrollments e
      LEFT JOIN clients c ON e.student_id = c.id
      WHERE e.session_id = ? AND e.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    res.json({
      success: true,
      data: {
        session: sessions[0],
        enrollments
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session'
    });
  }
});

// ==========================================
// POST /api/training/sessions - Créer une session
// ==========================================
router.post('/', async (req, res) => {
  try {
    const {
      course_id,
      instructor_id,
      start_date,
      end_date,
      start_time,
      end_time,
      location,
      meeting_url,
      meeting_password,
      max_students,
      notes
    } = req.body;

    // Validation
    if (!course_id || !start_date || !end_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['course_id', 'start_date', 'end_date', 'start_time', 'end_time']
      });
    }

    // Vérifier que le cours existe
    const [courses] = await query(
      'SELECT max_students FROM training_courses WHERE id = ? AND tenant_id = ?',
      [course_id, req.tenantId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const session_number = generateSessionNumber();
    const finalMaxStudents = max_students || courses[0].max_students;

    const [result] = await query(
      `INSERT INTO training_sessions (
        tenant_id, course_id, session_number, instructor_id,
        start_date, end_date, start_time, end_time,
        location, meeting_url, meeting_password,
        max_students, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, course_id, session_number, instructor_id,
        start_date, end_date, start_time, end_time,
        location, meeting_url, meeting_password,
        finalMaxStudents, notes
      ]
    );

    const [newSession] = await query(
      'SELECT * FROM training_sessions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: newSession[0]
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      message: error.message
    });
  }
});

// ==========================================
// PUT /api/training/sessions/:id - Mettre à jour une session
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const {
      instructor_id, start_date, end_date, start_time, end_time,
      location, meeting_url, meeting_password, max_students, notes
    } = req.body;

    const [existing] = await query(
      'SELECT id FROM training_sessions WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await query(
      `UPDATE training_sessions SET
        instructor_id = COALESCE(?, instructor_id),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        location = COALESCE(?, location),
        meeting_url = COALESCE(?, meeting_url),
        meeting_password = COALESCE(?, meeting_password),
        max_students = COALESCE(?, max_students),
        notes = COALESCE(?, notes)
      WHERE id = ? AND tenant_id = ?`,
      [
        instructor_id, start_date, end_date, start_time, end_time,
        location, meeting_url, meeting_password, max_students, notes,
        req.params.id, req.tenantId
      ]
    );

    const [updated] = await query(
      'SELECT * FROM training_sessions WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

// ==========================================
// PATCH /api/training/sessions/:id/status - Changer le statut
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['scheduled', 'open', 'full', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        valid: validStatuses
      });
    }

    const [result] = await query(
      'UPDATE training_sessions SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: `Session status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session status'
    });
  }
});

// ==========================================
// DELETE /api/training/sessions/:id - Supprimer une session
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    // Vérifier qu'il n'y a pas d'inscriptions confirmées
    const [enrollments] = await query(
      'SELECT COUNT(*) as count FROM training_enrollments WHERE session_id = ? AND tenant_id = ? AND status IN (?, ?)',
      [req.params.id, req.tenantId, 'confirmed', 'active']
    );

    if (enrollments[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete session with active enrollments',
        message: 'Please cancel enrollments first'
      });
    }

    const [result] = await query(
      'DELETE FROM training_sessions WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

module.exports = router;
