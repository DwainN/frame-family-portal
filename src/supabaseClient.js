import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

// Environment variables win if they are set. Otherwise use src/config.js.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// The anon key is a public key that always ships to the browser.
// Row Level Security in supabase/schema.sql is what keeps each user's data private.
export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
