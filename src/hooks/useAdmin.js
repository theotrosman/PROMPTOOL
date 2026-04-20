import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export const useAdmin = (userId) => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    const checkAdmin = async () => {
      try {
        // 1. Intentar desde metadata del JWT (no requiere RLS, es instantáneo)
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.user_metadata?.adminstate === true) {
          setIsAdmin(true)
          setLoading(false)
          return
        }

        // 2. Fallback: leer desde la tabla (funciona porque tenemos public_read_profiles)
        const { data, error } = await supabase
          .from('usuarios')
          .select('adminstate')
          .eq('id_usuario', userId)
          .maybeSingle()

        if (error) {
          setIsAdmin(false)
          return
        }

        if (data?.adminstate === true) {
          setIsAdmin(true)
          // Sincronizar al metadata para que la próxima vez sea instantáneo
          await supabase.auth.updateUser({ data: { adminstate: true } })
        } else {
          setIsAdmin(false)
        }
      } catch {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [userId])

  return { isAdmin, loading }
}
