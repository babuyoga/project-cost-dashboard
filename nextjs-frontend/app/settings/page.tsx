"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { Lock, User, Mail, AlertCircle, CheckCircle2, Home } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, authorized } = useAuthGuard();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validation
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!authorized || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold">
            Account Settings
          </h1>
          <Link href="/">
            <Button className="gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* Profile Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Profile Information
          </h2>
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Username</label>
              <div className="flex items-center gap-2 text-slate-200 bg-slate-950/50 p-3 rounded border border-slate-800">
                <User className="w-4 h-4 text-slate-500" />
                <span>{user.username}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Email</label>
              <div className="flex items-center gap-2 text-slate-200 bg-slate-950/50 p-3 rounded border border-slate-800">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{user.email || "No email set"}</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Password Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            Change Password
          </h2>
          <Card className="p-6 bg-slate-900 border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded border border-red-900/50">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/30 p-3 rounded border border-green-900/50">
                  <CheckCircle2 className="w-4 h-4" />
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}
