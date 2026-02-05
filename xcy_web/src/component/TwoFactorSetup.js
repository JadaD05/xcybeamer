import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { authAPI } from '../utils/api';

const TwoFactorSetup = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Backup codes
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSetup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.setup2FA();
            setQrCode(res.data.qrCode);
            setSecret(res.data.secret);
            setBackupCodes(res.data.backupCodes);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to setup 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!token.trim()) {
            setError('Please enter the verification code');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            await authAPI.verify2FA(token);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = () => {
        onComplete();
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Two-Factor Authentication</h2>
            
            {step === 1 && (
                <div className="text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Enable 2FA</h3>
                        <p className="text-gray-400 mb-6">
                            Two-factor authentication adds an extra layer of security to your account.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleSetup}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Setting up...' : 'Begin Setup'}
                    </button>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}
            
            {step === 2 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Scan QR Code</h3>
                    <p className="text-gray-400 mb-4">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    
                    <div className="bg-white p-4 rounded-lg mb-6 flex justify-center">
                        {qrCode && <QRCode value={qrCode} size={200} />}
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-400 mb-2">Or enter this secret manually:</p>
                        <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
                            {secret}
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Enter verification code from your app
                        </label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-500"
                            maxLength={6}
                        />
                    </div>
                    
                    <button
                        onClick={handleVerify}
                        disabled={loading || token.length !== 6}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}
            
            {step === 3 && (
                <div>
                    <div className="mb-6 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">2FA Enabled Successfully!</h3>
                        <p className="text-gray-400">
                            Two-factor authentication is now enabled for your account.
                        </p>
                    </div>
                    
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-yellow-400">⚠️ Save Your Backup Codes</h4>
                        <p className="text-sm text-gray-400 mb-3">
                            These codes can be used to access your account if you lose your authenticator device.
                            Save them in a secure place.
                        </p>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="bg-gray-900 p-2 rounded text-center font-mono text-sm">
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Each code can only be used once.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleComplete}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                    >
                        Done
                    </button>
                </div>
            )}
            
            {step !== 3 && (
                <button
                    onClick={onCancel}
                    className="w-full mt-4 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                    Cancel
                </button>
            )}
        </div>
    );
};

export default TwoFactorSetup;