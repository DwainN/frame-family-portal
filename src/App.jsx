import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabaseClient.js'
import Auth from './components/Auth.jsx'
import Photos from './components/Photos.jsx'
import Contacts from './components/Contacts.jsx'
import FramePreview from './components/FramePreview.jsx'

const TABS = [
  { id: 'photos', label: 'Photos' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'preview', label: 'Frame Preview' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('photos')

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
            <span className="muted email">{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()}>Log out</button>
          </div>
        )}
      </header>

      {session && (
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <main className="page">
        {!session && <Auth />}
        {session && tab === 'photos' && <Photos user={session.user} />}
        {session && tab === 'contacts' && <Contacts />}
        {session && tab === 'preview' && <FramePreview />}
      </main>
    </>
  )
}
