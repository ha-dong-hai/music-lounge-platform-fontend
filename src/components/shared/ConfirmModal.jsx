// src/components/shared/ConfirmModal.jsx
//
// GIỮ NGUYÊN GIAO DIỆN LẬP TRÌNH (isOpen, title, message, confirmText, processingText, danger, isProcessing, onClose,
// onConfirm) cho ~20 chỗ gọi ở màn vận hành, nhưng phần hiển thị nay là HopXacNhan (30/09/2026): <dialog> của trình
// duyệt (giữ focus, Esc đóng, trả focus), focus ban đầu ở nút an toàn, nút xác nhận mang tên hành động.
// Bản cũ là một lớp phủ tự dựng: bấm nền là đóng kể cả đang xử lý dở, không giữ focus, Tab chạy ra trang phía sau,
// và có vạch chuyển sắc + đổ bóng phát sáng của thế giới cũ.
import HopXacNhan from './HopXacNhan'

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  processingText = 'Đang xử lý…',
  danger = true,
  isProcessing = false,
  onClose,
  onConfirm,
}) => (
  <HopXacNhan
    mo={Boolean(isOpen)}
    tieuDe={title}
    nhanXacNhan={isProcessing ? processingText : confirmText}
    nhanGiu="Huỷ"
    dangXuLy={isProcessing}
    nguyHiem={danger}
    onDong={onClose}
    onXacNhan={onConfirm}
  >
    {typeof message === 'string' ? <p>{message}</p> : message}
  </HopXacNhan>
)

export default ConfirmModal
