import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const translations = {
  es: {
    // Nav
    guides: 'Guías', stats: 'Estadísticas', challenges: 'Retos', tables: 'Tablas', signIn: 'Iniciar sesión',
    // Header menu
    viewProfile: 'Ver perfil', settings: 'Configuración', adminPanel: 'Panel Admin', signOut: 'Cerrar sesión',
    // Settings
    settingsTitle: 'Configuración', changePassword: 'Cambiar contraseña', language: 'Idioma', theme: 'Tema',
    light: 'Claro', dark: 'Oscuro', newPassword: 'Nueva contraseña', confirmPassword: 'Confirmar contraseña',
    save: 'Guardar', cancel: 'Cancelar', passwordChanged: 'Contraseña actualizada',
    passwordError: 'Error al cambiar contraseña', passwordMismatch: 'Las contraseñas no coinciden',
    passwordShort: 'Mínimo 6 caracteres', back: 'Volver',
    // App main
    analyzeWithAI: 'Analizar con IA', analyzing: 'Analizando...', noImageAvailable: 'No hay imagen disponible',
    configure: 'Configurar', reset: 'Reset', adjustModeAndDifficulty: 'Ajusta modo y dificultad.',
    mode: 'Modo', daily: 'Diario', random: 'Random', difficulty: 'Dificultad',
    suggestedTime: 'Tiempo sugerido', writePrompt: 'Escribe tu prompt',
    promptPlaceholder: 'Ingresa el Prompt que crees que generó la imagen de la derecha',
    promptRecommendation: 'Recomendación: menciona ambiente, estilo o iluminación, y enfócate en objetos concretos.',
    dailyDoneTitle: 'Ya completaste el modo diario de hoy',
    dailyDoneDesc: 'Vuelve mañana para un nuevo desafío, o cambia a modo Random.',
    goToRandom: 'Ir a modo Random',
    analyzingPrompt: 'Analizando tu prompt con IA...',
    // Config modal
    configTitle: 'Ajusta el modo y dificultad', close: 'Cerrar', saveChanges: 'Guardar cambios',
    dailyDesc: 'Imagen más reciente', randomDesc: 'Filtra por dificultad',
    dailyNoFilter: 'En modo diario no se puede filtrar', loading: 'Cargando...',
    // Result panel
    aiAnalysis: 'Análisis de la IA', analysisUnavailable: 'Análisis no disponible en este momento.',
    levelPassed: 'Nivel Superado', keepTrying: 'Sigue intentando',
    strengths: 'Fortalezas', analyzing2: 'Analizando...', improvements: 'Oportunidades de mejora',
    noImprovements: 'Sin puntos a mejorar', learnMore: 'Aprende más',
    // Profile
    memberSince: 'Miembro desde', copyProfileLink: 'Copiar link del perfil',
    editProfile: 'Editar perfil', editBio: 'Editar bio', addBio: 'Agregar bio',
    noBio: 'Sin bio todavía', readMore: 'Leer más', readLess: 'Ver menos',
    statistics: 'Estadísticas', average: 'Promedio', bestScore: 'Mejor score',
    approval: 'Aprobación', totalAttempts: 'Intentos', today: 'Hoy', thisWeek: 'Esta semana',
    worstScore: 'Peor score', scoreEvolution: 'Evolución de scores',
    activityLastYear: 'intentos en el último año', attempt: 'intento', attempts: 'intentos',
    resolutionHistory: 'Historial de resoluciones', noAttempts: 'Sin intentos registrados',
    firstAttempt: 'Hacer mi primer intento', userNotFound: 'Usuario no encontrado',
    backHome: 'Volver al inicio', streak: 'días de racha', streakDay: 'día de racha',
    editStats: 'Editar stats', yourPrompt: 'Tu prompt', originalPrompt: 'Prompt original',
    similarity: 'Similitud', recentStrengths: 'Puntos fuertes recientes', toImprove: 'A mejorar',
    visibleName: 'Nombre visible', uploadPhoto: 'Subir foto de perfil', fileSelected: 'Archivo:',
    saving: 'Guardando...', uploading: 'Subiendo imagen...',
    // Auth
    signInTitle: 'Iniciar sesión', signUpTitle: 'Crear cuenta',
    signInDesc: 'Accede a tu cuenta', signUpDesc: 'Regístrate para guardar tu progreso',
    continueWithGoogle: 'Continuar con Google', orWithEmail: 'O con email',
    publicName: 'Nombre público', username: 'Nombre de usuario',
    usernameHint: 'Solo letras, números y guión bajo. Tu perfil será:',
    email: 'Email', password: 'Contraseña', processing: 'Procesando...',
    noAccount: '¿No tienes cuenta? Regístrate', hasAccount: '¿Ya tienes cuenta? Inicia sesión',
    usernameMin: 'El usuario debe tener al menos 3 caracteres',
    usernameTaken: 'Ese nombre de usuario ya está en uso',
    nameRequired: 'El nombre es requerido',
  },
  en: {
    // Nav
    guides: 'Guides', stats: 'Statistics', challenges: 'Challenges', tables: 'Tables', signIn: 'Sign in',
    // Header menu
    viewProfile: 'View profile', settings: 'Settings', adminPanel: 'Admin Panel', signOut: 'Sign out',
    // Settings
    settingsTitle: 'Settings', changePassword: 'Change password', language: 'Language', theme: 'Theme',
    light: 'Light', dark: 'Dark', newPassword: 'New password', confirmPassword: 'Confirm password',
    save: 'Save', cancel: 'Cancel', passwordChanged: 'Password updated',
    passwordError: 'Error changing password', passwordMismatch: 'Passwords do not match',
    passwordShort: 'Minimum 6 characters', back: 'Back',
    // App main
    analyzeWithAI: 'Analyze with AI', analyzing: 'Analyzing...', noImageAvailable: 'No image available',
    configure: 'Configure', reset: 'Reset', adjustModeAndDifficulty: 'Adjust mode and difficulty.',
    mode: 'Mode', daily: 'Daily', random: 'Random', difficulty: 'Difficulty',
    suggestedTime: 'Suggested time', writePrompt: 'Write your prompt',
    promptPlaceholder: 'Enter the prompt you think generated the image on the right',
    promptRecommendation: 'Tip: mention environment, style or lighting, and focus on concrete objects.',
    dailyDoneTitle: 'You already completed today\'s daily challenge',
    dailyDoneDesc: 'Come back tomorrow for a new challenge, or switch to Random mode.',
    goToRandom: 'Go to Random mode',
    analyzingPrompt: 'Analyzing your prompt with AI...',
    // Config modal
    configTitle: 'Adjust mode and difficulty', close: 'Close', saveChanges: 'Save changes',
    dailyDesc: 'Most recent image', randomDesc: 'Filter by difficulty',
    dailyNoFilter: 'Daily mode cannot be filtered', loading: 'Loading...',
    // Result panel
    aiAnalysis: 'AI Analysis', analysisUnavailable: 'Analysis not available at this time.',
    levelPassed: 'Level Passed', keepTrying: 'Keep trying',
    strengths: 'Strengths', analyzing2: 'Analyzing...', improvements: 'Areas to improve',
    noImprovements: 'No improvements needed', learnMore: 'Learn more',
    // Profile
    memberSince: 'Member since', copyProfileLink: 'Copy profile link',
    editProfile: 'Edit profile', editBio: 'Edit bio', addBio: 'Add bio',
    noBio: 'No bio yet', readMore: 'Read more', readLess: 'Read less',
    statistics: 'Statistics', average: 'Average', bestScore: 'Best score',
    approval: 'Approval', totalAttempts: 'Attempts', today: 'Today', thisWeek: 'This week',
    worstScore: 'Worst score', scoreEvolution: 'Score evolution',
    activityLastYear: 'contributions in the last year', attempt: 'attempt', attempts: 'attempts',
    resolutionHistory: 'Resolution history', noAttempts: 'No attempts recorded',
    firstAttempt: 'Make my first attempt', userNotFound: 'User not found',
    backHome: 'Back to home', streak: 'day streak', streakDay: 'day streak',
    editStats: 'Edit stats', yourPrompt: 'Your prompt', originalPrompt: 'Original prompt',
    similarity: 'Similarity', recentStrengths: 'Recent strengths', toImprove: 'To improve',
    visibleName: 'Display name', uploadPhoto: 'Upload profile photo', fileSelected: 'File:',
    saving: 'Saving...', uploading: 'Uploading...',
    // Auth
    signInTitle: 'Sign in', signUpTitle: 'Create account',
    signInDesc: 'Access your account', signUpDesc: 'Sign up to save your progress',
    continueWithGoogle: 'Continue with Google', orWithEmail: 'Or with email',
    publicName: 'Display name', username: 'Username',
    usernameHint: 'Letters, numbers and underscores only. Your profile will be:',
    email: 'Email', password: 'Password', processing: 'Processing...',
    noAccount: 'Don\'t have an account? Sign up', hasAccount: 'Already have an account? Sign in',
    usernameMin: 'Username must be at least 3 characters',
    usernameTaken: 'That username is already taken',
    nameRequired: 'Name is required',
  }
}

const LangContext = createContext()

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es')

  const t = (key) => translations[lang]?.[key] ?? translations['es'][key] ?? key

  const changeLang = async (l) => {
    setLang(l)
    localStorage.setItem('lang', l)
    // Sincronizar con BD si hay sesión activa
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('usuarios')
          .update({ idioma_preferido: l })
          .eq('id_usuario', user.id)
      }
    } catch (_) {}
  }

  // Al montar, leer idioma_preferido de la BD si hay sesión
  useEffect(() => {
    const loadLangFromDB = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('usuarios')
          .select('idioma_preferido')
          .eq('id_usuario', user.id)
          .maybeSingle()
        if (data?.idioma_preferido && ['es', 'en'].includes(data.idioma_preferido)) {
          setLang(data.idioma_preferido)
          localStorage.setItem('lang', data.idioma_preferido)
        }
      } catch (_) {}
    }
    loadLangFromDB()
  }, [])

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
