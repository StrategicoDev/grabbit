import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const MARKETPLACE_URL = SUPABASE_URL
export const HUB_URL = 'https://hub.strategico.app'
export const APP_ID = 'shopping-list'
