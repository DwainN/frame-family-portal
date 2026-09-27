import { useState } from 'react'
import { supabase } from '../supabaseClient.js'

// One form that switches between "Log in" and "Sign up".
export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (!data.session) {
        // Supabase has "Confirm email" turned on, so there is no session yet.
        setMessage({ type: 'info', text: 'Account made. Check your email to confirm it, then log in.' })
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
    }

    setBusy(false)
  }

  const isSignup = mode === 'signup'

  return (
    <div className="auth-card card">
      <h2>{isSignup ? 'Create an account' : 'Log in'}</h2>
      <p className="muted">
        Family members use this portal to choose the photos and contacts that show on the picture frame.
      </p>

      <form onSubmit={handleSubmit} className="stack">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>

      {message && <p className={`notice ${message.type}`}>{message.text}</p>}

      <p className="switch">
        {isSignup ? 'Already have an account?' : 'New here?'}{' '}
        <button type="button" className="link" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setMessage(null) }}>
          {isSignup ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}
