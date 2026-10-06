import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Video, Key, Wifi, Play, Square, Users, MessageSquare } from 'lucide-react';
import { showService } from '../../services/showService';
import { livestreamService } from '../../services/livestreamService';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import ChatBox from '../../components/ChatBox';
import './OwnerLivestreamStudio.css';

export default function OwnerLivestreamStudio() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  
  // Chat & SignalR
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const initStudio = async () => {
      try {
        const showRes = await showService.getDetail(id);
        if (showRes.success) {
          const showData = showRes.data;
          setShow(showData);

          if (showData.livestreamId) {
            const credRes = await livestreamService.getCredentials(showData.livestreamId);
            if (credRes.success) {
              setCredentials(credRes.data);
            }
            
            const chatRes = await livestreamService.getChatHistory(showData.livestreamId);
            if (chatRes.success) {
              setMessages(chatRes.data.items?.slice().reverse() || []); // newest at bottom
            }

            setupSignalR(showData.livestreamId);
          }
        }
      } catch (err) {
        toast.error('Failed to load studio data');
      } finally {
        setIsLoading(false);
      }
    };
    initStudio();
    
    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [id]);

  const setupSignalR = async (livestreamId) => {
    const token = (() => {
      try {
        const stored = localStorage.getItem('auth-storage');
        return JSON.parse(stored)?.state?.token;
      } catch { return null; }
    })();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/api/v1/hubs/livestream?livestreamId=${livestreamId}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.on('ReceiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newConnection.on('ViewerCountUpdated', (data) => {
      setViewerCount(data.count);
    });

    newConnection.on('DonationAlert', (donation) => {
      toast.success(`${donation.donorName} donated ${donation.amount} VND!`);
    });

    try {
      await newConnection.start();
      setConnection(newConnection);
    } catch (e) {
      console.error('SignalR Connection Error: ', e);
    }
  };

  const handleCreateLivestream = async () => {
    try {
      const res = await livestreamService.create(show.id);
      if (res.success || res.status === 201) {
        toast.success('Livestream initialized! Awaiting Admin approval.');
        // Refresh
        window.location.reload();
      }
    } catch (err) {
      toast.error('Failed to initialize livestream');
    }
  };

  const handleStartEvent = async () => {
    setIsStarting(true);
    try {
      // Must use StartLivestream for shows with livestream
      await livestreamService.start(show.livestreamId);
      toast.success('Event is now LIVE!');
      setShow(prev => ({ ...prev, isOngoing: true, status: 'Ongoing' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start event');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndEvent = async () => {
    if (!window.confirm("Are you sure you want to end this event? This cannot be undone.")) return;
    
    try {
      await livestreamService.end(show.livestreamId);
      toast.success('Event ended successfully');
      setShow(prev => ({ ...prev, isOngoing: false, status: 'Ended' }));
    } catch (err) {
      toast.error('Failed to end event');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const sendMessage = async (text) => {
    if (connection) {
      try {
        await connection.invoke('SendMessage', text);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="studio-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={32} className="auth-btn-spinner" />
        <span style={{ color: 'white', marginTop: '1rem' }}>Loading Studio...</span>
      </div>
    );
  }

  if (!show) return <div>Show not found</div>;

  return (
    <div className="studio-page">
      <div className="studio-header">
        <div className="studio-title-group">
          <Link to={`/owner/shows/${id}`} style={{ color: 'white' }}>
            <ArrowLeft size={24} />
          </Link>
          <h1>{show.name} - Studio</h1>
          {show.isOngoing && (
            <div className="live-badge">
              <Wifi size={14} /> LIVE
            </div>
          )}
        </div>

        {show.livestreamId && show.status !== 'Ended' && (
          <div className="studio-actions">
            {!show.isOngoing ? (
              <button className="btn-start-stream" onClick={handleStartEvent} disabled={isStarting}>
                {isStarting ? <Loader2 size={16} className="auth-btn-spinner" /> : <Play size={16} />}
                Go Live (Start Event)
              </button>
            ) : (
              <button className="btn-end-stream" onClick={handleEndEvent}>
                <Square size={16} />
                End Event
              </button>
            )}
          </div>
        )}
      </div>

      <div className="studio-content">
        <div className="studio-main">
          {show.livestreamId ? (
            <>
              {credentials ? (
                <div className="setup-card">
                  <h2><Video size={20} /> Streaming Software Setup</h2>
                  <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                    Copy these credentials into OBS Studio or vMix to send your video feed to our servers.
                  </p>
                  
                  <div className="setup-group">
                    <label>Server URL (RTMP)</label>
                    <div className="setup-input-wrapper">
                      <input type="text" readOnly value={credentials.rtmpUrl} />
                      <button className="btn-copy" onClick={() => copyToClipboard(credentials.rtmpUrl)}>Copy</button>
                    </div>
                  </div>

                  <div className="setup-group">
                    <label>Stream Key</label>
                    <div className="setup-input-wrapper">
                      <input type="password" readOnly value={credentials.streamKey} />
                      <button className="btn-copy" onClick={() => copyToClipboard(credentials.streamKey)}>Copy</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="setup-card">
                  <p style={{ color: '#ef4444' }}>Unable to load streaming credentials. You may not have staff permissions, or the livestream hasn't been approved yet.</p>
                </div>
              )}

              <div className="stats-card">
                <div className="stat-item">
                  <Users className="stat-icon" />
                  <div className="stat-info">
                    <span>Current Viewers</span>
                    <strong>{viewerCount}</strong>
                  </div>
                </div>
                <div className="stat-item">
                  <MessageSquare className="stat-icon" />
                  <div className="stat-info">
                    <span>Messages</span>
                    <strong>{messages.length}</strong>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="studio-empty">
              <Video size={48} />
              <h2>Livestream Not Initialized</h2>
              <p>You need to initialize the livestream for this event first.</p>
              <button className="btn-create-stream" onClick={handleCreateLivestream}>
                Initialize Livestream
              </button>
            </div>
          )}
        </div>

        <div className="studio-sidebar">
          <ChatBox 
            messages={messages} 
            onSendMessage={sendMessage} 
            viewerCount={viewerCount} 
            isLive={show.isOngoing} 
          />
        </div>
      </div>
    </div>
  );
}
