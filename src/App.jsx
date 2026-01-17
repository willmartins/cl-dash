import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './components/Admin';
import KitchenDashboard from './components/KitchenDashboard';
import DispatchDashboard from './components/DispatchDashboard';
import Clock from './components/Clock';

function App() {
    const [config, setConfig] = useState(null);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            setConfig(data);
        } catch (err) {
            console.error('Failed to fetch config', err);
        }
    };

    useEffect(() => {
        fetchConfig();
        const interval = setInterval(fetchConfig, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    if (!config) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<Admin config={config} refresh={fetchConfig} />} />
                <Route path="/kitchen" element={<KitchenDashboard config={config} />} />
                <Route path="/dispatch" element={<DispatchDashboard config={config} />} />
                <Route path="/clock" element={
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        width: '100vw',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div className="aurora-mesh"></div>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0.12,
                            pointerEvents: 'none',
                            mixBlendMode: 'overlay',
                            zIndex: 1,
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                        }} />
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <Clock size="large" variant="analogue-braun" />
                        </div>
                    </div>
                } />
                <Route path="/" element={<div style={{ padding: '50px' }}>Select a Dashboard: <a href="/kitchen">Kitchen</a> | <a href="/dispatch">Dispatch</a> | <a href="/admin">Admin</a> | <a href="/clock">Clock</a></div>} />
            </Routes>
        </Router>
    );
}

export default App;
