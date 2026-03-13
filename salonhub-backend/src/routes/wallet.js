const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// Basic isPro middleware
const isPro = async (req, res, next) => {
    const { query } = require("../config/database");
    try {
        const [tenant] = await query("SELECT subscription_plan FROM tenants WHERE id = ?", [req.user?.tenant_id || req.tenantId]);
        if (tenant && !['pro', 'professional', 'custom', 'enterprise', 'PRO', 'CUSTOM'].includes(tenant.subscription_plan)) {
            return res.status(403).json({ error: 'Upgrade to PRO required' });
        }
    } catch (e) {
        // tolerate missing column
    }
    next();
};

const auth = [authMiddleware, tenantMiddleware];
// Get wallet details for the current tenant
router.get('/', auth, async (req, res) => {
    try {
        const wallets = await query("SELECT * FROM wallets WHERE tenant_id = ?", [req.tenantId]);
        let wallet = wallets ? wallets[0] : null;
        
        // If the tenant doesn't have a wallet yet, create one
        if (!wallet) {
            await query("INSERT INTO wallets (tenant_id) VALUES (?)", [req.tenantId]);
            const newWallets = await query("SELECT * FROM wallets WHERE tenant_id = ?", [req.tenantId]);
            wallet = newWallets[0];
        }
        res.json({ balance: wallet.balance, pendingBalance: wallet.pending_balance });
    } catch (error) {
        res.status(500).json({ error: 'Server error retrieving wallet' });
    }
});

// Get recent transactions for the tenant
router.get('/transactions', auth, async (req, res) => {
    try {
        const transactions = await query(
            "SELECT * FROM transactions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100", 
            [req.tenantId]
        );
        const mappedTx = transactions.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
            createdAt: tx.created_at
        }));
        res.json(mappedTx);
    } catch (error) {
        res.status(500).json({ error: 'Server error retrieving transactions' });
    }
});

// Request a withdrawal
router.post('/withdrawals', auth, isPro, async (req, res) => {
    try {
        const { amount, payoutMethod, payoutDetails } = req.body;
        
        const wallets = await query("SELECT * FROM wallets WHERE tenant_id = ?", [req.tenantId]);
        const wallet = wallets ? wallets[0] : null;

        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        const withdrawalResult = await query(
            "INSERT INTO withdrawal_requests (tenant_id, amount, payout_method, payout_details) VALUES (?, ?, ?, ?)",
            [req.tenantId, amount, payoutMethod, payoutDetails]
        );

        // Deduct from available balance and move to pending balance here
        await query(
            "UPDATE wallets SET balance = balance - ?, pending_balance = pending_balance + ? WHERE tenant_id = ?",
            [amount, amount, req.tenantId]
        );

        res.status(201).json({ id: withdrawalResult.insertId, amount, payoutMethod, status: 'PENDING' });
    } catch (error) {
        res.status(500).json({ error: 'Server error processing withdrawal' });
    }
});

// Get withdrawal history
router.get('/withdrawals', auth, async (req, res) => {
    try {
        const withdrawals = await query(
            "SELECT * FROM withdrawal_requests WHERE tenant_id = ? ORDER BY created_at DESC", 
            [req.tenantId]
        );
        res.json(withdrawals.map(w => ({
             id: w.id,
             amount: w.amount,
             status: w.status,
             payoutMethod: w.payout_method,
             createdAt: w.created_at
        })));
    } catch (error) {
        res.status(500).json({ error: 'Server error retrieving withdrawals' });
    }
});


module.exports = router;
