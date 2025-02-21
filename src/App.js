import React, { useState } from 'react';
import YouTube from 'react-youtube';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  
  const getVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const openMultipleTabs = () => {
    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      alert('Please enter a valid YouTube URL');
      return;
    }
    setShowGrid(true);
  };

  const renderVideoGrid = () => {
    const videoId = getVideoId(videoUrl);
    if (!videoId || !showGrid) return null;

    const opts = {
      height: '120',
      width: '160',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        showinfo: 0,
      },
    };

    const gridItems = [];
    for (let i = 0; i < 1000; i++) {
      gridItems.push(
        <div key={i} style={{ margin: '2px' }}>
          <YouTube
            videoId={videoId}
            opts={opts}
            onError={(e) => console.log('Error:', e)}
          />
        </div>
      );
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '4px',
        padding: '10px',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        {gridItems}
      </div>
    );
  };

  const previewOpts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
        <h1>YouTube Multi-Tab Player</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Enter YouTube video URL"
            style={{ width: '100%', maxWidth: '800px', padding: '10px', marginBottom: '10px' }}
          />
          
          <button
            onClick={openMultipleTabs}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff0000',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Open in 1000 Tabs
          </button>
        </div>

        {videoUrl && getVideoId(videoUrl) && !showGrid && (
          <div>
            <h2>Preview:</h2>
            <YouTube
              videoId={getVideoId(videoUrl)}
              opts={previewOpts}
            />
          </div>
        )}

        {renderVideoGrid()}
      </div>
    </div>
  );
}

export default App;
