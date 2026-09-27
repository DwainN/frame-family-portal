import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { loadPhotos } from '../photoUrls.js'

export default function Photos({ user }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add form
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editCaption, setEditCaption] = useState('')

  async function refresh() {
    try {
      setPhotos(await loadPhotos())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  // CREATE: upload the image file to Storage, then save a row in the photos table.
  async function handleAdd(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('photos').upload(path, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('photos').insert({ caption: caption.trim(), image_path: path })
    if (insertError) {
      // Do not leave an orphan file behind if the row could not be saved.
      await supabase.storage.from('photos').remove([path])
      setError(insertError.message)
    } else {
      setFile(null)
      setCaption('')
      setFileInputKey((k) => k + 1)
      await refresh()
    }
    setUploading(false)
  }

  // UPDATE: change the caption.
  async function handleSave(id) {
    const { error } = await supabase.from('photos').update({ caption: editCaption.trim() }).eq('id', id)
    if (error) return setError(error.message)
    setEditingId(null)
    await refresh()
  }

  // DELETE: remove the row and the image file.
  async function handleDelete(photo) {
    if (!confirm('Delete this photo from the frame?')) return
    const { error } = await supabase.from('photos').delete().eq('id', photo.id)
    if (error) return setError(error.message)
    await supabase.storage.from('photos').remove([photo.image_path])
    await refresh()
  }

  return (
    <section className="stack">
      <form className="card stack" onSubmit={handleAdd}>
        <h2>Add a photo</h2>
        <label>
          Photo
          <input key={fileInputKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} required />
        </label>
        <label>
          Caption (shown and read out loud on the frame)
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Grandma and the kids at the beach" maxLength={120} />
        </label>
        <button type="submit" className="primary" disabled={uploading || !file}>
          {uploading ? 'Uploading…' : 'Add photo'}
        </button>
      </form>

      {error && <p className="notice error">{error}</p>}

      <h2>Photos on the frame ({photos.length})</h2>
      {loading ? (
        <p>Loading…</p>
      ) : photos.length === 0 ? (
        <p className="muted">No photos yet. Add the first one above.</p>
      ) : (
        <div className="grid">
          {photos.map((photo) => (
            <article key={photo.id} className="card photo-card">
              <img src={photo.url} alt={photo.caption || 'Family photo'} />
              {editingId === photo.id ? (
                <div className="stack">
                  <input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} maxLength={120} autoFocus />
                  <div className="row">
                    <button className="primary" onClick={() => handleSave(photo.id)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="caption">{photo.caption || <span className="muted">No caption</span>}</p>
                  <div className="row">
                    <button onClick={() => { setEditingId(photo.id); setEditCaption(photo.caption) }}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(photo)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
