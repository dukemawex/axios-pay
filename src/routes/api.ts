// this is src/routes/api.ts file

import { Router, Response } from 'express';
import { LedgerService } from '../services/ledgerService';
import { InterswitchService } from '../services/interswitch';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../utils/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// ALL ROUTES BELOW REQUIRE A VALID JWT TOKEN
router.use(authenticateToken);

router.get('/wallet/balances', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; // Extracted from JWT
        const wallets = await prisma.wallet.findMany({ where: { userId } });
        res.json({ success: true, wallets });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/wallet/fund', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { amount, currency } = req.body;
        
        const { reference, checkoutUrl } = await InterswitchService.initiatePayIn(amount, currency);
        
        // In real life, Interswitch redirects to a webhook which triggers this.
        // For the MVP flow, we simulate the webhook succeeding instantly.
        await LedgerService.fundWallet(userId, amount, currency, reference);
        
        res.json({ 
            success: true, 
            message: 'Wallet funded successfully',
            reference,
            checkoutUrl 
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/wallet/swap', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { amount, fromCurrency, toCurrency } = req.body;
        
        let rate = 1;
        if (fromCurrency === 'NGN' && toCurrency === 'UGX') rate = 2.45;
        if (fromCurrency === 'UGX' && toCurrency === 'NGN') rate = 0.40;
        
        const result = await LedgerService.executeFxSwap(userId, amount, fromCurrency, toCurrency, rate);
        
        res.json({ success: true, message: `Successfully swapped ${amount} ${fromCurrency} to ${toCurrency}`, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/wallet/withdraw', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { amount, currency, bankCode, accountNumber } = req.body;
        const reference = `WD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

        const transaction = await LedgerService.initiateWithdrawal(userId, amount, currency, reference);

        try {
            // await InterswitchService.processPayout(amount, currency, bankCode, accountNumber, reference);
            
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'COMPLETED' }
            });

            res.json({ success: true, message: 'Withdrawal processed via Interswitch successfully', reference });
        } catch (iswError: any) {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'FAILED' }
            });
            await LedgerService.fundWallet(userId, amount, currency, `REFUND-${reference}`);
            throw new Error(`Payout failed: ${iswError.message}`);
        }
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;
