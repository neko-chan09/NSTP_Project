// src/pages/auth/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const startTimer = () => {
        setTimer(60);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authApi.sendOtp(email);
            toast.success('OTP sent to your email!');
            setStep('otp');
            startTimer();
        } catch (err: any) {
            toast.error(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authApi.verifyOtp(email, otp);
            setResetToken(response.data.reset_token);
            toast.success('OTP verified! Set your new password.');
            setStep('reset');
        } catch (err: any) {
            toast.error(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await authApi.resetPassword(email, resetToken, newPassword, confirmPassword);
            toast.success('Password reset successfully! Please login with your new password.');
            navigate('/login');
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);

        try {
            await authApi.resendOtp(email);
            toast.success('New OTP sent!');
            startTimer();
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-key text-2xl text-gold-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-navy-900">Reset Password</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {step === 'email' && 'Enter your email to receive an OTP'}
                        {step === 'otp' && 'Enter the OTP sent to your email'}
                        {step === 'reset' && 'Set your new password'}
                    </p>
                </div>

                {/* Step 1: Email */}
                {step === 'email' && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="label">Email Address</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin" /> Sending...</>
                            ) : (
                                'Send OTP'
                            )}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm text-gold-600 hover:text-gold-700">
                                <i className="fas fa-arrow-left mr-1" /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="label">OTP Code</label>
                            <input
                                type="text"
                                className="input text-center text-2xl tracking-widest"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Enter the 6-digit code sent to {email}
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading || otp.length < 6}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin" /> Verifying...</>
                            ) : (
                                'Verify OTP'
                            )}
                        </button>

                        <div className="flex justify-between text-sm">
                            <button
                                type="button"
                                className="text-gold-600 hover:text-gold-700"
                                onClick={() => setStep('email')}
                            >
                                <i className="fas fa-arrow-left mr-1" /> Change Email
                            </button>
                            <button
                                type="button"
                                className={`${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-gold-600 hover:text-gold-700'}`}
                                onClick={handleResendOtp}
                                disabled={timer > 0 || loading}
                            >
                                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: Reset Password */}
                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="label">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
                        </div>

                        <div>
                            <label className="label">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin" /> Resetting...</>
                            ) : (
                                'Reset Password'
                            )}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm text-gold-600 hover:text-gold-700">
                                <i className="fas fa-arrow-left mr-1" /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}

                {/* Info Box */}
                {step !== 'reset' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-info-circle text-blue-500 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Didn't receive the OTP?</p>
                                <ul className="text-xs text-blue-600 mt-1 space-y-1 list-disc list-inside">
                                    <li>Check your spam/junk folder</li>
                                    <li>Make sure you entered the correct email</li>
                                    <li>Wait a few seconds and try resending</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;