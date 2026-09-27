import { useEffect, useRef, useState } from 'react'
import { loadPhotos } from '../photoUrls.js'

const SECONDS_PER_PHOTO = 6

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Shows the photos the way the real frame will (design doc 2.2.1):
// photos are shuffled into a queue, and the queue must empty before it is reshuffled,
// so no photo repeats until every other photo has been shown once.
export default function FramePreview() {
  const [photos, setPhotos] = useState([])
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState(null)
  const queue = useRef([])
  const frameRef = useRef(null)

  useEffect(() => {
    loadPhotos().then(setPhotos).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (photos.length === 0) return

    function next() {
      if (queue.current.length === 0) queue.current = shuffle(photos)
      setCurrent(queue.current.shift())
    }

    next()
    const timer = setInterval(next, SECONDS_PER_PHOTO * 1000)
    return () => clearInterval(timer)
  }, [photos])

  function goFullscreen() {
    frameRef.current?.requestFullscreen?.()
  }

  if (error) return <p className="notice error">{error}</p>

  return (
    <section className="stack">
      <div className="row between">
        <p className="muted">This is what the picture frame shows. A new photo appears every {SECONDS_PER_PHOTO} seconds.</p>
        <button onClick={goFullscreen} disabled={!current}>Full screen</button>
      </div>
      <div className="frame" ref={frameRef}>
        {current ? (
          <>
            <img key={current.id} src={current.url} alt={current.caption || 'Family photo'} className="frame-photo" />
            {current.caption && <div className="frame-caption">{current.caption}</div>}
          </>
        ) : (
          <div className="frame-empty">Add photos to see the slideshow.</div>
        )}
      </div>
    </section>
  )
}
