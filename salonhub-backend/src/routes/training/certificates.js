/**
 * TRAINING CERTIFICATES ROUTES
 * Gestion des certificats
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const crypto = require('crypto');

// Générer numéro de certificat et code de vérification
const generateCertificateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}${month}-${random}`;
};

const generateVerificationCode = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// GET - Liste des certificats
router.get('/', async (req, res) => {
  try {
    const { enrollment_id, is_valid } = req.query;

    let sql = `
      SELECT cert.*,
        e.enrollment_number,
        c.name as student_name,
        co.title as course_title
      FROM training_certificates cert
      LEFT JOIN training_enrollments e ON cert.enrollment_id = e.id
      LEFT JOIN clients c ON e.student_id = c.id
      LEFT JOIN training_sessions s ON e.session_id = s.id
      LEFT JOIN training_courses co ON s.course_id = co.id
      WHERE cert.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (enrollment_id) {
      sql += ' AND cert.enrollment_id = ?';
      params.push(enrollment_id);
    }
    if (is_valid !== undefined) {
      sql += ' AND cert.is_valid = ?';
      params.push(is_valid === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY cert.issue_date DESC';

    const [certificates] = await query(sql, params);

    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

// GET - Vérifier un certificat (public - par code)
router.get('/verify/:code', async (req, res) => {
  try {
    const [certificates] = await query(
      `SELECT cert.*,
        c.name as student_name,
        co.title as course_title,
        t.business_name as issuer_name
      FROM training_certificates cert
      LEFT JOIN training_enrollments e ON cert.enrollment_id = e.id
      LEFT JOIN clients c ON e.student_id = c.id
      LEFT JOIN training_sessions s ON e.session_id = s.id
      LEFT JOIN training_courses co ON s.course_id = co.id
      LEFT JOIN tenants t ON cert.tenant_id = t.id
      WHERE cert.verification_code = ?`,
      [req.params.code]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found or invalid verification code'
      });
    }

    const cert = certificates[0];

    res.json({
      success: true,
      data: {
        certificate_number: cert.certificate_number,
        certificate_name: cert.certificate_name,
        student_name: cert.student_name,
        course_title: cert.course_title,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        grade: cert.grade,
        is_valid: cert.is_valid === 1,
        issuer: cert.issuer_name
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to verify certificate' });
  }
});

// POST - Délivrer un certificat
router.post('/', async (req, res) => {
  try {
    const { enrollment_id, certificate_name, grade, expiry_date, notes } = req.body;

    if (!enrollment_id || !certificate_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['enrollment_id', 'certificate_name']
      });
    }

    // Vérifier que l'inscription existe et est complétée
    const [enrollments] = await query(
      'SELECT id, status FROM training_enrollments WHERE id = ? AND tenant_id = ?',
      [enrollment_id, req.tenantId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    if (enrollments[0].status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot issue certificate for incomplete enrollment'
      });
    }

    const certificate_number = generateCertificateNumber();
    const verification_code = generateVerificationCode();
    const issue_date = new Date().toISOString().split('T')[0];

    const [result] = await query(
      `INSERT INTO training_certificates (
        tenant_id, enrollment_id, certificate_number, certificate_name,
        issue_date, expiry_date, grade, verification_code, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, enrollment_id, certificate_number, certificate_name, issue_date, expiry_date, grade, verification_code, notes]
    );

    const [newCertificate] = await query(
      'SELECT * FROM training_certificates WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: newCertificate[0]
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to issue certificate' });
  }
});

// PATCH - Révoquer/Valider un certificat
router.patch('/:id/validity', async (req, res) => {
  try {
    const { is_valid } = req.body;

    const [result] = await query(
      'UPDATE training_certificates SET is_valid = ? WHERE id = ? AND tenant_id = ?',
      [is_valid ? 1 : 0, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    res.json({
      success: true,
      message: `Certificate ${is_valid ? 'validated' : 'revoked'} successfully`
    });
  } catch (error) {
    console.error('Error updating certificate validity:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate validity' });
  }
});

module.exports = router;
