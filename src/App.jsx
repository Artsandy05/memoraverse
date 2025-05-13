import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  ARButton, 
  XR, 
  Controllers, 
  Interactive, 
  useXRHitTest 
} from '@react-three/xr';
import { 
  Sky, 
  Environment, 
  OrbitControls, 
  useGLTF, 
  Text, 
  useAnimations,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import _ from 'lodash';
import './styles.css';

// Sample YouTube video IDs for the memory orbs
const SAMPLE_VIDEO_IDS = [
  'dQw4w9WgXcQ', // Replace with actual videos
  'UfQHEpf7q4k',
  'jNQXAC9IVRw',
  'hwQppkBR1Zs',
  'hT_nvWreIhg',
  '9bZkp7q19f0',
  'fJ9rUzIMcZQ'
];

// Orb colors inspired by Inside Out
const ORB_COLORS = [
  '#FFCC33', // Joy (yellow)
  '#5FC9F8', // Sadness (blue)
  '#EF3C6F', // Anger (red)
  '#BA68C8', // Fear (purple)
  '#7FD25A', // Disgust (green)
  '#FF9A76', // Excitement (orange)
  '#ADE1E5'  // Serenity (light blue)
];

// Main App Component
function App() {
  const [arSupported, setArSupported] = useState(null);
  const [portalEntered, setPortalEntered] = useState(false);
  
  useEffect(() => {
    // Check if WebXR is supported on this device
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar')
        .then((supported) => setArSupported(supported));
    } else {
      setArSupported(false);
    }
  }, []);

  return (
    <div className="app">
      <div className="ar-container">
        {arSupported === false && (
          <div className="ar-not-supported">
            <h2>WebXR AR not supported on this device</h2>
            <p>Please try on a mobile device with AR capabilities.</p>
            {/* Fallback to non-AR view for demo purposes */}
            <button onClick={() => setPortalEntered(true)}>
              Enter Portal (Non-AR Demo)
            </button>
          </div>
        )}
        
        {arSupported && !portalEntered && (
          <div className="ar-instructions">
            <h1>MemoraVerse</h1>
            <p>Find the portal in your space and walk through it to enter.</p>
            <ARButton
              className="ar-button"
              sessionInit={{
                requiredFeatures: ['hit-test', 'local-floor']
              }}
            >
              Enter AR
            </ARButton>
          </div>
        )}

        <Canvas>
          <XR>
            <color attach="background" args={['#000']} />
            <fog attach="fog" args={['#000', 10, 50]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />

            {/* AR Experience Content */}
            <ARExperience setPortalEntered={setPortalEntered} portalEntered={portalEntered} />
            
            {/* Regular Controls for non-AR demo */}
            {!portalEntered && <OrbitControls />}
          </XR>
        </Canvas>
      </div>
    </div>
  );
}

// Main AR Experience Component
function ARExperience({ setPortalEntered, portalEntered }) {
  const [portalPlaced, setPortalPlaced] = useState(false);
  const [portalPosition, setPortalPosition] = useState([0, 0, -5]);
  
  return (
    <>
      {/* Place the portal if not already placed */}
      {!portalPlaced && (
        <PortalPlacer setPortalPlaced={setPortalPlaced} setPortalPosition={setPortalPosition} />
      )}
      
      {/* Show the portal once placed */}
      {portalPlaced && !portalEntered && (
        <Portal 
          position={portalPosition} 
          setPortalEntered={setPortalEntered} 
        />
      )}
      
      {/* Show the memory world once entered */}
      {portalEntered && (
        <MemoryWorld />
      )}
    </>
  );
}

// Portal Placement Component
function PortalPlacer({ setPortalPlaced, setPortalPosition }) {
  const [hitPoint, setHitPoint] = useState(null);
  
  useXRHitTest((hit) => {
    const hitMatrix = new THREE.Matrix4().fromArray(hit.getPose().transform.matrix);
    const position = new THREE.Vector3().setFromMatrixPosition(hitMatrix);
    setHitPoint(position);
  });
  
  return (
    <>
      {hitPoint && (
        <>
          <mesh position={hitPoint.toArray()} onClick={() => {
            setPortalPlaced(true);
            setPortalPosition(hitPoint.toArray());
          }}>
            <ringGeometry args={[1.9, 2, 32]} />
            <meshStandardMaterial color="#4CC9F0" emissive="#4361EE" side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[hitPoint.x, hitPoint.y + 0.5, hitPoint.z]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Tap to place portal
          </Text>
        </>
      )}
    </>
  );
}

// Portal Component
function Portal({ position, setPortalEntered }) {
  const portalRef = useRef();
  const { camera } = useThree();
  
  // Check if camera entered portal
  useFrame(() => {
    if (portalRef.current) {
      const distanceToPortal = camera.position.distanceTo(
        new THREE.Vector3(position[0], position[1], position[2])
      );
      
      if (distanceToPortal < 1) {
        setPortalEntered(true);
      }
    }
  });
  
  return (
    <group position={position} ref={portalRef}>
      {/* Portal Ring */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[2, 0.2, 16, 100]} />
        <meshStandardMaterial color="#4CC9F0" emissive="#4361EE" />
      </mesh>
      
      {/* Portal Interior (glimpse of the environment) */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[1.9, 32]} />
        <meshBasicMaterial side={THREE.DoubleSide}>
          <Environment preset="forest" />
        </meshBasicMaterial>
      </mesh>
      
      {/* Portal Instructions */}
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Walk through the portal to enter MemoraVerse
      </Text>
    </group>
  );
}

// Memory World Environment
function MemoryWorld() {
  // Create terrain and environment
  return (
    <group>
      {/* Environment sky and lighting */}
      <Sky sunPosition={[0, 1, 0]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Terrain */}
      <Terrain />
      
      {/* Trees and vegetation */}
      <Vegetation />
      
      {/* Memory Orbs */}
      <MemoryOrbs />
      
      {/* Birds */}
      <Birds />
    </group>
  );
}

// Terrain Component
function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 32, 32]} />
      <meshStandardMaterial color="#4a7c59" roughness={1} />
    </mesh>
  );
}

// Vegetation Component (Trees, bushes)
function Vegetation() {
  // Pseudo-random placement of trees and bushes
  const treePositions = useMemo(() => {
    return Array(20).fill().map(() => [
      (Math.random() - 0.5) * 40,
      0,
      (Math.random() - 0.5) * 40
    ]);
  }, []);
  
  const bushPositions = useMemo(() => {
    return Array(30).fill().map(() => [
      (Math.random() - 0.5) * 30,
      -0.5,
      (Math.random() - 0.5) * 30
    ]);
  }, []);
  
  return (
    <>
      {/* Trees */}
      {treePositions.map((position, i) => (
        <Tree key={`tree-${i}`} position={position} />
      ))}
      
      {/* Bushes */}
      {bushPositions.map((position, i) => (
        <Bush key={`bush-${i}`} position={position} />
      ))}
    </>
  );
}

// Simple Tree Component
function Tree({ position }) {
  const treeHeight = 2 + Math.random() * 3;
  
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, treeHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, treeHeight, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={1} />
      </mesh>
      
      {/* Leaves */}
      <mesh position={[0, treeHeight + 0.6, 0]} castShadow>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#2e8b57" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Simple Bush Component
function Bush({ position }) {
  const bushSize = 0.5 + Math.random() * 0.5;
  
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[bushSize, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#3a5f0b" roughness={0.8} />
    </mesh>
  );
}

// Birds Component
function Birds() {
  const birdsRef = useRef();
  const numBirds = 12;
  const birdPositions = useMemo(() => {
    return Array(numBirds).fill().map(() => [
      (Math.random() - 0.5) * 50,
      5 + Math.random() * 10,
      (Math.random() - 0.5) * 50
    ]);
  }, []);
  
  useFrame(({ clock }) => {
    if (birdsRef.current) {
      birdsRef.current.children.forEach((bird, i) => {
        const time = clock.getElapsedTime() * (0.2 + i * 0.01);
        bird.position.x = birdPositions[i][0] + Math.sin(time) * 3;
        bird.position.z = birdPositions[i][2] + Math.cos(time) * 3;
        bird.rotation.y = Math.sin(time) * Math.PI;
      });
    }
  });
  
  return (
    <group ref={birdsRef}>
      {birdPositions.map((position, i) => (
        <Bird key={`bird-${i}`} position={position} />
      ))}
    </group>
  );
}

// Simple Bird Component
function Bird({ position }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="#333" />
      
      {/* Wings */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshStandardMaterial color="#222" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshStandardMaterial color="#222" side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
}

// Memory Orbs Component
function MemoryOrbs() {
  const { camera } = useThree();
  const [activeOrb, setActiveOrb] = useState(null);
  
  // Generate orb positions
  const orbPositions = useMemo(() => {
    return SAMPLE_VIDEO_IDS.map((_, i) => [
      (Math.random() - 0.5) * 30,
      1 + Math.random() * 3,
      (Math.random() - 0.5) * 30
    ]);
  }, []);
  
  // Check if player is near any orb
  useFrame(() => {
    orbPositions.forEach((position, index) => {
      const distance = camera.position.distanceTo(
        new THREE.Vector3(position[0], position[1], position[2])
      );
      
      if (distance < 3 && activeOrb !== index) {
        setActiveOrb(index);
      } else if (distance >= 3 && activeOrb === index) {
        setActiveOrb(null);
      }
    });
  });
  
  return (
    <>
      {SAMPLE_VIDEO_IDS.map((videoId, i) => (
        <MemoryOrb 
          key={`orb-${i}`}
          position={orbPositions[i]} 
          color={ORB_COLORS[i % ORB_COLORS.length]}
          videoId={videoId}
          isActive={activeOrb === i}
        />
      ))}
    </>
  );
}

// Individual Memory Orb Component
function MemoryOrb({ position, color, videoId, isActive }) {
  const orbRef = useRef();
  
  // Floating animation
  useFrame(({ clock }) => {
    if (orbRef.current) {
      const time = clock.getElapsedTime();
      orbRef.current.position.y = position[1] + Math.sin(time) * 0.2;
      orbRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <group ref={orbRef} position={position}>
      {/* Glowing orb */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.8} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      
      {/* Video player */}
      {isActive && (
        <Html position={[0, 1.2, 0]} transform distanceFactor={10}>
          <div className="video-container" style={{ width: '240px', height: '180px' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </Html>
      )}
    </group>
  );
}

export default App;