import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

let client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (client) {
    return client
  }

  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error('Local Supabase URL and publishable key are required.')
  }

  let hostname: string

  try {
    hostname = new URL(url).hostname
  } catch {
    throw new Error('The local Supabase URL is invalid.')
  }

  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error('This app is configured for local Supabase only.')
  }

  client = createClient<Database>(url, publishableKey)
  return client
}
