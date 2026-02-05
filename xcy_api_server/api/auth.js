const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const speakeasy = require('speakeasy');
const { authenticateToken } = require('../middleware/auth');
const {
    generateVerificationToken,
    sendVerificationEmail,
    sendWelcomeEmail
} = require('../services/emailService');

// Generate JWT Token
const generateToken = (userId, roles) => {
    return jwt.sign(
        { id: userId, roles }, // Changed from 'userId' to 'id' to match middleware
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours expiry

        // Create new user
        const user = new User({
            username,
            email: email.toLowerCase(),
            password,
            emailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        await user.save();

        // Send verification email
        const emailSent = await sendVerificationEmail(user, verificationToken);

        if (!emailSent) {
            console.warn('Failed to send verification email, but user was created');
        }

        // Generate token
        const token = generateToken(user._id, user.roles);

        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Registration successful! Please check your email to verify your account. If you don\'t see it, check your spam folder.',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                twoFactorEnabled: user.twoFactorEnabled,
                emailVerified: user.emailVerified
            },
            requiresVerification: true
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                message: 'User ID and token are required'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Check token and expiry
        if (user.emailVerificationToken !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        if (user.emailVerificationExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Verification token has expired'
            });
        }

        // Verify email
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user);

        res.json({
            success: true,
            message: 'Email verified successfully! Your account is now fully activated.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                twoFactorEnabled: user.twoFactorEnabled,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        // Update user with new token
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        // Send verification email
        const emailSent = await sendVerificationEmail(user, verificationToken);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again later.'
            });
        }

        res.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal that user doesn't exist for security
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = generateVerificationToken();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        // Send password reset email
        const emailSent = await sendPasswordResetEmail(user, resetToken);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again later.'
            });
        }

        res.json({
            success: true,
            message: 'Password reset email sent successfully. Please check your inbox.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { userId, token, newPassword, confirmPassword } = req.body;

        if (!userId || !token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check token and expiry
        if (user.resetPasswordToken !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update the signin route to check email verification
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return res.json({
                success: true,
                requiresVerification: true,
                userId: user._id,
                message: 'Please verify your email address before logging in'
            });
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            return res.json({
                success: true,
                requires2FA: true,
                userId: user._id,
                message: '2FA verification required'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.roles);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                twoFactorEnabled: user.twoFactorEnabled,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   POST /api/auth/signin-2fa
// @desc    Complete login with 2FA
// @access  Public
router.post('/signin-2fa', async (req, res) => {
    try {
        const { userId, token, backupCode } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const twoFactorData = await TwoFactorAuth.findOne({ userId: user._id });
        if (!twoFactorData || !twoFactorData.enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA not enabled for this account'
            });
        }

        let verified = false;

        // Check backup code first
        if (backupCode) {
            const backupCodeEntry = twoFactorData.backupCodes.find(
                bc => bc.code === backupCode && !bc.used
            );

            if (backupCodeEntry) {
                backupCodeEntry.used = true;
                await twoFactorData.save();
                verified = true;
            }
        } else if (token) {
            // Verify TOTP token
            verified = speakeasy.totp.verify({
                secret: twoFactorData.secret,
                encoding: 'base32',
                token: token,
                window: 1
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Token or backup code is required'
            });
        }

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token or backup code'
            });
        }

        // Update last used timestamp
        twoFactorData.lastUsed = new Date();
        await twoFactorData.save();

        // Generate token
        const authToken = generateToken(user._id, user.roles);

        res.json({
            success: true,
            message: 'Login successful',
            token: authToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        console.error('2FA signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during 2FA login'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                twoFactorEnabled: user.twoFactorEnabled,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', authenticateToken, async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username and email are required'
            });
        }

        // Check if username is already taken by another user
        const existingUser = await User.findOne({
            username: username,
            _id: { $ne: req.user.id } // Exclude current user
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Check if email is already taken by another user
        const existingEmail = await User.findOne({
            email: email.toLowerCase(),
            _id: { $ne: req.user.id } // Exclude current user
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Update user using findByIdAndUpdate to avoid password hashing
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                username: username,
                email: email.toLowerCase()
            },
            { new: true, select: '-password' } // Return updated user without password
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                roles: updatedUser.roles,
                twoFactorEnabled: updatedUser.twoFactorEnabled,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password (this will trigger the pre-save middleware to hash it)
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;