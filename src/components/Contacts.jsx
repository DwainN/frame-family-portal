import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const EMPTY = { name: '', relationship: '', phone: '' }

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  // READ
  async function refresh() {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, relationship, phone')
      .order('name')
    if (error) setError(error.message)
    else setContacts(data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  // CREATE or UPDATE, depending on whether we are editing an existing contact.
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const values = {
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      phone: form.phone.trim(),
    }
    const { error } = editingId
      ? await supabase.from('contacts').update(values).eq('id', editingId)
      : await supabase.from('contacts').insert(values)

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setForm(EMPTY)
      setEditingId(null)
      await refresh()
    }
    setSaving(false)
  }

  function startEdit(contact) {
    setEditingId(contact.id)
    setForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  // DELETE
  async function handleDelete(contact) {
    if (!confirm(`Remove ${contact.name} from the frame's contacts?`)) return
    const { error } = await supabase.from('contacts').delete().eq('id', contact.id)
    if (error) return setError(error.message)
    if (editingId === contact.id) cancelEdit()
    await refresh()
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <section className="stack">
      <form className="card stack" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit contact' : 'Add a contact'}</h2>
        <p className="muted">The frame user can call these people by saying their name, like "Call Maria".</p>
        <label>
          Name
          <input value={form.name} onChange={update('name')} required maxLength={60} placeholder="Maria" />
        </label>
        <label>
          Relationship
          <input value={form.relationship} onChange={update('relationship')} maxLength={60} placeholder="Daughter" />
        </label>
        <label>
          Phone
          <input type="tel" value={form.phone} onChange={update('phone')} maxLength={30} placeholder="(561) 555-0123" />
        </label>
        <div className="row">
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add contact'}
          </button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {error && <p className="notice error">{error}</p>}

      <h2>Contacts ({contacts.length})</h2>
      {loading ? (
        <p>Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="muted">No contacts yet. Add the first one above.</p>
      ) : (
        <div className="card list">
          {contacts.map((c) => (
            <div key={c.id} className="list-item">
              <div>
                <strong>{c.name}</strong>
                {c.relationship && <span className="muted"> · {c.relationship}</span>}
                {c.phone && <div className="muted">{c.phone}</div>}
              </div>
              <div className="row">
                <button onClick={() => startEdit(c)}>Edit</button>
                <button className="danger" onClick={() => handleDelete(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
