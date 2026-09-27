import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabaseClient.js'
import Auth from './components/Auth.jsx'
import Photos from './components/Photos.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    // Keep the UI in sync when the user logs in or out.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <main className="page">
        <h1>Frame Family Portal</h1>
        <p className="notice error">Supabase is not set up yet. Add your project URL and anon key to src/config.js.</p>
      </main>
    )
  }

  if (loading) return <main className="page"><p>Loading…</p></main>

  return (
    <>
      <header className="topbar">
        <span className="brand">🖼️ Frame Family Portal</span>
        {session && (
          <div className="user">
            <span className="muted">{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()}>Log out</button>
          </div>
        )}
      </header>
      <main className="page">
        {session ? <Photos user={session.user} /> : <Auth />}
      </main>
    </>
  )
}
