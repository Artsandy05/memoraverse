import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Device orientation permission handler
function DeviceOrientationPermission({ onPermissionGranted }) {
  const [permissionState, setPermissionState] = useState('unknown');

  const requestPermission = async () => {
    try {
      // iOS 13+ requires permission for device motion/orientation
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        
        const permissionState = await DeviceOrientationEvent.requestPermission();
        
        if (permissionState === 'granted') {
          setPermissionState('granted');
          onPermissionGranted();
        } else {
          setPermissionState('denied');
        }
      } else {
        // For Android and devices that don't require permission
        setPermissionState('granted');
        onPermissionGranted();
      }
    } catch (error) {
      console.error('Error requesting device orientation permission:', error);
      setPermissionState('error');
    }
  };

  return (
    <div className="permission-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1>MemoraVerse</h1>
      
      {permissionState === 'unknown' && (
        <>
          <p>This AR experience needs access to your device's motion sensors.</p>
          <button 
            onClick={requestPermission}
            style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}
          >
            Enable AR Experience
          </button>
        </>
      )}
      
      {permissionState === 'denied' && (
        <>
          <p>Permission denied. Please enable device orientation in your settings to continue.</p>
          <button 
            onClick={requestPermission}
            style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </>
      )}
      
      {permissionState === 'error' && (
        <>
          <p>An error occurred while requesting permission. This may not be supported on your device.</p>
          <button 
            onClick={onPermissionGranted}
            style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}
          >
            Continue Anyway
          </button>
        </>
      )}
    </div>
  );
}

function Root() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };
    
    setIsMobile(checkMobile());
  }, []);
  
  if (!isMobile) {
    return (
      <div className="desktop-warning" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        color: 'white',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1>MemoraVerse</h1>
        <p>This AR experience is designed for mobile devices. Please open this page on your smartphone or tablet.</p>
        <p>Scan the QR code below or visit this URL on your mobile device:</p>
        
        {/* Placeholder for QR code */}
        <div style={{
          width: '200px',
          height: '200px',
          backgroundColor: '#222',
          margin: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          [QR Code Placeholder]
        </div>
      </div>
    );
  }
  
  if (!permissionGranted) {
    return <DeviceOrientationPermission onPermissionGranted={() => setPermissionGranted(true)} />;
  }
  
  return <App />;
}

// Render the application
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Root />);