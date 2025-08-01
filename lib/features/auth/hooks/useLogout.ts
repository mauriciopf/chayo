import { supabase } from '@/lib/shared/supabase/client'

export const useLogout = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return { handleLogout }
} 