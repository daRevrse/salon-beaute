/**
 * TRAINING MATERIALS ROUTES
 * Gestion des supports de cours
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');

// GET - Liste des supports
router.get('/', async (req, res) => {
  try {
    const { course_id, material_type, is_public } = req.query;

    let sql = `
      SELECT m.*,
        c.title as course_title
      FROM training_materials m
      LEFT JOIN training_courses c ON m.course_id = c.id
      WHERE m.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (course_id) {
      sql += ' AND m.course_id = ?';
      params.push(course_id);
    }
    if (material_type) {
      sql += ' AND m.material_type = ?';
      params.push(material_type);
    }
    if (is_public !== undefined) {
      sql += ' AND m.is_public = ?';
      params.push(is_public === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY m.course_id, m.display_order ASC';

    const [materials] = await query(sql, params);

    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

// GET - Détails d'un support
router.get('/:id', async (req, res) => {
  try {
    const [materials] = await query(
      'SELECT * FROM training_materials WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (materials.length === 0) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    res.json({ success: true, data: materials[0] });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch material' });
  }
});

// POST - Ajouter un support
router.post('/', async (req, res) => {
  try {
    const {
      course_id,
      title,
      description,
      material_type,
      file_url,
      external_url,
      file_size,
      duration_minutes,
      display_order = 0,
      is_downloadable = true,
      is_public = false
    } = req.body;

    if (!course_id || !title || !material_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['course_id', 'title', 'material_type']
      });
    }

    const [result] = await query(
      `INSERT INTO training_materials (
        tenant_id, course_id, title, description, material_type,
        file_url, external_url, file_size, duration_minutes,
        display_order, is_downloadable, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, course_id, title, description, material_type,
        file_url, external_url, file_size, duration_minutes,
        display_order, is_downloadable ? 1 : 0, is_public ? 1 : 0
      ]
    );

    const [newMaterial] = await query(
      'SELECT * FROM training_materials WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Material added successfully',
      data: newMaterial[0]
    });
  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({ success: false, error: 'Failed to add material' });
  }
});

// PUT - Mettre à jour un support
router.put('/:id', async (req, res) => {
  try {
    const {
      title, description, file_url, external_url, file_size,
      duration_minutes, display_order, is_downloadable, is_public
    } = req.body;

    const [result] = await query(
      `UPDATE training_materials SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        file_url = COALESCE(?, file_url),
        external_url = COALESCE(?, external_url),
        file_size = COALESCE(?, file_size),
        duration_minutes = COALESCE(?, duration_minutes),
        display_order = COALESCE(?, display_order),
        is_downloadable = COALESCE(?, is_downloadable),
        is_public = COALESCE(?, is_public)
      WHERE id = ? AND tenant_id = ?`,
      [
        title, description, file_url, external_url, file_size,
        duration_minutes, display_order, is_downloadable, is_public,
        req.params.id, req.tenantId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    const [updated] = await query(
      'SELECT * FROM training_materials WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Material updated successfully', data: updated[0] });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
});

// DELETE - Supprimer un support
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await query(
      'DELETE FROM training_materials WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

module.exports = router;
