const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/twofactor/setup
// @desc    Setup 2FA for user
// @access  Private
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if 2FA is already enabled
        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is already enabled'
            });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `XCY BEAMER (${user.email})`,
            length: 20
        });

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => ({
            code: Math.random().toString(36).substring(2, 10).toUpperCase(),
            used: false
        }));

        // Save or update 2FA data
        let twoFactorData = await TwoFactorAuth.findOne({ userId: user._id });
        if (twoFactorData) {
            twoFactorData.secret = secret.base32;
            twoFactorData.backupCodes = backupCodes;
        } else {
            twoFactorData = new TwoFactorAuth({
                userId: user._id,
                secret: secret.base32,
                backupCodes: backupCodes
            });
        }
        await twoFactorData.save();

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            qrCode: qrCodeUrl,
            secret: secret.base32,
            backupCodes: backupCodes.map(bc => bc.code)
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/twofactor/verify
// @desc    Verify and enable 2FA
// @access  Private
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const twoFactorData = await TwoFactorAuth.findOne({ userId: user._id });
        if (!twoFactorData) {
            return res.status(400).json({
                success: false,
                message: '2FA not set up'
            });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: twoFactorData.secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // Enable 2FA
        twoFactorData.enabled = true;
        await twoFactorData.save();

        await User.findByIdAndUpdate(user._id, {
            twoFactorEnabled: true
        }, { new: true });

        res.json({
            success: true,
            message: '2FA enabled successfully'
        });
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/twofactor/disable
// @desc    Disable 2FA
// @access  Private
router.post('/disable', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }

        const twoFactorData = await TwoFactorAuth.findOne({ userId: user._id });
        if (!twoFactorData) {
            return res.status(400).json({
                success: false,
                message: '2FA data not found'
            });
        }

        // Verify token before disabling
        const verified = speakeasy.totp.verify({
            secret: twoFactorData.secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // Disable 2FA
        twoFactorData.enabled = false;
        await twoFactorData.save();

        await User.findByIdAndUpdate(user._id, {
            twoFactorEnabled: false
        }, { new: true });

        res.json({
            success: true,
            message: '2FA disabled successfully'
        });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/twofactor/backup-codes
// @desc    Get backup codes
// @access  Private
router.get('/backup-codes', authenticateToken, async (req, res) => {
    try {
        const twoFactorData = await TwoFactorAuth.findOne({ userId: req.user.id });
        if (!twoFactorData) {
            return res.status(404).json({
                success: false,
                message: '2FA not set up'
            });
        }

        const unusedCodes = twoFactorData.backupCodes
            .filter(bc => !bc.used)
            .map(bc => bc.code);

        res.json({
            success: true,
            backupCodes: unusedCodes
        });
    } catch (error) {
        console.error('Get backup codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/twofactor/regenerate-backup-codes
// @desc    Regenerate backup codes
// @access  Private
router.post('/regenerate-backup-codes', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const user = await User.findById(req.user.id);
        const twoFactorData = await TwoFactorAuth.findOne({ userId: user._id });

        if (!twoFactorData || !twoFactorData.enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA not enabled'
            });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: twoFactorData.secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // Generate new backup codes
        const newBackupCodes = Array.from({ length: 8 }, () => ({
            code: Math.random().toString(36).substring(2, 10).toUpperCase(),
            used: false
        }));

        twoFactorData.backupCodes = newBackupCodes;
        await twoFactorData.save();

        res.json({
            success: true,
            backupCodes: newBackupCodes.map(bc => bc.code),
            message: 'Backup codes regenerated successfully'
        });
    } catch (error) {
        console.error('Regenerate backup codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;