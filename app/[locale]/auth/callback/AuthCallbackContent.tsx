"use client"

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/dashboard";
    const processMagicLink = async () => {
      if (code) {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // Redirect to dashboard (preserve locale)
          router.replace(next);
        } else {
          // Handle error (could show a message or redirect to login)
          router.replace(`/auth?error=invalid_code`);
        }
      } else {
        // No code, redirect to login
        router.replace("/auth");
      }
    };
    processMagicLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="text-lg font-semibold text-gray-700">Processing magic link...</div>
    </div>
  );
} 