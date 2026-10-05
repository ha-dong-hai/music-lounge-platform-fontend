// src/lib/thoiGianThuc.js — MLACP-669: nghe "dữ liệu của bạn vừa đổi" từ backend (/hubs/notifications).
//
// VÌ SAO: trước đây web không có kênh nào như vậy. Admin từ chối tài khoản nhận tiền thì màn của chủ phòng trà vẫn hiện
// "Chờ Admin duyệt" tới khi bấm F5; chuông thông báo chỉ đếm một lần lúc mở trang; số việc chờ trên menu Admin 60 giây
// mới hỏi lại một lần.
//
// CÁCH CHẠY: một kết nối cho cả ứng dụng (KetNoiThoiGianThuc trong App.jsx). Sự kiện KHÔNG mang dữ liệu — chỉ chủ đề +
// loại tham chiếu — nên nhận xong thì:
//   1. làm mới mọi truy vấn TanStack Query đang hiển thị (danh sách Admin, số việc chờ…);
//   2. phát window event SU_KIEN để trang tự tải bằng useEffect (chưa dùng TanStack) tải lại — qua useTaiLaiKhiDoi.
// Backend chỉ phát SAU KHI commit, nên tải lại ngay là đọc được dữ liệu mới.
//
// Ba kênh backend gửi: 'notification' (cho chính mình), 'queue-changed' (cho Admin), 'lounge-changed' (cho chủ/nhân viên
// của phòng trà — MLACP-670). Mất kết nối rồi nối lại thì làm mới tất cả, vì có thể đã lỡ sự kiện.
import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import axiosClient from '../config/axios'
import { useAuthStore } from '../store/useAuthStore'
import { queryClient } from './queryClient'

const HUB_URL = new URL('/hubs/notifications', axiosClient.defaults.baseURL).href
export const SU_KIEN = 'ml:thoi-gian-thuc'

const phat = (detail) => window.dispatchEvent(new CustomEvent(SU_KIEN, { detail }))
const lamMoiDangHien = () => queryClient.invalidateQueries({ refetchType: 'active' })

let ketNoi = null

const dung = async () => {
  const c = ketNoi
  ketNoi = null
  if (c) { try { await c.stop() } catch { /* đang đóng sẵn */ } }
}

const batDau = async () => {
  await dung()
  const c = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => useAuthStore.getState().token || '' })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()
  for (const kenh of ['notification', 'queue-changed', 'lounge-changed']) {
    c.on(kenh, (p) => { lamMoiDangHien(); phat({ kenh, ...p }) })
  }
  c.onreconnected(() => { lamMoiDangHien(); phat({ kenh: 'reconnected' }) })
  ketNoi = c
  try { await c.start() } catch { /* mạng/máy chủ chưa sẵn — trang vẫn chạy, chỉ không tự cập nhật */ }
}

// Gắn MỘT lần ở gốc ứng dụng. Đổi người đăng nhập (hoặc đăng xuất) thì nối lại theo người mới — nhóm nhận sự kiện do
// máy chủ gán theo JWT lúc nối.
export const KetNoiThoiGianThuc = () => {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  useEffect(() => {
    if (!userId) { dung(); return undefined }
    batDau()
    return () => { dung() }
  }, [userId])
  return null
}

// Trang tự tải bằng useEffect gọi hook này để tải lại khi có thay đổi liên quan.
//   loai: danh sách referenceType (vd ['bank_account']) hoặc topic hàng chờ Admin (vd 'bank-accounts');
//         bỏ trống = mọi sự kiện. Gom các sự kiện dồn dập trong 300 ms thành MỘT lần tải.
export const useTaiLaiKhiDoi = (taiLai, loai) => {
  const hamRef = useRef(taiLai)
  useEffect(() => { hamRef.current = taiLai }, [taiLai])
  const khoa = (loai ?? []).join(',')
  useEffect(() => {
    const ds = khoa ? khoa.split(',') : null
    let hen = null
    const nghe = (e) => {
      const d = e.detail || {}
      const lienQuan = d.kenh === 'reconnected' || !ds || ds.includes(d.referenceType) || ds.includes(d.topic)
      if (!lienQuan) return
      clearTimeout(hen)
      hen = setTimeout(() => hamRef.current?.(), 300)
    }
    window.addEventListener(SU_KIEN, nghe)
    return () => { clearTimeout(hen); window.removeEventListener(SU_KIEN, nghe) }
  }, [khoa])
}
