import { supabase } from '@/lib/shared/supabase/client'

export const useLogout = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return { handleLogout }
} 