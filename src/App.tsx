import { useEffect, useMemo, useRef, useState } from 'react'
import githubMark from './assets/github-mark.svg'
import { createMidiFile, type PlaybackController, playSong } from './audio'
import { ChordChart } from './ChordChart'
import { parseSong } from './parser'

const examples = import.meta.glob('../Chansons/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>
const entries = Object.entries(examples).sort(([a], [b]) =>
  a.localeCompare(b, 'fr'),
)
const initial =
  entries.find(([p]) => p.endsWith('/Blackbird.txt'))?.[1] ??
  `Ma chanson\n\nStructure:\n4/4 n=120\nCouplet : premier couplet\n\nCouplet:\n4: C Am F G`

export default function App() {
  const [source, setSource] = useState(initial)
  const [editorScroll, setEditorScroll] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpWidth, setHelpWidth] = useState(720)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [splitPosition, setSplitPosition] = useState(42)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [activeMeasureId, setActiveMeasureId] = useState<string | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const playbackRef = useRef<PlaybackController | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const song = useMemo(() => parseSong(source), [source])
  const errors = song.diagnostics.filter((d) => d.severity === 'error').length
  useEffect(() => {
    if (!helpOpen) return
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [helpOpen])
  useEffect(() => {
    const updateFullscreen = () =>
      setPreviewFullscreen(document.fullscreenElement === previewRef.current)
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () =>
      document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])
  useEffect(
    () => () => {
      playbackRef.current?.stop()
      playbackRef.current = null
    },
    [source],
  )
  const togglePreviewFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await previewRef.current?.requestFullscreen()
  }
  const stopPlayback = () => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setPlaying(false)
    setPaused(false)
    setActiveMeasureId(null)
  }
  const startPlayback = async () => {
    stopPlayback()
    setPlaying(true)
    setPaused(false)
    playbackRef.current = await playSong(
      song,
      setActiveMeasureId,
      () => {
        playbackRef.current = null
        setPlaying(false)
        setPaused(false)
      },
      { metronome: metronomeEnabled },
    )
  }
  const togglePause = async () => {
    const playback = playbackRef.current
    if (!playback) return
    if (paused) {
      await playback.resume()
      setPaused(false)
    } else {
      await playback.pause()
      setPaused(true)
    }
  }
  const startHelpResize = (event: React.PointerEvent<HTMLHRElement>) => {
    event.preventDefault()
    const handle = event.currentTarget
    const pointerId = event.pointerId
    handle.setPointerCapture(pointerId)
    const startX = event.clientX
    const startWidth = helpWidth
    const resize = (moveEvent: PointerEvent) =>
      setHelpWidth(
        Math.max(
          360,
          Math.min(
            window.innerWidth - 24,
            startWidth + startX - moveEvent.clientX,
          ),
        ),
      )
    const stop = () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      if (handle.hasPointerCapture(pointerId))
        handle.releasePointerCapture(pointerId)
    }
    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }
  const startWorkspaceResize = (event: React.PointerEvent<HTMLHRElement>) => {
    event.preventDefault()
    const handle = event.currentTarget
    const pointerId = event.pointerId
    handle.setPointerCapture(pointerId)
    const resize = (moveEvent: PointerEvent) => {
      const bounds = workspaceRef.current?.getBoundingClientRect()
      if (!bounds) return
      const position = ((moveEvent.clientX - bounds.left) / bounds.width) * 100
      setSplitPosition(Math.max(25, Math.min(75, position)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      if (handle.hasPointerCapture(pointerId))
        handle.releasePointerCapture(pointerId)
    }
    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }
  const exportSvg = () => {
    const svg = document.getElementById('chord-chart')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }))
    a.download = `${
      song.title
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'grille'
    }.svg`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const exportText = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([source], { type: 'text/plain;charset=utf-8' }),
    )
    a.download = `${
      song.title
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'grille'
    }.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const exportMidi = () => {
    const data = createMidiFile(song)
    const buffer = new ArrayBuffer(data.byteLength)
    new Uint8Array(buffer).set(data)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([buffer], { type: 'audio/midi' }))
    a.download = `${
      song.title
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'grille'
    }.mid`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importText = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    stopPlayback()
    setSource(await file.text())
    event.target.value = ''
  }
  return (
    <main>
      <header>
        <div>
          <span className="eyebrow">ÉDITEUR MUSICAL</span>
          <h1>
            Grille <i>Accords</i>
          </h1>
        </div>
        <p>
          Du texte à une grille claire,
          <br />
          prête à jouer.
        </p>
      </header>
      <section className="toolbar">
        <label>
          Exemple{' '}
          <select
            defaultValue=""
            onChange={(e) =>
              e.target.value && setSource(examples[e.target.value])
            }
          >
            <option value="" disabled>
              Choisir une chanson…
            </option>
            {entries.map(([path]) => (
              <option key={path} value={path}>
                {path.split('/').pop()?.replace('.txt', '')}
              </option>
            ))}
          </select>
        </label>
        <input
          ref={importInputRef}
          className="file-input"
          type="file"
          accept=".txt,text/plain"
          onChange={importText}
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => importInputRef.current?.click()}
        >
          Importer un texte ↑
        </button>
        <span className={errors ? 'status bad' : 'status'}>
          <b>{errors ? 'À corriger' : 'Grille valide'}</b> ·{' '}
          {song.diagnostics.length} diagnostic
          {song.diagnostics.length !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setHelpOpen(true)}
        >
          Aide
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => window.print()}
        >
          Imprimer
        </button>
        <button type="button" onClick={exportSvg}>
          Exporter en SVG ↓
        </button>
        <button type="button" onClick={exportMidi} disabled={errors > 0}>
          Exporter en MIDI ↓
        </button>
        <a
          className="github-link"
          href="https://github.com/jt291/grille-accords-svg"
          target="_blank"
          rel="noreferrer"
          aria-label="Voir les sources sur GitHub"
          title="Voir les sources sur GitHub"
        >
          <img src={githubMark} alt="" />
        </a>
      </section>
      <div
        className="workspace"
        ref={workspaceRef}
        style={
          {
            '--left-pane': `${splitPosition}fr`,
            '--right-pane': `${100 - splitPosition}fr`,
          } as React.CSSProperties
        }
      >
        <section className="source-panel">
          <div className="panel-title">
            <span>DESCRIPTION</span>
            <small>{source.split('\n').length} lignes</small>
          </div>
          <div className="editor">
            <div className="line-numbers" aria-hidden="true">
              <div style={{ transform: `translateY(${-editorScroll}px)` }}>
                {source.split('\n').map((_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
            </div>
            <textarea
              spellCheck={false}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onScroll={(e) => setEditorScroll(e.currentTarget.scrollTop)}
              aria-label="Description textuelle de la grille"
            />
          </div>
          <div className="diagnostics" aria-live="polite">
            {song.diagnostics.length === 0 ? (
              <div className="export-ready">
                <p>✓ Description valide.</p>
                <button type="button" onClick={exportText}>
                  Exporter le texte ↓
                </button>
              </div>
            ) : (
              song.diagnostics.slice(0, 5).map((d, i) => (
                <p key={i} className={d.severity}>
                  <b>Ligne {d.line}</b> — {d.message}
                </p>
              ))
            )}
          </div>
        </section>
        <hr
          className="workspace-splitter"
          aria-label="Redimensionner les panneaux description et aperçu"
          aria-orientation="vertical"
          aria-valuemin={25}
          aria-valuemax={75}
          aria-valuenow={Math.round(splitPosition)}
          tabIndex={0}
          onPointerDown={startWorkspaceResize}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft')
              setSplitPosition((value) => Math.max(25, value - 2))
            if (event.key === 'ArrowRight')
              setSplitPosition((value) => Math.min(75, value + 2))
          }}
        />
        <section className="preview-panel" ref={previewRef}>
          <div className="panel-title">
            <span>APERÇU SVG</span>
            <div className="preview-actions">
              <small>
                {song.sections.length} parties · {song.parts.size} grilles
              </small>
              <fieldset className="transport" aria-label="Commandes de lecture">
                <button
                  type="button"
                  className="play-button"
                  onClick={startPlayback}
                  disabled={playing || errors > 0}
                >
                  ▶ Lecture
                </button>
                <button
                  type="button"
                  className="pause-button"
                  onClick={togglePause}
                  disabled={!playing}
                >
                  {paused ? '▶ Reprendre' : 'Ⅱ Pause'}
                </button>
                <button
                  type="button"
                  className="stop-button"
                  onClick={stopPlayback}
                  disabled={!playing}
                >
                  ■ Stop
                </button>
                <label className="metronome-toggle">
                  <input
                    type="checkbox"
                    checked={metronomeEnabled}
                    disabled={playing}
                    onChange={(event) =>
                      setMetronomeEnabled(event.target.checked)
                    }
                  />
                  Métronome
                </label>
              </fieldset>
              <button
                type="button"
                className="fullscreen-button"
                onClick={togglePreviewFullscreen}
                aria-label={
                  previewFullscreen
                    ? 'Quitter le plein écran'
                    : 'Afficher l’aperçu en plein écran'
                }
              >
                {previewFullscreen ? 'Réduire' : 'Plein écran'}{' '}
                <b aria-hidden="true">{previewFullscreen ? '↙' : '↗'}</b>
              </button>
            </div>
          </div>
          <div className="canvas">
            <ChordChart song={song} activeMeasureId={activeMeasureId} />
          </div>
        </section>
      </div>
      {helpOpen && (
        <div className="drawer-layer">
          <section
            className="help-drawer"
            style={{ width: helpWidth }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <hr
              className="drawer-resizer"
              aria-label="Redimensionner l’aide"
              aria-orientation="vertical"
              aria-valuemin={360}
              aria-valuemax={Math.max(360, window.innerWidth - 24)}
              aria-valuenow={Math.round(helpWidth)}
              tabIndex={0}
              onPointerDown={startHelpResize}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft')
                  setHelpWidth((width) =>
                    Math.min(window.innerWidth - 24, width + 24),
                  )
                if (event.key === 'ArrowRight')
                  setHelpWidth((width) => Math.max(360, width - 24))
              }}
            />
            <div className="help-modal-header">
              <div>
                <span className="eyebrow">DOCUMENTATION</span>
                <h2 id="help-title">Aide Grille Accords</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setHelpOpen(false)}
              >
                Close
              </button>
            </div>
            <iframe
              src="/GrilleAccordsHelp/GrilleAccordsHelp.html"
              title="Aide de Grille Accords"
            />
          </section>
        </div>
      )}
    </main>
  )
}
