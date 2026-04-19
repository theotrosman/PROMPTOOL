import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ensureUserProfile = async (u) => {
  if (!u) return
  try {
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('id_usuario', u.id)
      .maybeSingle()

    if (!existing) {
      const nombre = u.user_metadata?.full_name || u.user_metadata?.nombre || u.email?.split('@')[0] || 'Usuario'
      await supabase.from('usuarios').insert([{
        id_usuario: u.id,
        nombre,
        email: u.email,
        idioma_preferido: 'es',
        adminstate: false,
      }])
    }
  } catch (err) {
    console.error('ensureUserProfile error:', err)
  }
}

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sesión actual al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) ensureUserProfile(u)
    })

    // Cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (_event === 'SIGNED_IN') ensureUserProfile(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) console.error('Error signing in with Google:', error)
  }

  const signInWithEmail = async (email, password) => {
    // Allow login with username — resolve to email first
    let loginEmail = email
    if (!email.includes('@')) {
      const { data } = await supabase
        .from('usuarios')
        .select('email')
        .ilike('username', email)
        .maybeSingle()
      if (!data?.email) throw new Error('Username not found')
      loginEmail = data.email
    }
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    if (error) throw error
  }

  const signUpWithEmail = async (email, password, nombre, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error

    if (data.user) {
      const { error: dbError } = await supabase.from('usuarios').insert([{
        id_usuario: data.user.id,
        nombre,
        username: username || null,
        email,
        idioma_preferido: 'es',
        adminstate: false,
      }])
      if (dbError) console.error('Error creating user profile:', dbError)
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
  }

  return { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }
}
