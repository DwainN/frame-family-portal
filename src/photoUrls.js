import { supabase } from './supabaseClient.js'

// The "photos" bucket is private, so images are shown with short-lived signed URLs.
// Returns the photo rows with an extra "url" field on each one.
export async function withSignedUrls(photos) {
  if (photos.length === 0) return []
  const paths = photos.map((p) => p.image_path)
  const { data, error } = await supabase.storage.from('photos').createSignedUrls(paths, 60 * 60)
  if (error) throw error
  const urlByPath = Object.fromEntries(data.map((d) => [d.path, d.signedUrl]))
  return photos.map((p) => ({ ...p, url: urlByPath[p.image_path] }))
}

export async function loadPhotos() {
  const { data, error } = await supabase
    .from('photos')
    .select('id, caption, image_path, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return withSignedUrls(data)
}
