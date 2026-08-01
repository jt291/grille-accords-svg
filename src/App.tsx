import { Icon, type IconifyIcon } from '@iconify/react'
import close from '@iconify-icons/mdi/close'
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
import { defaultLanguage, type Language, languages, messages } from './i18n'
import { createMusicXml } from './musicxml'
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

function locateDiagnostic(source: string, line: number, message: string) {
  const text = source.split('\n')[line - 1] ?? ''
  const tokens = [...text.matchAll(/\S+/g)]
  const quoted = message.match(/«\s*(.*?)\s*»/)?.[1]
  let tokenIndex = quoted
    ? tokens.findIndex((token) => token[0] === quoted)
    : tokens.length - 1
  if (tokenIndex < 0) tokenIndex = Math.max(0, tokens.length - 1)
  const symbol = tokens[tokenIndex]?.[0] ?? quoted ?? ''
  const marked = tokens
    .map((token, index) =>
      index === tokenIndex ? `▶ ${token[0]} ◀` : token[0],
    )
    .join(' ')
  return { marked: marked || text, position: tokenIndex + 1, symbol }
}

export default function App() {
  const [source, setSource] = useState(initial)
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
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
  const [language, setLanguage] = useState<Language>(defaultLanguage)
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
  const t = messages[language]
  const errorDiagnostics = song.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error',
  )
  const errorLines = new Set(errorDiagnostics.map(({ line }) => line))

  const updateCursor = (editor: HTMLTextAreaElement) => {
    const before = editor.value.slice(0, editor.selectionStart)
    const rows = before.split('\n')
    setCursor({ line: rows.length, column: (rows.at(-1)?.length ?? 0) + 1 })
  }

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
  const exportRaster = async (format: 'png' | 'webp') => {
    const svg = document.getElementById('chord-chart') as SVGSVGElement | null
    if (!svg) return
    const viewBox = svg.viewBox.baseVal
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = viewBox.width * scale
    canvas.height = viewBox.height * scale
    const context = canvas.getContext('2d')
    if (!context) return
    const source = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml',
    })
    const url = URL.createObjectURL(source)
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Impossible de convertir le SVG.'))
      image.src = url
    })
    context.fillStyle = '#fffdf7'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, `image/${format}`, 0.92),
    )
    if (blob) download(blob, blob.type, format)
  }
  const exportMidi = () => {
    const data = createMidiFile(renderedSong)
    const buffer = new ArrayBuffer(data.byteLength)
    new Uint8Array(buffer).set(data)
    download(buffer, 'audio/midi', 'mid')
  }
  const exportMusicXml = () =>
    download(
      createMusicXml(renderedSong),
      'application/vnd.recordare.musicxml+xml;charset=utf-8',
      'musicxml',
    )
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
      <nav className="main-toolbar" aria-label={t.mainCommands}>
        <div className="toolbar-start">
          <img className="app-logo" src={logoGa} alt="Grille Accords" />
          <select
            className="example-select"
            value={selectedExample}
            aria-label={t.chooseExample}
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
            <option value="">{t.chooseExample}</option>
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
            {errors ? t.invalid : t.valid} : {song.diagnostics.length}{' '}
            {song.diagnostics.length === 1 ? t.diagnostic : t.diagnostics}
          </span>
        </div>
        <div className="toolbar-end">
          <select
            className="language-select"
            value={language}
            aria-label={t.language}
            title={t.language}
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
            label={dark ? t.lightMode : t.darkMode}
            onClick={() => setDark((value) => !value)}
          />
          <a
            className="icon-link"
            href="https://github.com/jt291/grille-accords-svg"
            target="_blank"
            rel="noreferrer"
            aria-label={t.github}
            title={t.github}
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
            <strong>{t.description}</strong>
            <div className="panel-actions">
              <IconButton
                icon={helpCircleOutline}
                label={t.help}
                onClick={() => setHelpOpen(true)}
              />
              <IconButton
                icon={printer}
                label={t.print}
                onClick={() => window.print()}
              />
              <IconButton
                icon={fileUploadOutline}
                label={t.importText}
                onClick={() => importInputRef.current?.click()}
              />
              <IconButton
                icon={fileDownloadOutline}
                label={t.exportText}
                onClick={() =>
                  download(source, 'text/plain;charset=utf-8', 'txt')
                }
              />
              <small>
                {lineCount} {lineCount === 1 ? t.line : t.lines} · {t.lineShort}{' '}
                {cursor.line} · {t.columnShort} {cursor.column}
              </small>
            </div>
          </div>
          <div className="editor">
            <div className="line-numbers" aria-hidden="true">
              <div style={{ transform: `translateY(${-editorScroll}px)` }}>
                {source.split('\n').map((_, index) => (
                  <span
                    key={index}
                    className={[
                      errorLines.has(index + 1) ? 'line-error' : '',
                      cursor.line === index + 1 ? 'line-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="active-line-highlight"
              style={{
                transform: `translateY(${22 + (cursor.line - 1) * 24 - editorScroll}px)`,
              }}
              aria-hidden="true"
            />
            <textarea
              spellCheck={false}
              value={source}
              onChange={(event) => {
                setSource(event.target.value)
                setSelectedExample('')
                updateCursor(event.currentTarget)
              }}
              onScroll={(event) =>
                setEditorScroll(event.currentTarget.scrollTop)
              }
              onSelect={(event) => updateCursor(event.currentTarget)}
              onClick={(event) => updateCursor(event.currentTarget)}
              onKeyUp={(event) => updateCursor(event.currentTarget)}
              aria-label={t.editorLabel}
            />
          </div>
          <div className="diagnostics" aria-live="polite">
            {song.diagnostics.length === 0 ? (
              <p>✓ {t.validDescription}</p>
            ) : (
              song.diagnostics.slice(0, 5).map((diagnostic, index) => (
                <p
                  key={`${diagnostic.line}-${index}`}
                  className={diagnostic.severity}
                >
                  <b>
                    {t.lineLabel} {diagnostic.line}
                  </b>{' '}
                  — {diagnostic.message}
                </p>
              ))
            )}
          </div>
        </section>

        <hr
          className="workspace-splitter"
          aria-label={t.resizePanels}
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
                {renderedSong.sections.length} {t.parts} ·{' '}
                {renderedSong.parts.size} {t.grids}
              </small>
              <select
                className="export-select"
                value=""
                aria-label={t.export}
                disabled={errors > 0}
                onChange={(event) => {
                  if (event.target.value === 'svg') exportSvg()
                  if (event.target.value === 'png') void exportRaster('png')
                  if (event.target.value === 'webp') void exportRaster('webp')
                  if (event.target.value === 'midi') exportMidi()
                  if (event.target.value === 'musicxml') exportMusicXml()
                }}
              >
                <option value="">{t.export}</option>
                <option value="svg">SVG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option disabled>──────────</option>
                <option value="midi">MIDI</option>
                <option value="musicxml">MusicXML</option>
              </select>
              <IconButton
                icon={previewFullscreen ? fullscreenExit : fullscreen}
                label={previewFullscreen ? t.exitFullscreen : t.fullscreen}
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
              <legend className="sr-only">{t.transposition}</legend>
              <span>{t.transposition}</span>
              <button
                type="button"
                className="step-button"
                aria-label={t.downSemitone}
                onClick={() =>
                  setTransposeSteps((value) => Math.max(-11, value - 1))
                }
              >
                −
              </button>
              <output aria-label={t.semitones}>
                {transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps}
              </output>
              <button
                type="button"
                className="step-button"
                aria-label={t.upSemitone}
                onClick={() =>
                  setTransposeSteps((value) => Math.min(11, value + 1))
                }
              >
                +
              </button>
              <select
                value={accidental}
                aria-label={t.accidentals}
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
                {t.gridOnly}
              </label>
              {!gridOnly && (
                <IconButton
                  icon={contentSaveEditOutline}
                  label={t.applyText}
                  disabled={!transposeSteps}
                  onClick={applyTranspose}
                />
              )}
              {sourceBeforeTranspose && (
                <IconButton
                  icon={undo}
                  label={t.undoTranspose}
                  onClick={() => {
                    setSource(sourceBeforeTranspose)
                    setSourceBeforeTranspose(null)
                  }}
                />
              )}
            </fieldset>
            <fieldset className="transport" aria-label={t.transport}>
              <IconButton
                icon={play}
                label={paused ? t.resume : t.play}
                onClick={paused ? togglePause : startPlayback}
                disabled={(playing && !paused) || errors > 0}
              />
              <IconButton
                icon={pause}
                label={t.pause}
                onClick={togglePause}
                disabled={!playing || paused}
              />
              <IconButton
                icon={stop}
                label={t.stop}
                onClick={stopPlayback}
                disabled={!playing}
              />
              <IconButton
                icon={metronome}
                label={t.metronome}
                className={`icon-button${metronomeEnabled ? ' active' : ''}`}
                aria-pressed={metronomeEnabled}
                disabled={playing}
                onClick={() => setMetronomeEnabled((value) => !value)}
              />
            </fieldset>
          </div>
          <div className={`canvas${errors ? ' canvas-error' : ''}`} dir="ltr">
            {errors ? (
              <div className="render-errors" role="alert">
                <h2>{t.invalid}</h2>
                <p>
                  {errorDiagnostics.length}{' '}
                  {errorDiagnostics.length === 1 ? t.diagnostic : t.diagnostics}
                </p>
                {errorDiagnostics.map((diagnostic, index) => {
                  const detail = locateDiagnostic(
                    source,
                    diagnostic.line,
                    diagnostic.message,
                  )
                  return (
                    <article key={`${diagnostic.line}-${index}`}>
                      <h3>
                        {t.lineLabel} {diagnostic.line} · #{detail.position}
                        {detail.symbol ? ` · « ${detail.symbol} »` : ''}
                      </h3>
                      <p>{diagnostic.message}</p>
                      <pre>
                        <code>{detail.marked}</code>
                      </pre>
                    </article>
                  )
                })}
              </div>
            ) : (
              <ChordChart
                song={renderedSong}
                activeMeasureId={activeMeasureId}
              />
            )}
          </div>
        </section>
      </div>
      <footer className="site-footer">{t.footer}</footer>

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
              aria-label={t.resizeHelp}
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
              <h2 id="help-title">{t.helpTitle}</h2>
              <IconButton
                icon={close}
                label={t.closeHelp}
                onClick={() => setHelpOpen(false)}
              />
            </div>
            <iframe
              src={`/GrilleAccordsHelp/GA_Langage.html?lang=${language}`}
              title={t.helpFrame}
            />
          </section>
        </div>
      )}
    </main>
  )
}
