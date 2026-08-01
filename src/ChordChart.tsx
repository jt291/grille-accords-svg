import type { Measure, Song } from './types'

const W = 920,
  PAD = 46,
  BAR = 202,
  ROW = 82

const embeddedSvgStyles = `
  .paper{fill:#fffdf7}.title{font:42px Georgia,serif;fill:#172018}.meta{font:12px monospace;fill:#b84f2e}
  .title-rule{stroke:#172018;stroke-width:2}.section{font:600 16px Arial,sans-serif;fill:#172018}
  .label{font:italic 15px Georgia,serif;fill:#677269}.section-rule{stroke:#d4d8cf}.bar{stroke:#172018;stroke-width:1.6}
  .guide{stroke:#aeb5ad;stroke-width:.7}.chord{font:500 19px monospace;fill:#172018}.nc{font:14px monospace;fill:#8b928b}
  .repeat{font:26px Georgia,serif;fill:#b84f2e}.meter{font:9px monospace;fill:#909890}
  .measure-active{fill:#f4c7a0;opacity:.48}
`

function MeasureGroup({
  measure,
  index,
  y,
  active,
}: {
  measure: Measure
  index: number
  y: number
  active: boolean
}) {
  const x = PAD + (index % 4) * BAR
  return (
    <g>
      {active && (
        <rect
          x={x + 2}
          y={y - 4}
          width={BAR - 4}
          height={55}
          rx={4}
          className="measure-active"
        />
      )}
      <line x1={x} y1={y} x2={x} y2={y + 48} className="bar" />
      {measure.repeat ? (
        <text x={x + BAR / 2} y={y + 33} textAnchor="middle" className="repeat">
          %
        </text>
      ) : (
        measure.beats.map((beat, n) => {
          const before = measure.beats
            .slice(0, n)
            .reduce((sum, b) => sum + b.duration, 0)
          const bx = x + (before / measure.meter.top) * BAR + 10
          return (
            <text
              key={n}
              x={bx}
              y={y + 31}
              className={beat.chord === 'N.C.' ? 'nc' : 'chord'}
            >
              {beat.chord}
            </text>
          )
        })
      )}
      <line x1={x} y1={y + 48} x2={x + BAR} y2={y + 48} className="guide" />
      <line x1={x + BAR} y1={y} x2={x + BAR} y2={y + 48} className="bar" />
      {index === 0 && (
        <text x={x - 8} y={y + 12} textAnchor="end" className="meter">
          {measure.meter.label}
        </text>
      )}
    </g>
  )
}

export function ChordChart({
  song,
  activeMeasureId,
}: {
  song: Song
  activeMeasureId?: string | null
}) {
  let cursor = 112
  const content: React.ReactNode[] = []
  const sections = song.sections.length
    ? song.sections
    : [...song.parts.keys()].map((part) => ({
        part,
        label: '',
        collapsed: false,
      }))
  sections.forEach((section, sectionIndex) => {
    const part = song.parts.get(section.part)
    content.push(
      <g key={`h-${sectionIndex}`}>
        <text x={PAD} y={cursor} className="section">
          {section.part}
        </text>
        <text x={PAD + 142} y={cursor} className="label">
          {section.label}
        </text>
        <line
          x1={PAD}
          y1={cursor + 11}
          x2={W - PAD}
          y2={cursor + 11}
          className="section-rule"
        />
      </g>,
    )
    cursor += 28
    if (!section.collapsed && part)
      part.lines.forEach((line, lineIndex) => {
        for (let offset = 0; offset < line.measures.length; offset += 4) {
          const row = line.measures.slice(offset, offset + 4)
          content.push(
            <g key={`m-${sectionIndex}-${lineIndex}-${offset}`}>
              {row.map((m, j) => (
                <MeasureGroup
                  key={j}
                  measure={m}
                  index={j}
                  y={cursor}
                  active={
                    activeMeasureId ===
                    `${sectionIndex}:${lineIndex}:${offset + j}`
                  }
                />
              ))}
            </g>,
          )
          cursor += ROW
        }
      })
    cursor += 12
  })
  const height = Math.max(300, cursor + 30)
  return (
    <svg
      id="chord-chart"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${height}`}
      direction="ltr"
      lang="fr"
      role="img"
      aria-label={`Grille d’accords de ${song.title}`}
    >
      <style>{embeddedSvgStyles}</style>
      <rect width={W} height={height} className="paper" />
      <text x={PAD} y={55} className="title">
        {song.title}
      </text>
      <text x={W - PAD} y={52} textAnchor="end" className="meta">
        {song.meter.label}
        {song.tempo ? ` · ${song.tempo}` : ''}
      </text>
      <line x1={PAD} y1={76} x2={W - PAD} y2={76} className="title-rule" />
      {content}
    </svg>
  )
}
