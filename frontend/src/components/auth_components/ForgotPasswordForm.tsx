"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!identifier.trim()) {
      setError("Please enter your email or mobile number.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log(identifier);

      // Call forgot password API here
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">

        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <KeyRound size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Forgot Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Enter your registered email address or mobile number.
            We'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email or Mobile Number
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <Smartphone className="absolute left-10 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />

              <input
                type="text"
                placeholder="example@gmail.com or 017XXXXXXXX"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-16 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Send OTP
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}