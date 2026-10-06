import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Music, DollarSign, VideoOff } from 'lucide-react';
import { showService } from '../services/showService';
import { livestreamService } from '../services/livestreamService';
import * as signalR from '@microsoft/signalr';
import Hls from 'hls.js';
import toast from 'react-hot-toast';
import ChatBox from '../components/ChatBox';
import DonationModal from '../components/DonationModal';
import './LivestreamViewerPage.css';

const REACTIONS = ['❤️', '🔥', '👏', '😮'];

export default function LivestreamViewerPage() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [livestream, setLivestream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video Player
  const videoRef = useRef(null);
  
  // Chat & Real-time
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  
  // Donation
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  useEffect(() => {
    const fetchShowAndStream = async () => {
      try {
        const showRes = await showService.getDetail(id);
        if (showRes.success) {
          setShow(showRes.data);
          
          if (showRes.data.livestreamId) {
            const streamRes = await livestreamService.getDetail(showRes.data.livestreamId);
            if (streamRes.success) {
              setLivestream(streamRes.data);
            }
            
            const chatRes = await livestreamService.getChatHistory(showRes.data.livestreamId);
            if (chatRes.success) {
              setMessages(chatRes.data.items?.slice().reverse() || []);
            }
            
            setupSignalR(showRes.data.livestreamId);
          }
        }
      } catch (err) {
        toast.error('Failed to load livestream data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShowAndStream();
    
    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [id]);

  useEffect(() => {
    if (livestream?.playbackUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(livestream.playbackUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.log('Autoplay prevented:', e));
        });
        return () => hls.destroy();
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari fallback
        videoRef.current.src = livestream.playbackUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play().catch(e => console.log('Autoplay prevented:', e));
        });
      }
    }
  }, [livestream?.playbackUrl]);

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
      toast.success(`${donation.donorName} donated ${donation.amount.toLocaleString()} VND!`);
      // Could trigger a nice on-screen animation here
    });

    newConnection.on('ReceiveReaction', (data) => {
      const emojiMap = { like: '👍', heart: '❤️', fire: '🔥', wow: '😮' };
      const char = emojiMap[data.reactionType] || data.reactionType; // fallback to the string if not mapped
      
      const newReaction = {
        id: Date.now() + Math.random(),
        char,
        left: Math.random() * 80 + '%' // random horizontal position
      };
      setFloatingReactions(prev => [...prev, newReaction]);
      
      // cleanup after animation
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 2000);
    });

    try {
      await newConnection.start();
      setConnection(newConnection);
    } catch (e) {
      console.error('SignalR Connection Error: ', e);
    }
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

  const sendReaction = async (reactionType) => {
    if (connection) {
      try {
        const apiType = reactionType === '❤️' ? 'heart' : reactionType === '🔥' ? 'fire' : reactionType === '😮' ? 'wow' : 'like';
        await connection.invoke('SendReaction', apiType);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="viewer-page" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Loader2 size={48} className="auth-btn-spinner" color="white" />
        <span style={{ color: 'white', marginTop: '1rem' }}>Loading Stream...</span>
      </div>
    );
  }

  if (!show) return <div>Show not found</div>;

  const isLive = livestream?.status === 'Live' || show.isOngoing;

  return (
    <div className="viewer-page">
      <div className="viewer-main">
        <div className="viewer-video-container">
          {isLive && livestream?.playbackUrl ? (
            <video 
              ref={videoRef} 
              controls 
              autoPlay 
              muted={false}
              playsInline
            />
          ) : (
            <div className="offline-screen">
              <VideoOff size={64} color="#6b7280" />
              <h2>Stream is offline</h2>
              <p>The event hasn't started yet, or it has ended.</p>
            </div>
          )}

          {isLive && (
            <div className="reaction-bar">
              {REACTIONS.map(r => (
                <button key={r} className="reaction-btn" onClick={() => sendReaction(r)}>
                  {r}
                </button>
              ))}
            </div>
          )}

          <div className="reaction-container">
            {floatingReactions.map(r => (
              <div key={r.id} className="floating-reaction" style={{ left: r.left }}>
                {r.char}
              </div>
            ))}
          </div>
        </div>

        <div className="viewer-info-panel">
          <div className="viewer-info-left">
            <h1>{show.name}</h1>
            <Link to={`/lounges/${show.lounge?.id}`} className="viewer-lounge-name">
              <Music size={16} />
              {show.lounge?.name}
            </Link>
          </div>
          <div className="viewer-actions">
            <button className="btn-donate" onClick={() => setIsDonationOpen(true)}>
              <DollarSign size={20} />
              Support Performer
            </button>
          </div>
        </div>
      </div>

      <div className="viewer-sidebar">
        <ChatBox 
          messages={messages}
          onSendMessage={sendMessage}
          viewerCount={viewerCount}
          isLive={isLive}
        />
      </div>

      <DonationModal 
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        livestreamId={livestream?.id}
      />
    </div>
  );
}
