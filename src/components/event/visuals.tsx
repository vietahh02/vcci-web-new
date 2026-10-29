import { motion } from 'motion/react'
import { useMemo } from 'react'

/** Decorative QR-like grid (real QR comes from VietQR / badge service in production). */
export function FakeQr({ seed }: { seed: string }) {
  const n = 25
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0
    cells.push(h % 2 === 0)
  }
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="size-full" shapeRendering="crispEdges" aria-label="QR">
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n)
        if (finder(x, y)) return null
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#08082e" /> : null
      })}
      {[[0, 0], [n - 7, 0], [0, n - 7]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x! + 0.5} y={y! + 0.5} width={6} height={6} fill="none" stroke="#08082e" strokeWidth={1} />
          <rect x={x! + 2} y={y! + 2} width={3} height={3} fill="#006699" />
        </g>
      ))}
    </svg>
  )
}

export function Confetti() {
  const colors = ['#006699', '#d4af37', '#00a560', '#e11d48', '#38a8de']
  const pieces = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ i, x: (((i * 37) % 100) / 100 - 0.5) * 420, y: ((i * 53) % 100) * 2.6 - 60, r: (i * 71) % 540, d: 1.4 + ((i * 13) % 10) / 16 })),
    [],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
      {pieces.map((p) => (
        <motion.span
          key={p.i}
          className="absolute left-1/2 top-24 block size-2 rounded-[2px]"
          style={{ background: colors[p.i % colors.length] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.r }}
          transition={{ duration: p.d, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}
