import { useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '../lib/auth'
import toast from 'react-hot-toast'

interface Props {
  onAuth: () => void
  inviteCode?: string | null
}

export default function AuthPage({ onAuth, inviteCode }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password)
        if (error) throw error
      } else {
        const { error } = await signUpWithEmail(email, password, name)
        if (error) throw error
        toast.success('Welcome to Grabbit! 🎉')
      }
      onAuth()
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-brand-700">Grabbit</h1>
          <p className="text-gray-500 mt-2 text-[15px]">
            {inviteCode ? "Sign in to join the shared list" : "AI-powered shopping lists"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-[15px] font-semibold transition-all ${mode === 'login' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-[15px] font-semibold transition-all ${mode === 'signup' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-brand-400"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-brand-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white rounded-xl py-3.5 text-[17px] font-semibold disabled:opacity-60 active:bg-brand-600 transition-colors mt-2"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-gray-400 text-center mt-4">
              You'll get 30 free AI credits to start 🎁
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
