import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export const useDev = (userId) => {
  const [isDev, setIsDev] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setIsDev(false); setLoading(false); return }

    const checkDev = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.devstate === true) {
          setIsDev(true); setLoading(false); return
        }
        const { data } = await supabase
          .from('usuarios').select('devstate')
          .eq('id_usuario', userId).maybeSingle()
        if (data?.devstate === true) {
          setIsDev(true)
          await supabase.auth.updateUser({ data: { devstate: true } })
        } else {
          setIsDev(false)
        }
      } catch { setIsDev(false) }
      finally { setLoading(false) }
    }

    checkDev()
  }, [userId])

  return { isDev, loading }
}
