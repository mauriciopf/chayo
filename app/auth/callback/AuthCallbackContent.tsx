"use client"

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to get the preferred locale from localStorage, fallback to 'en'
    const preferredLocale =
      (typeof window !== "undefined" && localStorage.getItem("locale")) || "en";
    const params = searchParams.toString();
    router.replace(`/${preferredLocale}/auth/callback${params ? `?${params}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="text-lg font-semibold text-gray-700">Redirecting to your language...</div>
    </div>
  );
} 