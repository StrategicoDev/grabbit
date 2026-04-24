import { supabase, HUB_URL } from './supabase'

export async function ensureAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session
  
  const currentUrl = window.location.href
  window.location.href = `${HUB_URL}/auth?redirect=${encodeURIComponent(currentUrl)}`
  return null
}

export async function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) return

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (!error) {
    window.history.replaceState({}, '', '/')
  }
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/'
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || email.split('@')[0] } }
  })
}
