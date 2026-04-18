import { createClient } from '@supabase/supabase-js'

// Estos son tus datos reales de Supabase
const supabaseUrl = 'https://rexysehzyqfxpkvajnpy.supabase.co'
const supabaseAnonKey = 'sb_publishable_waBytcpOqjnmPylrHT9GHQ_fk-05UfU'

// Exportamos el cliente para usarlo en cualquier parte de la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)