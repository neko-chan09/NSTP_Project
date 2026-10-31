// src/pages/auth/Login.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../services/api";
import toast from "react-hot-toast";
import NstpLogo from "../components/common/NstpLogo";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Redirect if already logged in
    useEffect(() => {
        const token =
            localStorage.getItem("token") || localStorage.getItem("nstp_token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.role === "faculty") {
                    navigate("/faculty", { replace: true });
                } else if (
                    user?.role === "super_admin" ||
                    user?.role === "admin"
                ) {
                    navigate("/admin", { replace: true });
                } else {
                    localStorage.removeItem("token");
                    localStorage.removeItem("nstp_token");
                    localStorage.removeItem("user");
                    setIsChecking(false);
                }
                return;
            } catch (e) {
                localStorage.removeItem("token");
                localStorage.removeItem("nstp_token");
                localStorage.removeItem("user");
            }
        }
        setIsChecking(false);
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authApi.adminLogin(email, password);
            if (response.access_token || response.token) {
                const token = response.access_token || response.token;
                if (token) {
                    localStorage.setItem("token", token);
                    localStorage.setItem("nstp_token", token);
                }
                localStorage.setItem("user", JSON.stringify(response.user));

                toast.success("Login successful!");

                const user = response.user;
                if (user?.role === "faculty") {
                    window.location.href = "/faculty";
                } else if (
                    user?.role === "super_admin" ||
                    user?.role === "admin"
                ) {
                    window.location.href = "/admin";
                } else {
                    toast.error("Access denied. Please use the mobile app.");
                    window.location.href = "/login";
                }
            }
        } catch (err: any) {
            toast.error(
                err.message || "Login failed. Please check your credentials.",
            );
            setLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-50%] right-[-20%] w-[800px] h-[800px] bg-gold-500/5 rounded-full pointer-events-none" />
            <div className="absolute bottom-[-40%] left-[-10%] w-[600px] h-[600px] bg-navy-600/5 rounded-full pointer-events-none" />

            <div className="grid md:grid-cols-[1fr_1.2fr] max-w-[1100px] w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 min-h-[600px]">
                {/* Left Panel - Branding */}
                <div className="bg-gradient-to-br from-navy-600 via-navy-800 to-navy-900 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-gold-500/10 rounded-full" />
                    <div className="absolute bottom-[-150px] left-[-150px] w-[400px] h-[400px] bg-gold-500/5 rounded-full" />

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Logo */}
                        {/* Logo */}
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 p-1">
                                <NstpLogo
                                    size={56}
                                    className="w-full h-full rounded-lg"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gold-500">
                                    NSTP Office
                                </h1>
                                <p className="text-xs text-white/40 uppercase tracking-[2.5px] font-medium">
                                    Management System
                                </p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="flex-1 flex flex-col gap-4 justify-center py-6">
                            {[
                                {
                                    icon: "shield-alt",
                                    title: "Secure Access",
                                    desc: "Role-based authentication for all users",
                                },
                                {
                                    icon: "users-cog",
                                    title: "User Management",
                                    desc: "Manage admins, faculty, and students",
                                },
                                {
                                    icon: "chart-line",
                                    title: "Real-time Analytics",
                                    desc: "Track attendance, compliance, and progress",
                                },
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-gold-500/10 hover:bg-gold-500/5 hover:border-gold-500/20 transition-all hover:translate-x-1"
                                >
                                    <div className="w-10 h-10 min-w-[40px] rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500">
                                        <i
                                            className={`fas fa-${feature.icon} text-lg`}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">
                                            {feature.title}
                                        </h4>
                                        <p className="text-xs text-white/40">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gold-500/10">
                            <p className="text-xs text-white/20 text-center">
                                &copy; {new Date().getFullYear()} NSTP Office.
                                All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="p-8 md:p-10 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-navy-900">
                                Welcome Back
                            </h2>
                            <p className="text-sm text-slate-500">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="label">
                                    <i className="fas fa-envelope text-slate-400 mr-2" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="input"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">
                                    <i className="fas fa-lock text-slate-400 mr-2" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        className="input pr-12"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        <i
                                            className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-gold-500"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-gold-600 hover:text-gold-700 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-navy-600 to-navy-700 text-white rounded-xl font-bold text-base hover:from-navy-700 hover:to-navy-800 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <i className="fas fa-arrow-right text-sm" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                <span className="block">
                                    Web access is for admin and faculty
                                    accounts.
                                </span>
                                <span className="block text-slate-400 text-[11px] mt-1">
                                    Students should sign in from the mobile app.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
