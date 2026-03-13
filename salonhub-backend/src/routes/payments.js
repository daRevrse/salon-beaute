const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query } = require('../config/database');

// Paygate Global Configuration
const PAYGATE_AUTH_TOKEN = process.env.PAYGATE_AUTH_TOKEN;
const PAYGATE_API_URL = process.env.PAYGATE_API_URL || 'https://paygateglobal.com/api/v1/pay';
// Ensure these environment variables are added to your .env file
// PAYGATE_AUTH_TOKEN=your_token
// PAYGATE_API_URL=https://paygateglobal.com/api/v1/pay


// ==========================================
// 1. Initiate Payment (Mobile App / Frontend)
// ==========================================
router.post('/paygate/init', async (req, res) => {
    try {
        const { orderId, phone, amount } = req.body;
        
        // Fetch order to verify
        const [orders] = await query("SELECT id FROM orders WHERE id = ?", [orderId]);
        const order = orders ? orders[0] : null;
        if (!order) return res.status(404).json({ error: 'Order not found' });
        
        // Prepare payload for Paygate Global
        const paygatePayload = {
            auth_token: PAYGATE_AUTH_TOKEN,
            phone_number: phone,
            amount: amount,
            identifier: order.id.toString(), // We send the order ID as reference
            // network: 'TMONEY' // Optionally specify network if required by payload, usually it detects from prefix
        };

        // Call Paygate API
        // NOTE: The exact payload and URL depends on Paygate Global's latest API documentation.
        // Assuming standard JSON POST.
        const response = await axios.post(PAYGATE_API_URL, paygatePayload);

        // Save reference from Paygate to our order if provided synchronously
        if (response.data && response.data.tx_reference) {
             await query("UPDATE orders SET payment_reference = ? WHERE id = ?", [response.data.tx_reference, order.id]);
        }

        res.json({
            success: true,
            providerData: response.data
        });

    } catch (error) {
        console.error("Paygate Init Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to initiate mobile payment' });
    }
});

// ==========================================
// 1b. Initiate Payment for Appointments
// ==========================================
router.post('/paygate/init-appointment', async (req, res) => {
    try {
        const { appointmentId, phone, amount } = req.body;
        const { query } = require('../config/database');
        
        // Fetch appointment to verify
        const [appts] = await query("SELECT id, tenant_id FROM appointments WHERE id = ?", [appointmentId]);
        if (!appts || appts.length === 0) return res.status(404).json({ error: 'Appointment not found' });
        
        // Prepare payload for Paygate Global
        const paygatePayload = {
            auth_token: PAYGATE_AUTH_TOKEN,
            phone_number: phone,
            amount: amount,
            identifier: `APP_${appointmentId}`, // prefix for appointments
        };

        const response = await axios.post(PAYGATE_API_URL, paygatePayload);

        if (response.data && response.data.tx_reference) {
             await query(
                "UPDATE appointments SET payment_reference = ?, amount_paid = ? WHERE id = ?",
                [response.data.tx_reference, amount, appointmentId]
             );
        }

        res.json({
            success: true,
            providerData: response.data
        });

    } catch (error) {
        console.error("Paygate Init Appointment Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to initiate appointment payment' });
    }
});


// ==========================================
// 2. Paygate Webhook (Asynchronous Confirmation)
// ==========================================
router.post('/paygate/webhook', async (req, res) => {
    try {
        // According to standard Paygate Global webhook payloads
        const { identifier, tx_reference, status, amount } = req.body; 

        console.log(`Webhook received for Order ID: ${identifier}, Status: ${status}`);

        // Acknowledge early to Paygate
        res.status(200).send('OK');

        if (status !== 0) { // Assuming 0 is SUCCESS in Paygate, adjust according to their docs
            return; 
        }

        // Handle Appointment Payment
        if (typeof identifier === 'string' && identifier.startsWith('APP_')) {
            const appointmentId = identifier.replace('APP_', '');
            const { query } = require('../config/database');

            const [appts] = await query("SELECT * FROM appointments WHERE id = ?", [appointmentId]);
            if (!appts || appts.length === 0 || appts[0].payment_status === 'paid') return;

            const appointment = appts[0];

            // Fetch service price to determine if this is a deposit or full payment
            const [services] = await query("SELECT price FROM services WHERE id = ?", [appointment.service_id]);
            const servicePrice = services && services[0] ? parseFloat(services[0].price) : 0;
            const paymentAmount = parseFloat(amount);
            const isFullPayment = servicePrice > 0 ? paymentAmount >= servicePrice : true;
            const newPaymentStatus = isFullPayment ? 'paid' : 'deposit_paid';

            // 1. Mark payment status (deposit_paid or paid)
            await query(
                "UPDATE appointments SET payment_status = ?, amount_paid = ?, payment_reference = ? WHERE id = ?",
                [newPaymentStatus, paymentAmount, tx_reference, appointmentId]
            );
            
            // 2. Platform Commission
            const PLATFORM_FEE_PERCENTAGE = 0.05;
            const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
            const tenantEarnings = amount - platformFee;
            
            // 3. Record Transactions
            await query(
                "INSERT INTO transactions (tenant_id, type, amount, reference_model, reference_id, status, payment_provider_data) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [appointment.tenant_id, 'PAYMENT', amount, 'Appointment', appointment.id, 'SUCCESS', JSON.stringify(req.body)]
            );
            
            await query(
                "INSERT INTO transactions (tenant_id, type, amount, reference_model, reference_id, status) VALUES (?, ?, ?, ?, ?, ?)",
                 [appointment.tenant_id, 'COMMISSION', -platformFee, 'Appointment', appointment.id, 'SUCCESS']
            );
            
            // 4. Credit Tenant Wallet
            const [wallets] = await query("SELECT * FROM wallets WHERE tenant_id = ?", [appointment.tenant_id]);
            let wallet = wallets ? wallets[0] : null;
            if (!wallet) {
                await query("INSERT INTO wallets (tenant_id, balance) VALUES (?, ?)", [appointment.tenant_id, tenantEarnings]);
            } else {
                await query("UPDATE wallets SET balance = balance + ? WHERE tenant_id = ?", [tenantEarnings, appointment.tenant_id]);
            }
            
            if (req.io) {
                req.io.to(`tenant_${appointment.tenant_id}`).emit('payment_success', {
                    appointmentId: appointment.id,
                    amount: amount
                });
            }
            return;
        }

        // Handle Order Payment
        const [orders] = await query("SELECT * FROM orders WHERE id = ?", [identifier]);
        const order = orders ? orders[0] : null;
        
        if (!order || order.status === 'PAID') {
             // Already processed or not found
            return;
        }

        // 1. Mark Order as Paid
        await query("UPDATE orders SET status = 'PAID', payment_reference = ? WHERE id = ?", [tx_reference, order.id]);

        // 2. Core Platform Commission (e.g., 5%)
        const PLATFORM_FEE_PERCENTAGE = 0.05;
        const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
        const tenantEarnings = amount - platformFee;

        // 3. Record Transactions
        await query(
            "INSERT INTO transactions (tenant_id, type, amount, reference_model, reference_id, status, payment_provider_data) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [order.tenant_id, 'PAYMENT', amount, 'Order', order.id, 'SUCCESS', JSON.stringify(req.body)]
        );

        await query(
            "INSERT INTO transactions (tenant_id, type, amount, reference_model, reference_id, status) VALUES (?, ?, ?, ?, ?, ?)",
             [order.tenant_id, 'COMMISSION', -platformFee, 'Order', order.id, 'SUCCESS']
        );

        // 4. Credit Tenant Wallet
        const [wallets] = await query("SELECT * FROM wallets WHERE tenant_id = ?", [order.tenant_id]);
        let wallet = wallets ? wallets[0] : null;

        if (!wallet) {
            await query("INSERT INTO wallets (tenant_id, balance) VALUES (?, ?)", [order.tenant_id, tenantEarnings]);
        } else {
            await query("UPDATE wallets SET balance = balance + ? WHERE tenant_id = ?", [tenantEarnings, order.tenant_id]);
        }

        // Emit socket event to frontend if possible
        if (req.io) {
            req.io.to(`tenant_${order.tenantId}`).emit('payment_success', {
                orderId: order._id,
                amount: amount
            });
        }

    } catch (error) {
        console.error("Webhook processing error:", error);
    }
});

// ==========================================
// 3. Stripe Checkout for Shop Orders (Card Payment)
// ==========================================
router.post('/stripe/init-order', async (req, res) => {
    try {
        const { orderId, amount, tenantSlug } = req.body;
        const { stripe } = require('../config/stripe');

        // Verify the order exists
        const [orders] = await query("SELECT id, tenant_id, total_amount, status FROM orders WHERE id = ?", [orderId]);
        const order = orders ? orders[0] : null;
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'PAID') return res.status(400).json({ error: 'Order already paid' });

        // Get tenant info
        const [tenants] = await query("SELECT name, slug, currency FROM tenants WHERE id = ?", [order.tenant_id]);
        const tenant = tenants ? tenants[0] : null;

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const slug = tenantSlug || tenant?.slug || '';
        const currency = (tenant?.currency || 'XOF').toLowerCase();

        // Zero-decimal currencies (Stripe does not expect cents for these)
        const ZERO_DECIMAL_CURRENCIES = ['xof', 'xaf', 'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv'];
        const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currency);
        const unitAmount = isZeroDecimal
            ? Math.round(parseFloat(order.total_amount))
            : Math.round(parseFloat(order.total_amount) * 100);

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency,
                    product_data: {
                        name: `Commande #${orderId} - ${tenant?.name || 'SalonHub Shop'}`,
                    },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            }],
            metadata: {
                order_id: orderId.toString(),
                tenant_id: order.tenant_id.toString(),
                type: 'shop_order',
            },
            success_url: `${baseUrl}/book/${slug}/shop/order-confirmation?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
            cancel_url: `${baseUrl}/book/${slug}/checkout?cancelled=true`,
        });

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });

    } catch (error) {
        console.error("Stripe Init Order Error:", error);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

module.exports = router;
