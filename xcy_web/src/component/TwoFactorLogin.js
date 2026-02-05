import React, { useState } from 'react';
import { authAPI } from '../utils/api';

const TwoFactorLogin = ({ userId, onSuccess, onBack }) => {
    const [token, setToken] = useState('');
    const [backupCode, setBackupCode] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authAPI.signin2FA(
                userId,
                useBackupCode ? '' : token,
                useBackupCode ? backupCode : ''
            );

            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                onSuccess(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center">Two-Factor Authentication</h2>
            <p className="text-gray-400 text-center mb-6">
                Enter the code from your authenticator app
            </p>

            <form onSubmit={handleSubmit}>
                {!useBackupCode ? (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            6-digit verification code
                        </label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-500"
                            maxLength={6}
                            required
                        />
                        <div className="mt-2 text-right">
                            <button
                                type="button"
                                onClick={() => setUseBackupCode(true)}
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                Use backup code instead
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Backup code
                        </label>
                        <input
                            type="text"
                            value={backupCode}
                            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                            placeholder="ABCD-EFGH"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center font-mono focus:outline-none focus:border-blue-500"
                            required
                        />
                        <div className="mt-2 text-right">
                            <button
                                type="button"
                                onClick={() => setUseBackupCode(false)}
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                Use authenticator app instead
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || (!useBackupCode && token.length !== 6) || (useBackupCode && !backupCode)}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition disabled:opacity-50"
                >{loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full mt-4 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                    Back to Login
                </button>
            </form>
        </div>
    );
};

export default TwoFactorLogin;