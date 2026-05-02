import { useMemo } from 'react'

/**
 * Generates decorative floating particles for backgrounds.
 * Pure CSS animations — no JS animation loop.
 */
export default function FloatingParticles({ count = 20, color = 'rgba(245,146,46,0.15)' }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 3 + Math.random() * 5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 8 + Math.random() * 15,
      delay: Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.35,
    })),
  [count])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: color,
            opacity: p.opacity,
            animation: `drift ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
