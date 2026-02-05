const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id });

        if (!user) {
            throw new Error();
        }

        // Map JWT 'id' to '_id' for consistency with MongoDB
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Please authenticate' });
    }
};

// Middleware to check if 2FA is required
const require2FA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.twoFactorEnabled) {
            // Check if 2FA was recently verified (within last 24 hours)
            const twoFactorData = await TwoFactorAuth.findOne({ userId: user._id });

            if (!twoFactorData || !twoFactorData.lastUsed) {
                return res.status(403).json({
                    success: false,
                    message: '2FA verification required',
                    requires2FA: true
                });
            }

            const hoursSinceLast2FA = (new Date() - twoFactorData.lastUsed) / (1000 * 60 * 60);
            if (hoursSinceLast2FA > 24) {
                return res.status(403).json({
                    success: false,
                    message: '2FA verification required',
                    requires2FA: true
                });
            }
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin check middleware (updated for roles array)
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Check if the user has 'admin' in their roles array
    if (!Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }

    next();
};

// Export both for backward compatibility and new usage
module.exports = {
    authenticateToken,
    isAdmin,
    require2FA
};
