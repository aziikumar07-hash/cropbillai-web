import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html, ContactShadows } from '@react-three/drei';
import './App.css';

// This is a placeholder component that will load your Blender model
// Once you save a .glb file to public/models/, you update the path here.
function ModelPlaceholder({ url, scale = 1, position = [0, 0, 0] }) {
  // Uncomment the lines below once you have an actual model!
  // const { scene } = useGLTF(url);
  // return <primitive object={scene} scale={scale} position={position} />;

  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4CAF50" />
      <Html position={[0, 1.2, 0]} center>
        <div style={{ background: 'white', padding: '5px 10px', borderRadius: '5px', whiteSpace: 'nowrap', color: 'black', fontWeight: 'bold' }}>
          Your 3D Model Here
        </div>
      </Html>
    </mesh>
  );
}

function App() {
  return (
    <div className="app-container">
      <header className="hero-section">
        <div className="hero-content">
          <h1>CropBillAI</h1>
          <p>The All-in-One AI Financial Assistant for Modern Farms.</p>
          <p className="subtitle">Automate billing, track cash flow, and discover grants with artificial intelligence.</p>
          <button className="cta-button">Join the Waitlist</button>
        </div>

        <div className="hero-3d-canvas">
          {/* The Canvas is the portal to the 3D world */}
          <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            
            {/* The Environment provides realistic reflections for your Blender models */}
            <Environment preset="city" />
            
            {/* The Model (Wrapped in Suspense because 3D models load asynchronously) */}
            <Suspense fallback={<Html center><span style={{color: 'white'}}>Loading 3D...</span></Html>}>
              {/* 
                Replace the URL below when you have your model! 
                e.g., url="/models/smart-farm.glb"
              */}
              <ModelPlaceholder url="/models/placeholder.glb" scale={1.5} position={[0, -0.5, 0]} />
              
              {/* Adds a nice soft shadow under the model */}
              <ContactShadows position={[0, -0.51, 0]} opacity={0.5} scale={10} blur={2} far={4} />
            </Suspense>

            {/* Allows the user to rotate the model with their mouse */}
            <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} />
          </Canvas>
        </div>
      </header>

      <section className="features-section">
        <h2>How CropBillAI Works</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>AI Expense Scanner</h3>
            <p>Upload messy receipts. AI automatically categorizes and syncs them to your ledger.</p>
          </div>
          <div className="feature-card">
            <h3>B2B Farm Billing</h3>
            <p>Generate smart invoices for distributors that handle net-terms and fluctuating crop prices.</p>
          </div>
          <div className="feature-card">
            <h3>Grant Matcher</h3>
            <p>Our AI analyzes your operations and matches you to eligible agricultural grants.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
