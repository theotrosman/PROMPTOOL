import { createClient } from '@supabase/supabase-js'

// Usamos variables de entorno para mayor seguridad
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de que las variables de entorno existan
// IMPORTANTE: no lanzamos un throw aquí porque mataría la app antes de que React monte.
// En su lugar, exportamos un cliente null-safe y manejamos el error en los componentes.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Verifica que el archivo .env esté presente y que Vite lo esté leyendo correctamente.'
  )
}

// Si faltan las variables, creamos un cliente con valores vacíos que fallará en runtime
// de forma controlada (el error se captura en el useEffect de App.jsx).
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

/*
IMPORTANTE PARA SEGURIDAD:
1. Asegúrate de que Row Level Security (RLS) esté habilitado en Supabase
2. Configura políticas de acceso apropiadas para las tablas 'imagenes_ia' e 'intentos'
3. La Anon Key solo debe tener permisos de SELECT en 'imagenes_ia' e INSERT en 'intentos'
4. Nunca uses la Service Role Key en el frontend
*/