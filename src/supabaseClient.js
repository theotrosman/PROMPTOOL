import { createClient } from '@supabase/supabase-js'

// Usamos variables de entorno para mayor seguridad
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de que las variables de entorno existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

// Exportamos el cliente para usarlo en cualquier parte de la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
IMPORTANTE PARA SEGURIDAD:
1. Asegúrate de que Row Level Security (RLS) esté habilitado en Supabase
2. Configura políticas de acceso apropiadas para las tablas 'imagenes_ia' e 'intentos'
3. La Anon Key solo debe tener permisos de SELECT en 'imagenes_ia' e INSERT en 'intentos'
4. Nunca uses la Service Role Key en el frontend
*/