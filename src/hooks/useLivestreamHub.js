// src/hooks/useLivestreamHub.js
// Kết nối SignalR thật tới LivestreamHub (backend: src/MusicLounge.Infrastructure/Hubs/LivestreamHub.cs,
// broadcast qua LivestreamHubService.cs) — tên sự kiện lấy đúng từ code backend, không đoán.
import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '../store/useAuthStore'

const HUB_BASE_URL = 'https://musiclounge-api.azurewebsites.net/hubs/livestream'

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
    connection.on('ReceiveReaction', (payload) => handlersRef.current.onReceiveReaction?.(payload))
    connection.on('DonationAlert', (donation) => handlersRef.current.onDonationAlert?.(donation))
    connection.on('DonationMessageHidden', (payload) => handlersRef.current.onDonationMessageHidden?.(payload))
    connection.on('ViewerCountUpdated', (payload) => handlersRef.current.onViewerCountUpdated?.(payload))
    connection.on('LivestreamTerminated', (payload) => handlersRef.current.onTerminated?.(payload))
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
