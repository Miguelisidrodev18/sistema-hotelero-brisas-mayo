import useScrollReveal from '../../hooks/useScrollReveal'

/**
 * Wrapper that triggers scroll-reveal on enter.
 * @param {{ children, className?, direction?, stagger?, as?, ...rest }}
 */
export default function RevealSection({
  children,
  className = '',
  direction = 'up', // up | left | right | scale
  stagger = false,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useScrollReveal()
  const dirClass = {
    up: '',
    left: 'from-left',
    right: 'from-right',
    scale: 'from-scale',
  }[direction] || ''

  return (
    <Tag
      ref={ref}
      className={`reveal ${dirClass} ${stagger ? 'reveal-stagger' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
