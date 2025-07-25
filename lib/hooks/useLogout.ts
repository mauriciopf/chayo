import { supabase } from '@/lib/supabase/client'

export const useLogout = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return { handleLogout }
} 