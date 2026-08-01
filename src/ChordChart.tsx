import type { Measure, Song } from './types'

const W = 920,
  PAD = 46,
  BAR = 202,
  ROW = 48,
  BAR_HEIGHT = 34

const embeddedSvgStyles = `
  .paper{fill:#fffdf7}.title{font:42px Georgia,serif;fill:#172018}.meta{font:700 14px monospace;fill:#b84f2e}
  .title-rule{stroke:#172018;stroke-width:2}.section{font:700 15px Arial,sans-serif;fill:#172018}
  .label{font:italic 14px Georgia,serif;fill:#677269}.section-rule{stroke:#d4d8cf}.bar{stroke:#172018;stroke-width:1.6}
  .guide{stroke:#aeb5ad;stroke-width:.7}.chord{font:600 17px monospace;fill:#172018}.nc{font:14px monospace;fill:#8b928b}
  .beat-dot{font:700 18px Arial,sans-serif;fill:#b8bdb6}.repeat{font:25px Georgia,serif;fill:#b84f2e}
  .meter-bg{fill:#fffdf7}.meter{font:700 13px Arial,sans-serif;fill:#c7442d}.meter-line{stroke:#c7442d;stroke-width:1.4}
  .measure-active{fill:#f4c7a0;opacity:.48}
`

function MeasureGroup({
  measure,
  index,
  y,
  active,
  showMeter,
}: {
  measure: Measure
  index: number
  y: number
  active: boolean
  showMeter: boolean
}) {
  const x = PAD + (index % 4) * BAR
  return (
    <g>
      {active && (
        <rect
          x={x + 2}
          y={y - 4}
          width={BAR - 4}
          height={BAR_HEIGHT + 7}
          rx={4}
          className="measure-active"
        />
      )}
      <line x1={x} y1={y} x2={x} y2={y + BAR_HEIGHT} className="bar" />
      {measure.repeat ? (
        <text x={x + BAR / 2} y={y + 25} textAnchor="middle" className="repeat">
          %
        </text>
      ) : (
        measure.beats.map((beat, n) => {
          const before = measure.beats
            .slice(0, n)
            .reduce((sum, b) => sum + b.duration, 0)
          const bx = x + (before / measure.meter.top) * BAR + 10
          return (
            <g key={n}>
              <text
                x={bx}
                y={y + 24}
                className={beat.chord === 'N.C.' ? 'nc' : 'chord'}
              >
                {beat.chord}
              </text>
              {Array.from(
                { length: Math.max(0, beat.duration - 1) },
                (_, dot) => (
                  <text
                    key={dot}
                    x={x + ((before + dot + 1) / measure.meter.top) * BAR + 10}
                    y={y + 24}
                    className="beat-dot"
                  >
                    ·
                  </text>
                ),
              )}
            </g>
          )
        })
      )}
      <line
        x1={x}
        y1={y + BAR_HEIGHT}
        x2={x + BAR}
        y2={y + BAR_HEIGHT}
        className="guide"
      />
      <line
        x1={x + BAR}
        y1={y}
        x2={x + BAR}
        y2={y + BAR_HEIGHT}
        className="bar"
      />
      {showMeter && (
        <TimeSignature meter={measure.meter} x={x - 16} y={y + 2} />
      )}
    </g>
  )
}

function TimeSignature({
  meter,
  x,
  y,
}: {
  meter: Measure['meter']
  x: number
  y: number
}) {
  const [top, bottom] = meter.label.split('/')
  return (
    <g aria-label={meter.label}>
      <rect
        x={x - 10}
        y={y - 4}
        width={22}
        height={34}
        rx={3}
        className="meter-bg"
      />
      <text x={x + 1} y={y + 10} textAnchor="middle" className="meter">
        {top}
      </text>
      <line
        x1={x - 6}
        y1={y + 13}
        x2={x + 8}
        y2={y + 13}
        className="meter-line"
      />
      <text x={x + 1} y={y + 27} textAnchor="middle" className="meter">
        {bottom}
      </text>
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
  let cursor = 102
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
          y2={cursor + 8}
          className="section-rule"
        />
      </g>,
    )
    cursor += 20
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
                  showMeter={
                    j === 0 || m.meter.label !== row[j - 1]?.meter.label
                  }
                />
              ))}
            </g>,
          )
          cursor += ROW
        }
      })
    cursor += 7
  })
  const height = Math.max(300, cursor + 18)
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
        {song.tempo ?? ''}
      </text>
      <line x1={PAD} y1={76} x2={W - PAD} y2={76} className="title-rule" />
      {content}
    </svg>
  )
}
