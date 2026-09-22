// src/components/shared/Reveal.jsx
// Bọc quanh một khối để nó "hiện dần" khi cuộn tới — xem src/hooks/useReveal.js.
// `delay` tính bằng ms, dùng cho hiệu ứng stagger (mỗi thẻ trễ hơn thẻ trước một chút) — tối đa nên
// dùng cho một nhóm nhỏ (3-4 phần tử liền kề), không rải khắp trang.
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
