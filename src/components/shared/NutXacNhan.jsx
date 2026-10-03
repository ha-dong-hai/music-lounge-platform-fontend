// src/components/shared/NutXacNhan.jsx
//
// NÚT CÓ HỘP XÁC NHẬN — thay thẳng cho một <button onClick={xuLy}> mà hành động KHÔNG HOÀN TÁC ĐƯỢC hoặc đụng tới tiền.
// Bấm nút chỉ mở HopXacNhan; chỉ khi bấm nút xác nhận trong hộp thì `onXacNhan` mới chạy (WCAG 2.2 SC 3.3.4).
//
// Có từ 30/09/2026 khi rà soát màn vận hành: kết thúc buổi diễn, kết thúc phát trực tuyến, huỷ gia hạn gói, tự vô hiệu
// hoá tài khoản đều chạy NGAY ở lần bấm đầu tiên.
// Mọi thuộc tính khác (className, disabled, aria-*) chuyển nguyên xuống <button> để giao diện nút không đổi.
import { useState } from 'react'
import HopXacNhan from './HopXacNhan'

const NutXacNhan = ({ onXacNhan, tieuDe, noiDung, nhanXacNhan, nhanGiu, nguyHiem = true, children, ...nut }) => {
  const [mo, setMo] = useState(false)
  return (
    <>
      <button type="button" {...nut} onClick={() => setMo(true)}>{children}</button>
      <HopXacNhan mo={mo} tieuDe={tieuDe} nhanXacNhan={nhanXacNhan} nhanGiu={nhanGiu} nguyHiem={nguyHiem}
        onDong={() => setMo(false)} onXacNhan={() => { setMo(false); onXacNhan?.() }}>
        {typeof noiDung === 'string' ? <p>{noiDung}</p> : noiDung}
      </HopXacNhan>
    </>
  )
}

export default NutXacNhan
