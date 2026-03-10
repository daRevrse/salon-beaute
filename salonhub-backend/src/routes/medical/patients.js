/**
 * MEDICAL PATIENTS ROUTES
 * Gestion des patients
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const crypto = require('crypto');

// Générer numéro de patient unique
const generatePatientNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAT-${year}${month}-${random}`;
};

// GET - Liste des patients
router.get('/', async (req, res) => {
  try {
    const { search, is_active } = req.query;

    let sql = `
      SELECT mp.*, c.first_name, c.last_name, c.email, c.phone, c.date_of_birth, c.gender
      FROM medical_patients mp
      JOIN clients c ON mp.client_id = c.id
      WHERE mp.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (search) {
      sql += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR mp.patient_number LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (is_active !== undefined) {
      sql += ' AND mp.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY c.last_name ASC, c.first_name ASC';

    const patients = await query(sql, params);

    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
});

// GET - Détails d'un patient avec historique complet
router.get('/:id', async (req, res) => {
  try {
    const patients = await query(
      `SELECT mp.*, c.first_name, c.last_name, c.email, c.phone, c.date_of_birth, c.gender, c.address
       FROM medical_patients mp
       JOIN clients c ON mp.client_id = c.id
       WHERE mp.id = ? AND mp.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (patients.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Récupérer l'historique
    const allergies = await query(
      'SELECT * FROM medical_allergies WHERE patient_id = ? AND is_active = 1',
      [req.params.id]
    );

    const conditions = await query(
      'SELECT * FROM medical_conditions WHERE patient_id = ? ORDER BY diagnosis_date DESC',
      [req.params.id]
    );

    const medications = await query(
      'SELECT * FROM medical_medications WHERE patient_id = ? AND is_active = 1 ORDER BY start_date DESC',
      [req.params.id]
    );

    const records = await query(
      'SELECT * FROM medical_records WHERE patient_id = ? ORDER BY visit_date DESC LIMIT 10',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        patient: patients[0],
        allergies,
        conditions,
        medications,
        recent_records: records
      }
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patient' });
  }
});

// POST - Créer un patient
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, date_of_birth, gender, blood_type,
      email, phone, address,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      insurance_provider, insurance_number, social_security_number, notes
    } = req.body;

    if (!first_name || !last_name || !date_of_birth || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'date_of_birth', 'gender']
      });
    }

    // 1. Gérer le client (source de vérité contact)
    let clientId;
    const existingClients = await query(
      'SELECT id FROM clients WHERE tenant_id = ? AND email = ?',
      [req.tenantId, email]
    );

    if (existingClients.length > 0 && email) {
      clientId = existingClients[0].id;
      // Optionnel: Mettre à jour les infos du client existant
      await query(
        `UPDATE clients SET first_name = ?, last_name = ?, phone = ?, date_of_birth = ?, gender = ?, address = ? WHERE id = ?`,
        [first_name, last_name, phone, date_of_birth, gender, address, clientId]
      );
    } else {
      const clientResult = await query(
        `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, date_of_birth, gender, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.tenantId, first_name, last_name, email, phone, date_of_birth, gender, address]
      );
      clientId = clientResult.insertId;
    }

    // 2. Vérifier si le profil médical existe déjà pour ce client
    const existingPatient = await query(
      'SELECT id FROM medical_patients WHERE tenant_id = ? AND client_id = ?',
      [req.tenantId, clientId]
    );

    if (existingPatient.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A medical profile already exists for this client'
      });
    }

    // 3. Créer le profil médical
    const patient_number = generatePatientNumber();
    const result = await query(
      `INSERT INTO medical_patients (
        tenant_id, client_id, patient_number, blood_type,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        insurance_provider, insurance_number, social_security_number, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, clientId, patient_number, blood_type,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        insurance_provider, insurance_number, social_security_number, notes
      ]
    );

    const newPatient = await query(
      `SELECT mp.*, c.first_name, c.last_name, c.email, c.phone, c.date_of_birth, c.gender, c.address
       FROM medical_patients mp
       JOIN clients c ON mp.client_id = c.id
       WHERE mp.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: newPatient[0]
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ success: false, error: 'Failed to create patient' });
  }
});

// PUT - Mettre à jour un patient
router.put('/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, date_of_birth, gender, blood_type,
      email, phone, address,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      insurance_provider, insurance_number, social_security_number, notes
    } = req.body;

    // 1. Récupérer le client_id
    const patientRecord = await query(
      'SELECT client_id FROM medical_patients WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (patientRecord.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const clientId = patientRecord[0].client_id;

    // 2. Mettre à jour le client
    await query(
      `UPDATE clients SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender),
        address = COALESCE(?, address)
      WHERE id = ?`,
      [first_name, last_name, email, phone, date_of_birth, gender, address, clientId]
    );

    // 3. Mettre à jour le profil médical
    const result = await query(
      `UPDATE medical_patients SET
        blood_type = COALESCE(?, blood_type),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        emergency_contact_relation = COALESCE(?, emergency_contact_relation),
        insurance_provider = COALESCE(?, insurance_provider),
        insurance_number = COALESCE(?, insurance_number),
        social_security_number = COALESCE(?, social_security_number),
        notes = COALESCE(?, notes)
      WHERE id = ? AND tenant_id = ?`,
      [
        blood_type, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        insurance_provider, insurance_number, social_security_number, notes,
        req.params.id, req.tenantId
      ]
    );

    const updated = await query(
      `SELECT mp.*, c.first_name, c.last_name, c.email, c.phone, c.date_of_birth, c.gender, c.address
       FROM medical_patients mp
       JOIN clients c ON mp.client_id = c.id
       WHERE mp.id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: 'Patient updated successfully', data: updated[0] });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ success: false, error: 'Failed to update patient' });
  }
});

// POST - Ajouter une allergie
router.post('/:id/allergies', async (req, res) => {
  try {
    const { allergen, allergy_type, severity, reaction, diagnosed_date, notes } = req.body;

    if (!allergen || !allergy_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['allergen', 'allergy_type']
      });
    }

    await query(
      `INSERT INTO medical_allergies (
        tenant_id, patient_id, allergen, allergy_type, severity, reaction, diagnosed_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, req.params.id, allergen, allergy_type, severity || 'moderate', reaction, diagnosed_date, notes]
    );

    res.status(201).json({ success: true, message: 'Allergy added successfully' });
  } catch (error) {
    console.error('Error adding allergy:', error);
    res.status(500).json({ success: false, error: 'Failed to add allergy' });
  }
});

// POST - Ajouter une condition médicale
router.post('/:id/conditions', async (req, res) => {
  try {
    const { condition_name, icd_code, diagnosis_date, status, severity, notes } = req.body;

    if (!condition_name) {
      return res.status(400).json({ success: false, error: 'condition_name is required' });
    }

    await query(
      `INSERT INTO medical_conditions (
        tenant_id, patient_id, condition_name, icd_code, diagnosis_date, status, severity, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, req.params.id, condition_name, icd_code, diagnosis_date, status || 'active', severity, notes]
    );

    res.status(201).json({ success: true, message: 'Condition added successfully' });
  } catch (error) {
    console.error('Error adding condition:', error);
    res.status(500).json({ success: false, error: 'Failed to add condition' });
  }
});

// POST - Ajouter un médicament
router.post('/:id/medications', async (req, res) => {
  try {
    const {
      medication_name, dosage, frequency, route, start_date,
      end_date, prescribing_doctor, reason, side_effects
    } = req.body;

    if (!medication_name || !dosage || !frequency || !start_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['medication_name', 'dosage', 'frequency', 'start_date']
      });
    }

    await query(
      `INSERT INTO medical_medications (
        tenant_id, patient_id, medication_name, dosage, frequency, route,
        start_date, end_date, prescribing_doctor, reason, side_effects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId, req.params.id, medication_name, dosage, frequency, route || 'oral',
        start_date, end_date, prescribing_doctor, reason, side_effects
      ]
    );

    res.status(201).json({ success: true, message: 'Medication added successfully' });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ success: false, error: 'Failed to add medication' });
  }
});

module.exports = router;
