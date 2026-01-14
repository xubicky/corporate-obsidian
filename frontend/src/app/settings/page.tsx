"use client";

import React from "react";
import { User, Shield, Moon, Bell } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

            <div className="space-y-6">

                {/* Profile Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <User size={18} /> Profile & Account
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
                                TX
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">Terry Xu</h3>
                                <p className="text-sm text-slate-500">terry@example.com</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                                <input type="text" value="Terry Xu" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <input type="text" value="Admin" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Moon size={18} /> Appearance
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">Dark Mode</h3>
                                <p className="text-xs text-slate-500">Switch between light and dark themes</p>
                            </div>
                            <button className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
                                System Default (Locked)
                            </button>
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Shield size={18} /> Security
                        </h2>
                    </div>
                    <div className="p-6">
                        <button className="text-blue-600 text-sm hover:underline font-medium">
                            Change Password
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}
