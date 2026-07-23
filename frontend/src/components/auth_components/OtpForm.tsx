"use client";

import { useRef, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { submitOtp, resendOtp } from "@/src/services/auth.service";

export default function OtpForm() {
  const router = useRouter();
  const OTP_LENGTH = 6;

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  // const email = localStorage.getItem("verifyEmail");
  if (!email) {
    alert("Email not found");
    return;
  }


  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (
    value: string,
    index: number
  ) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    const newOtp = [...otp];

    pasted.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    inputRefs.current[
      Math.min(pasted.length, OTP_LENGTH - 1)
    ]?.focus();
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const code = otp.join("");

    if (code.length !== OTP_LENGTH) return;

    setLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    console.log(code);

    setLoading(true);
    try {
      const res = await submitOtp(
        {
          email: email,
          otp: code,
        });

      alert("OTP Verified Successfully!");

      // ✅ redirect
      router.push("/");

    } catch (error: any) {
      alert(error.response?.data?.message || "Invalid or expired OTP");
    }


    // ✅ RESEND OTP API
    const handleResend = async () => {
      if (!email) return;

      try {
        await resendOtp({ email });
        alert("OTP sent again");
      } catch {
        alert("Failed to resend OTP");
      }
    };
  };


  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={28} />
          </div>

          <h2 className="mt-5 text-3xl font-bold text-slate-900">
            Verify OTP
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enter the 6-digit verification code sent to
            your email.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8"
        >
          {/* OTP */}
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                onPaste={handlePaste}
                onKeyDown={(e) =>
                  handleKeyDown(e, index)
                }
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
                className="h-14 w-14 rounded-xl border border-slate-300 text-center text-xl font-semibold outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            ))}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Verify OTP
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Didn't receive the code?{" "}
            {seconds > 0 ? (
              <span>
                Resend in{" "}
                <span className="font-semibold text-blue-600">
                  {seconds}s
                </span>
              </span>
            ) : (
              <button
                type="button"
                className="font-semibold text-blue-600 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}