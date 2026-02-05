const mongoose = require('mongoose');

const TwoFactorAuthSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    secret: {
        type: String,
        required: true
    },
    backupCodes: [{
        code: String,
        used: { type: Boolean, default: false }
    }],
    enabled: {
        type: Boolean,
        default: false
    },
    lastUsed: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TwoFactorAuth', TwoFactorAuthSchema);