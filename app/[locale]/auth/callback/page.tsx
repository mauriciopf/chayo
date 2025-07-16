"use client"

import { Suspense } from "react";
import AuthCallbackContent from "./AuthCallbackContent";

export default function LocaleAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50"><div className="text-lg font-semibold text-gray-700">Processing magic link...</div></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
} 