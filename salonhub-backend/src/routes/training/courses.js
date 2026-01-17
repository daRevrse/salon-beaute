/**
 * TRAINING COURSES ROUTES
 * Gestion des cours/formations
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// ==========================================
// GET /api/training/courses - Liste des cours
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { category, level, delivery_mode, active } = req.query;

    let sql = 'SELECT * FROM training_courses WHERE tenant_id = ?';
    const params = [req.tenantId];

    // Filtres optionnels
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    if (delivery_mode) {
      sql += ' AND delivery_mode = ?';
      params.push(delivery_mode);
    }
    if (active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY title ASC';

    const [courses] = await query(sql, params);

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
      message: error.message
    });
  }
});

// ==========================================
// GET /api/training/courses/meta/categories
// ==========================================
router.get('/meta/categories', async (req, res) => {
  try {
    const [results] = await query(
      'SELECT DISTINCT category FROM training_courses WHERE tenant_id = ? AND category IS NOT NULL ORDER BY category',
      [req.tenantId]
    );

    const categories = results.map(row => row.category);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// ==========================================
// GET /api/training/courses/:id - Détails d'un cours
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const [courses] = await query(
      'SELECT * FROM training_courses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Récupérer les sessions associées
    const [sessions] = await query(
      'SELECT * FROM training_sessions WHERE course_id = ? AND tenant_id = ? ORDER BY start_date ASC',
      [req.params.id, req.tenantId]
    );

    // Récupérer les supports de cours
    const [materials] = await query(
      'SELECT * FROM training_materials WHERE course_id = ? AND tenant_id = ? ORDER BY display_order ASC',
      [req.params.id, req.tenantId]
    );

    res.json({
      success: true,
      data: {
        course: courses[0],
        sessions,
        materials
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course'
    });
  }
});

// ==========================================
// POST /api/training/courses - Créer un cours
// ==========================================
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      duration_hours,
      price,
      currency = 'EUR',
      max_students,
      delivery_mode,
      language = 'fr',
      prerequisites,
      objectives,
      syllabus,
      certification_offered = false,
      certification_name,
      image_url
    } = req.body;

    // Validation
    if (!title || !duration_hours || !price || !delivery_mode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['title', 'duration_hours', 'price', 'delivery_mode']
      });
    }

    const [result] = await query(
      `INSERT INTO training_courses (
        tenant_id, title, description, category, level,
        duration_hours, price, currency, max_students, delivery_mode,
        language, prerequisites, objectives, syllabus,
        certification_offered, certification_name, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, title, description, category, level,
        duration_hours, price, currency, max_students, delivery_mode,
        language, prerequisites, objectives, syllabus,
        certification_offered ? 1 : 0, certification_name, image_url
      ]
    );

    const [newCourse] = await query(
      'SELECT * FROM training_courses WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse[0]
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create course',
      message: error.message
    });
  }
});

// ==========================================
// PUT /api/training/courses/:id - Mettre à jour un cours
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const {
      title, description, category, level, duration_hours, price,
      max_students, delivery_mode, prerequisites, objectives,
      syllabus, certification_offered, certification_name, image_url
    } = req.body;

    // Vérifier que le cours existe
    const [existing] = await query(
      'SELECT id FROM training_courses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    await query(
      `UPDATE training_courses SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        level = COALESCE(?, level),
        duration_hours = COALESCE(?, duration_hours),
        price = COALESCE(?, price),
        max_students = COALESCE(?, max_students),
        delivery_mode = COALESCE(?, delivery_mode),
        prerequisites = COALESCE(?, prerequisites),
        objectives = COALESCE(?, objectives),
        syllabus = COALESCE(?, syllabus),
        certification_offered = COALESCE(?, certification_offered),
        certification_name = COALESCE(?, certification_name),
        image_url = COALESCE(?, image_url)
      WHERE id = ? AND tenant_id = ?`,
      [
        title, description, category, level, duration_hours, price,
        max_students, delivery_mode, prerequisites, objectives,
        syllabus, certification_offered, certification_name, image_url,
        req.params.id, req.tenantId
      ]
    );

    const [updated] = await query(
      'SELECT * FROM training_courses WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update course'
    });
  }
});

// ==========================================
// PATCH /api/training/courses/:id/status - Toggle actif
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;

    const [result] = await query(
      'UPDATE training_courses SET is_active = ? WHERE id = ? AND tenant_id = ?',
      [is_active ? 1 : 0, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: `Course ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update course status'
    });
  }
});

// ==========================================
// DELETE /api/training/courses/:id - Supprimer un cours
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    // Vérifier qu'il n'y a pas de sessions actives
    const [sessions] = await query(
      'SELECT COUNT(*) as count FROM training_sessions WHERE course_id = ? AND tenant_id = ? AND status IN (?, ?)',
      [req.params.id, req.tenantId, 'open', 'in_progress']
    );

    if (sessions[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete course with active sessions',
        message: 'Please cancel or complete all sessions first'
      });
    }

    const [result] = await query(
      'DELETE FROM training_courses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course'
    });
  }
});

module.exports = router;
