/**
 * SALONHUB - Receipt Service
 * Handles generation and retrieval of appointment receipts
 */

const { query } = require("../config/database");

class ReceiptService {
  /**
   * Generate a unique receipt number for a tenant
   * Format: REC-YYYYMM-XXXX (where XXXX is a sequence)
   * @param {number} tenantId 
   * @returns {Promise<string>}
   */
  async generateReceiptNumber(tenantId) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `REC-${yearMonth}-`;

    // Count receipts for this month to get the next number
    const [result] = await query(
      `SELECT COUNT(*) as count FROM appointment_receipts 
       WHERE tenant_id = ? AND receipt_number LIKE ?`,
      [tenantId, `${prefix}%`]
    );

    const sequence = String(result.count + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Create a receipt for an appointment
   * @param {number} appointmentId 
   * @param {number} tenantId 
   * @returns {Promise<Object>}
   */
  async generateReceipt(appointmentId, tenantId) {
    try {
      // 1. Fetch full appointment details
      const [appointment] = await query(
        `SELECT 
          a.*,
          c.first_name as client_first_name,
          c.last_name as client_last_name,
          s.name as service_name,
          s.price as service_price,
          u.first_name as staff_first_name,
          u.last_name as staff_last_name,
          t.currency as tenant_currency
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN services s ON a.service_id = s.id
        JOIN tenants t ON a.tenant_id = t.id
        LEFT JOIN users u ON a.staff_id = u.id
        WHERE a.id = ? AND a.tenant_id = ?`,
        [appointmentId, tenantId]
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Check if receipt already exists
      const [existing] = await query(
        "SELECT id FROM appointment_receipts WHERE appointment_id = ?",
        [appointmentId]
      );

      if (existing) {
        return { success: true, message: "Receipt already exists", id: existing.id };
      }

      // 2. Prepare receipt data
      const receiptNumber = await this.generateReceiptNumber(tenantId);
      const clientName = `${appointment.client_first_name} ${appointment.client_last_name}`;
      const staffName = appointment.staff_first_name 
        ? `${appointment.staff_first_name} ${appointment.staff_last_name}`
        : "Non spécifié";
      
      const amount = appointment.service_price || 0;
      const taxRate = 0; // Could be configurable later
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;
      const currency = appointment.tenant_currency || 'EUR';

      const items = [{
        description: appointment.service_name,
        quantity: 1,
        unit_price: amount,
        total: amount
      }];

      // 3. Insert into database
      const result = await query(
        `INSERT INTO appointment_receipts (
          tenant_id, appointment_id, client_id, receipt_number,
          client_name, service_name, staff_name,
          amount, tax_amount, total_amount, currency, items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          appointmentId,
          appointment.client_id,
          receiptNumber,
          clientName,
          appointment.service_name,
          staffName,
          amount,
          taxAmount,
          totalAmount,
          currency,
          JSON.stringify(items)
        ]
      );

      return {
        success: true,
        id: result.insertId,
        receiptNumber
      };
    } catch (error) {
      console.error("Error generating receipt:", error);
      throw error;
    }
  }

  /**
   * Get receipt by appointment ID
   * @param {number} appointmentId 
   * @param {number} tenantId 
   * @returns {Promise<Object>}
   */
  async getReceiptByAppointmentId(appointmentId, tenantId) {
    const [receipt] = await query(
      `SELECT r.*, t.name as salon_name, t.address as salon_address, t.phone as salon_phone, t.email as salon_email, t.logo_url
       FROM appointment_receipts r
       JOIN tenants t ON r.tenant_id = t.id
       WHERE r.appointment_id = ? AND r.tenant_id = ?`,
      [appointmentId, tenantId]
    );

    if (receipt && typeof receipt.items === 'string') {
      try {
        receipt.items = JSON.parse(receipt.items);
      } catch (e) {
        receipt.items = [];
      }
    }

    return receipt;
  }
}

module.exports = new ReceiptService();
