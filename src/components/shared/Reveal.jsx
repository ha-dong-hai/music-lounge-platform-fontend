// src/components/shared/Reveal.jsx

import { useReveal } from '../../hooks/useReveal'

const Reveal = ({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) => {
  const { ref, isVisible } = useReveal()
  return (
    <Tag
      ref={ref}
      className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal