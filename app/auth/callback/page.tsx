"use client"

import { Suspense } from "react";
import AuthCallbackContent from "./AuthCallbackContent";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50"><div className="text-lg font-semibold text-gray-700">Redirecting to your language...</div></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
} 