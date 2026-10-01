// src/hooks/useLivestreamHub.js
// Kết nối SignalR thật tới LivestreamHub (backend: src/MusicLounge.Infrastructure/Hubs/LivestreamHub.cs,
// broadcast qua LivestreamHubService.cs) — tên sự kiện lấy đúng từ code backend, không đoán.
import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '../store/useAuthStore'
import axiosClient from '../config/axios'

// Lấy cùng máy chủ với axios (một nguồn: VITE_API_BASE_URL, mặc định Azure) — '/hubs/...' là đường dẫn
// tuyệt đối nên thay hẳn phần '/api/v1'. Bản trước ghi cứng địa chỉ Azure, nên chạy web ở máy trỏ
// backend máy thì livestream vẫn nối production (đo 30/09).
const HUB_BASE_URL = new URL('/hubs/livestream', axiosClient.defaults.baseURL).href

export const useLivestreamHub = (livestreamId, handlers = {}) => {
  const [connectionState, setConnectionState] = useState('idle')
  const connectionRef = useRef(null)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!livestreamId) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_BASE_URL}?livestreamId=${livestreamId}`, {
        accessTokenFactory: () => useAuthStore.getState().token || '',
      })
      .withAutomaticReconnect()
      .build()

    connection.on('ReceiveMessage', (msg) => handlersRef.current.onReceiveMessage?.(msg))
    // Admin xử lý báo cáo một tin chat → backend ẩn tin và phát sự kiện này (LivestreamHubService.cs:37). Trước 01/10/2026
    // web không nghe nên tin đã bị ẩn vẫn nằm trên màn người đang xem.
    connection.on('ChatMessageHidden', (payload) => handlersRef.current.onChatMessageHidden?.(payload))
    connection.on('ReceiveReaction', (payload) => handlersRef.current.onReceiveReaction?.(payload))
    connection.on('DonationAlert', (donation) => handlersRef.current.onDonationAlert?.(donation))
    connection.on('DonationMessageHidden', (payload) => handlersRef.current.onDonationMessageHidden?.(payload))
    connection.on('ViewerCountUpdated', (payload) => handlersRef.current.onViewerCountUpdated?.(payload))
    connection.on('LivestreamTerminated', (payload) => handlersRef.current.onTerminated?.(payload))
    // Chủ phòng trà bấm Kết thúc hoặc Mux báo luồng ngừng (MLACP-508, PR #369 — CHƯA deploy; backend đang chạy không phát,
    // nghe trước vô hại). Payload {}.
    connection.on('LivestreamEnded', () => handlersRef.current.onEnded?.())
    connection.on('LivestreamReconnecting', () => handlersRef.current.onReconnecting?.())
    connection.on('LivestreamReconnected', () => handlersRef.current.onReconnected?.())
    connection.on('LivestreamFailed', () => handlersRef.current.onFailed?.())

    connection.onreconnecting(() => setConnectionState('reconnecting'))
    connection.onreconnected(() => setConnectionState('connected'))
    connection.onclose(() => setConnectionState('disconnected'))

    connectionRef.current = connection
    setConnectionState('connecting')
    connection
      .start()
      .then(() => setConnectionState('connected'))
      .catch(() => setConnectionState('disconnected'))

    return () => {
      connection.stop()
      connectionRef.current = null
    }
  }, [livestreamId])

  const sendMessage = useCallback(async (text) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('SendMessage', text)
    }
  }, [])

  const sendReaction = useCallback(async (reactionType) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('SendReaction', reactionType)
    }
  }, [])

  return { connectionState, sendMessage, sendReaction }
}
