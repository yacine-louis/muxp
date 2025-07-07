import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [playbackId, setPlaybackId] = useState('');
  const videoRef = useRef(null);

  const fetchMuxId = async () => {
    const res = await fetch('http://localhost:3001/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inputUrl }),
    });

    if (res.ok) {
      const data = await res.json();
      setPlaybackId(data.muxPlaybackId);
    } else {
      alert('Failed to extract muxPlaybackId');
    }
  };

  useEffect(() => {
    if (!playbackId || !videoRef.current) return;
    const video = videoRef.current;
    const url = `https://stream.mux.com/${playbackId}.m3u8`;

    if (video.hls) video.hls.destroy();
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      video.hls = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    return () => {
      if (video.hls) video.hls.destroy();
    };
  }, [playbackId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: "1200", overflow: "hidden" }}>
      <h1 style={{ color: 'white', fontFamily: 'Inter', marginTop: "0" }}>Mux Player</h1>
      <input
        type="text"
        placeholder="Enter local server URL"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        style={{ width: '70%', height: "100%", padding: 10, }}
      />
      <button onClick={fetchMuxId} style={{ padding: 10}}>
        Load Video
      </button>
      <video ref={videoRef} controls style={{ width: '70%', background: '#000' }} />
    </div>
  );
}