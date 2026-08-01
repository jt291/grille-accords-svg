import { Icon, type IconifyIcon } from '@iconify/react'
import contentSaveEditOutline from '@iconify-icons/mdi/content-save-edit-outline'
import fileDownloadOutline from '@iconify-icons/mdi/file-download-outline'
import fileUploadOutline from '@iconify-icons/mdi/file-upload-outline'
import fullscreen from '@iconify-icons/mdi/fullscreen'
import fullscreenExit from '@iconify-icons/mdi/fullscreen-exit'
import github from '@iconify-icons/mdi/github'
import helpCircleOutline from '@iconify-icons/mdi/help-circle-outline'
import metronome from '@iconify-icons/mdi/metronome'
import pause from '@iconify-icons/mdi/pause'
import play from '@iconify-icons/mdi/play'
import printer from '@iconify-icons/mdi/printer'
import stop from '@iconify-icons/mdi/stop'
import themeLightDark from '@iconify-icons/mdi/theme-light-dark'
import undo from '@iconify-icons/mdi/undo'
import { useEffect, useMemo, useRef, useState } from 'react'
import logoGa from './assets/logo-ga.svg'
import { createMidiFile, type PlaybackController, playSong } from './audio'
import { ChordChart } from './ChordChart'
import { parseSong } from './parser'
import {
  type Accidental,
  transposeSong,
  transposeSource,
} from './transposition'

const examples = import.meta.glob('../Chansons/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>
const entries = Object.entries(examples).sort(([a], [b]) =>
  a.localeCompare(b, 'fr'),
)
const initial =
  entries.find(([path]) => path.endsWith('/Blackbird.txt'))?.[1] ??
  `Ma chanson\n\nStructure:\n4/4 n=120\nCouplet : premier couplet\n\nCouplet:\n4: C Am F G`

type Language = 'ar' | 'br' | 'en' | 'fr' | 'hi' | 'ku' | 'zh'
const languages: { code: Language; flag: string; name: string }[] = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'br', flag: '🏴', name: 'Brezhoneg' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
  { code: 'ku', flag: '☀️', name: 'Kurdî' },
]
const supported = new Set(languages.map(({ code }) => code))
const systemLanguage = (): Language => {
  const code = navigator.language.split('-')[0] as Language
  return supported.has(code) ? code : 'en'
}

function IconButton({
  icon,
  label,
  ...props
}: {
  icon: IconifyIcon
  label: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon icon={icon} />
    </button>
  )
}

const slug = (title: string) =>
  title
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'grille'

export default function App() {
  const [source, setSource] = useState(initial)
  const [selectedExample, setSelectedExample] = useState('')
  const [editorScroll, setEditorScroll] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpWidth, setHelpWidth] = useState(720)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [splitPosition, setSplitPosition] = useState(42)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [activeMeasureId, setActiveMeasureId] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>(systemLanguage)
  const [dark, setDark] = useState(
    () => matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [transposeSteps, setTransposeSteps] = useState(0)
  const [accidental, setAccidental] = useState<Accidental>('sharp')
  const [gridOnly, setGridOnly] = useState(true)
  const [sourceBeforeTranspose, setSourceBeforeTranspose] = useState<
    string | null
  >(null)
  const previewRef = useRef<HTMLElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const playbackRef = useRef<PlaybackController | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const song = useMemo(() => parseSong(source), [source])
  const renderedSong = useMemo(
    () => transposeSong(song, transposeSteps, accidental),
    [song, transposeSteps, accidental],
  )
  const errors = song.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error',
  ).length
  const lineCount = source.split('\n').length

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  useEffect(() => {
    document.body.classList.toggle('modal-open', helpOpen)
    return () => document.body.classList.remove('modal-open')
  }, [helpOpen])
  useEffect(() => {
    const update = () =>
      setPreviewFullscreen(document.fullscreenElement === previewRef.current)
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  useEffect(() => () => playbackRef.current?.stop(), [])

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
    playbackRef.current = await playSong(
      renderedSong,
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
    if (!playbackRef.current) return
    if (paused) await playbackRef.current.resume()
    else await playbackRef.current.pause()
    setPaused(!paused)
  }
  const download = (data: BlobPart, type: string, extension: string) => {
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(new Blob([data], { type }))
    anchor.download = `${slug(song.title)}.${extension}`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  }
  const exportSvg = () => {
    const svg = document.getElementById('chord-chart')
    if (svg)
      download(
        new XMLSerializer().serializeToString(svg),
        'image/svg+xml',
        'svg',
      )
  }
  const exportMidi = () => {
    const data = createMidiFile(renderedSong)
    const buffer = new ArrayBuffer(data.byteLength)
    new Uint8Array(buffer).set(data)
    download(buffer, 'audio/midi', 'mid')
  }
  const importText = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    stopPlayback()
    setSource(await file.text())
    setSelectedExample('')
    setTransposeSteps(0)
    event.target.value = ''
  }
  const applyTranspose = () => {
    if (!transposeSteps) return
    setSourceBeforeTranspose(source)
    setSource(transposeSource(source, transposeSteps, accidental))
    setTransposeSteps(0)
  }
  const startHelpResize = (event: React.PointerEvent<HTMLHRElement>) => {
    event.preventDefault()
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
    const stopResize = () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', stopResize)
    }
    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stopResize)
  }
  const startWorkspaceResize = (event: React.PointerEvent<HTMLHRElement>) => {
    event.preventDefault()
    const resize = (moveEvent: PointerEvent) => {
      const bounds = workspaceRef.current?.getBoundingClientRect()
      if (bounds)
        setSplitPosition(
          Math.max(
            25,
            Math.min(
              75,
              ((moveEvent.clientX - bounds.left) / bounds.width) * 100,
            ),
          ),
        )
    }
    const stopResize = () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', stopResize)
    }
    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stopResize)
  }

  return (
    <main>
      <nav className="main-toolbar" aria-label="Commandes principales">
        <div className="toolbar-start">
          <img className="app-logo" src={logoGa} alt="Grille Accords" />
          <select
            className="example-select"
            value={selectedExample}
            aria-label="Choisir un exemple"
            onChange={(event) => {
              const path = event.target.value
              setSelectedExample(path)
              if (path) {
                stopPlayback()
                setSource(examples[path])
                setTransposeSteps(0)
              }
            }}
          >
            <option value="">Choisir un exemple…</option>
            {entries.map(([path]) => (
              <option key={path} value={path}>
                {path.split('/').pop()?.replace('.txt', '')}
              </option>
            ))}
          </select>
        </div>
        <div className="song-summary">
          <strong>{song.title}</strong>
          <span className={errors ? 'status bad' : 'status'}>
            {errors ? 'À corriger' : 'Grille valide'} :{' '}
            {song.diagnostics.length} diagnostic
            {song.diagnostics.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="toolbar-end">
          <select
            className="language-select"
            value={language}
            aria-label="Langue"
            title="Langue"
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            {languages.map(({ code, flag, name }) => (
              <option key={code} value={code} title={name}>
                {flag}
              </option>
            ))}
          </select>
          <IconButton
            icon={themeLightDark}
            label={dark ? 'Mode clair' : 'Mode sombre'}
            onClick={() => setDark((value) => !value)}
          />
          <a
            className="icon-link"
            href="https://github.com/jt291/grille-accords-svg"
            target="_blank"
            rel="noreferrer"
            aria-label="Sources GitHub"
            title="Sources GitHub"
          >
            <Icon icon={github} />
          </a>
        </div>
      </nav>

      <input
        ref={importInputRef}
        className="file-input"
        type="file"
        accept=".txt,text/plain"
        onChange={importText}
      />
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
          <div className="panel-toolbar">
            <strong>Description</strong>
            <div className="panel-actions">
              <IconButton
                icon={helpCircleOutline}
                label="Aide"
                onClick={() => setHelpOpen(true)}
              />
              <IconButton
                icon={printer}
                label="Imprimer"
                onClick={() => window.print()}
              />
              <IconButton
                icon={fileUploadOutline}
                label="Importer un texte"
                onClick={() => importInputRef.current?.click()}
              />
              <IconButton
                icon={fileDownloadOutline}
                label="Exporter le texte"
                onClick={() =>
                  download(source, 'text/plain;charset=utf-8', 'txt')
                }
              />
              <small>
                {lineCount} ligne{lineCount !== 1 ? 's' : ''}
              </small>
            </div>
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
              onChange={(event) => {
                setSource(event.target.value)
                setSelectedExample('')
              }}
              onScroll={(event) =>
                setEditorScroll(event.currentTarget.scrollTop)
              }
              aria-label="Description textuelle de la grille"
            />
          </div>
          <div className="diagnostics" aria-live="polite">
            {song.diagnostics.length === 0 ? (
              <p>✓ Description valide.</p>
            ) : (
              song.diagnostics.slice(0, 5).map((diagnostic, index) => (
                <p
                  key={`${diagnostic.line}-${index}`}
                  className={diagnostic.severity}
                >
                  <b>Ligne {diagnostic.line}</b> — {diagnostic.message}
                </p>
              ))
            )}
          </div>
        </section>

        <hr
          className="workspace-splitter"
          aria-label="Redimensionner les panneaux"
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
          <div className="panel-toolbar">
            <strong>SVG</strong>
            <div className="panel-actions">
              <small>
                {renderedSong.sections.length} parties ·{' '}
                {renderedSong.parts.size} grilles
              </small>
              <select
                className="export-select"
                value=""
                aria-label="Exporter"
                disabled={errors > 0}
                onChange={(event) => {
                  if (event.target.value === 'svg') exportSvg()
                  if (event.target.value === 'midi') exportMidi()
                }}
              >
                <option value="">Exporter…</option>
                <option value="svg">SVG</option>
                <option value="midi">MIDI</option>
              </select>
              <IconButton
                icon={previewFullscreen ? fullscreenExit : fullscreen}
                label={
                  previewFullscreen ? 'Quitter le plein écran' : 'Plein écran'
                }
                onClick={async () =>
                  document.fullscreenElement
                    ? document.exitFullscreen()
                    : previewRef.current?.requestFullscreen()
                }
              />
            </div>
          </div>
          <div className="secondary-toolbar">
            <fieldset className="transpose-controls">
              <legend className="sr-only">Transposition</legend>
              <span>Transposition</span>
              <button
                type="button"
                className="step-button"
                aria-label="Descendre d’un demi-ton"
                onClick={() =>
                  setTransposeSteps((value) => Math.max(-11, value - 1))
                }
              >
                −
              </button>
              <output aria-label="Demi-tons">
                {transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps}
              </output>
              <button
                type="button"
                className="step-button"
                aria-label="Monter d’un demi-ton"
                onClick={() =>
                  setTransposeSteps((value) => Math.min(11, value + 1))
                }
              >
                +
              </button>
              <select
                value={accidental}
                aria-label="Altérations"
                onChange={(event) =>
                  setAccidental(event.target.value as Accidental)
                }
              >
                <option value="sharp">♯</option>
                <option value="flat">♭</option>
              </select>
              <label className="compact-check">
                <input
                  type="checkbox"
                  checked={gridOnly}
                  onChange={(event) => setGridOnly(event.target.checked)}
                />{' '}
                Grille seule
              </label>
              {!gridOnly && (
                <IconButton
                  icon={contentSaveEditOutline}
                  label="Appliquer au texte"
                  disabled={!transposeSteps}
                  onClick={applyTranspose}
                />
              )}
              {sourceBeforeTranspose && (
                <IconButton
                  icon={undo}
                  label="Annuler la transposition du texte"
                  onClick={() => {
                    setSource(sourceBeforeTranspose)
                    setSourceBeforeTranspose(null)
                  }}
                />
              )}
            </fieldset>
            <fieldset className="transport" aria-label="Commandes de lecture">
              <IconButton
                icon={play}
                label={paused ? 'Reprendre' : 'Lecture'}
                onClick={paused ? togglePause : startPlayback}
                disabled={(playing && !paused) || errors > 0}
              />
              <IconButton
                icon={pause}
                label="Pause"
                onClick={togglePause}
                disabled={!playing || paused}
              />
              <IconButton
                icon={stop}
                label="Stop"
                onClick={stopPlayback}
                disabled={!playing}
              />
              <IconButton
                icon={metronome}
                label="Métronome"
                className={`icon-button${metronomeEnabled ? ' active' : ''}`}
                aria-pressed={metronomeEnabled}
                disabled={playing}
                onClick={() => setMetronomeEnabled((value) => !value)}
              />
            </fieldset>
          </div>
          <div className="canvas">
            <ChordChart song={renderedSong} activeMeasureId={activeMeasureId} />
          </div>
        </section>
      </div>
      <footer className="site-footer">
        Réalisé avec ChatGPT 5.6 Sol… en 2 h 30 !
      </footer>

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
              <h2 id="help-title">Aide — langage</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setHelpOpen(false)}
              >
                Close
              </button>
            </div>
            <iframe
              src="/GrilleAccordsHelp/GA_Langage.html"
              title="Langage de description de Grille Accords"
            />
          </section>
        </div>
      )}
    </main>
  )
}
