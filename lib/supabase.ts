import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables not found. Using local storage fallback.")
    return null
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    console.warn("Invalid Supabase URL format. Using local storage fallback.")
    return null
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        fetch: (url, options = {}) => {
          // Add timeout to prevent hanging requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => {
            clearTimeout(timeoutId)
          })
        },
      },
    })
  } catch (error) {
    console.warn("Failed to create Supabase client:", error)
    return null
  }
}

// Create a single supabase client for server components
export const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables not found. Using local storage fallback.")
    return null
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    console.warn("Invalid Supabase URL format. Using local storage fallback.")
    return null
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.warn("Failed to create Supabase server client:", error)
    return null
  }
}
