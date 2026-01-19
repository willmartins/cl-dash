import React, { useState } from 'react';

const Admin = ({ config, refresh }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [localConfig, setLocalConfig] = useState(config);

    const handleLogin = (e) => {
        e.preventDefault();
        if (inputPassword === 'C0co@12') {
            setPassword(inputPassword);
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleShopifyChange = (store, key, value) => {
        setLocalConfig(prev => ({
            ...prev,
            shopifyData: {
                ...prev.shopifyData,
                [store]: { ...prev.shopifyData[store], [key]: parseInt(value) || 0 }
            }
        }));
    };

    const saveConfig = async () => {
        await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': password
            },
            body: JSON.stringify(localConfig)
        });
        refresh();
        alert('Settings saved!');
    };
    const handleShopifySync = async () => {
        try {
            const resp = await fetch('/api/shopify/sync', {
                method: 'POST',
                headers: { 'x-admin-password': password }
            });
            const result = await resp.json();
            if (result.success) {
                setLocalConfig(result.data);
                refresh();
                alert('Shopify data synced successfully!');
            } else {
                alert('Sync failed: ' + (result.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Sync failed: ' + e.message);
        }
    };

    const [isUploading, setIsUploading] = useState(false);

    // Client-side compression helper
    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', 0.95); // 95% quality JPEG
                };
            };
        });
    };

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();

        // Compress all images in parallel
        const compressedFiles = await Promise.all(Array.from(files).map(resizeImage));

        for (const file of compressedFiles) {
            formData.append('images', file);
        }

        try {
            const resp = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-admin-password': password },
                body: formData
            });
            const result = await resp.json();
            if (resp.ok) {
                console.log('Upload success:', result);
                if (result.imageUrls) {
                    setLocalConfig(prev => ({
                        ...prev,
                        gallery: [...(prev.gallery || []), ...result.imageUrls]
                    }));
                }
                // Do NOT refresh here, as it might confuse local state vs server state race
                // refresh();
            } else {
                console.error('Upload failed:', result.error);
                alert('Upload failed: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Upload network error:', err);
            alert('Upload failed. Check console for details.');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const deleteImage = async (img) => {
        const filename = img.split('/').pop();
        await fetch(`/api/gallery/${filename}`, {
            method: 'DELETE',
            headers: { 'x-admin-password': password }
        });

        setLocalConfig(prev => ({
            ...prev,
            gallery: prev.gallery.filter(item => item !== img)
        }));
    };



    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <div className="glass-card login-box">
                    <h2>Admin Access</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="save-btn" style={{ marginTop: '1rem', width: '100%' }}>Login</button>
                    </form>
                </div>
                <style>{`
                    .login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #0c0d12; color: white; }
                    .login-box { width: 100%; max-width: 400px; text-align: center; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Dashboard Control Center</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: config._meta?.mongoConnected ? '#10b981' : '#ef4444',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                    }}>
                        {config._meta?.mongoConnected ? 'DB Connected' : 'DB Disconnected'}
                    </div>
                    <button className="save-btn" onClick={saveConfig}>Save All Changes</button>
                </div>
            </div>

            <div className="admin-grid-top">
                <section className="glass-card">
                    <h2>General Settings</h2>
                    <div className="input-group">
                        <label>Company Logo URL</label>
                        <input name="logoUrl" value={localConfig.logoUrl} onChange={handleChange} />
                    </div>
                </section>

                <section className="glass-card">
                    <h2>Kitchen Dashboard</h2>
                    <div className="input-group">
                        <label>Welcome Message</label>
                        <input name="kitchenWelcome" value={localConfig.kitchenWelcome} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Kitchen Notes</label>
                        <textarea name="kitchenMessage" value={localConfig.kitchenMessage} onChange={handleChange} />
                    </div>
                </section>

                <section className="glass-card">
                    <h2>Dispatch Dashboard</h2>
                    <div className="input-group">
                        <label>Welcome Message</label>
                        <input name="dispatchWelcome" value={localConfig.dispatchWelcome} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Dispatch Notes</label>
                        <textarea name="dispatchMessage" value={localConfig.dispatchMessage} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Shopify Data</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {localConfig.shopifyLastChecked && (
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                    Last Sync: {new Date(localConfig.shopifyLastChecked).toLocaleTimeString()}
                                </span>
                            )}
                            <button
                                onClick={handleShopifySync}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.8rem',
                                    background: '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                ↻ Sync Now
                            </button>
                        </div>
                    </div>
                    <div className="shopify-grid">
                        <div>
                            <label>Retail Today</label>
                            <input type="number"
                                value={localConfig.shopifyData?.retail?.today ?? 0}
                                onChange={e => handleShopifyChange('retail', 'today', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Retail Unfulfilled</label>
                            <input type="number"
                                value={localConfig.shopifyData?.retail?.unfulfilled ?? 0}
                                onChange={e => handleShopifyChange('retail', 'unfulfilled', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Trade Today</label>
                            <input type="number"
                                value={localConfig.shopifyData?.trade?.today ?? 0}
                                onChange={e => handleShopifyChange('trade', 'today', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Trade Unfulfilled</label>
                            <input type="number"
                                value={localConfig.shopifyData?.trade?.unfulfilled ?? 0}
                                onChange={e => handleShopifyChange('trade', 'unfulfilled', e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            </div>

            <div className="admin-grid-bottom">
                <section className="glass-card gallery-section" style={{ gridColumn: '1 / -1' }}>
                    <div className="section-header">
                        <h2>Team Photo Gallery</h2>
                        {localConfig && localConfig.gallery && localConfig.gallery.length > 0 && (
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete ALL photos? This cannot be undone.')) {
                                        for (const img of localConfig.gallery) {
                                            await deleteImage(img);
                                        }
                                    }
                                }}
                                className="remove-btn"
                                style={{ marginTop: 0, background: '#ef4444' }}
                            >
                                Clear All Photos
                            </button>
                        )}
                    </div>

                    <div className="upload-box">
                        <label htmlFor="file-upload" className={`custom-file-upload ${isUploading ? 'uploading' : ''}`}>
                            {isUploading ? 'Uploading...' : 'Select Multiple Photos'}
                        </label>
                        <input id="file-upload" type="file" multiple onChange={handleFileUpload} disabled={isUploading} />
                    </div>
                    <div className="image-list">
                        {localConfig && localConfig.gallery && localConfig.gallery.map((img, i) => (
                            <div key={i} className="img-thumb">
                                <img src={img} alt="Thumb" />
                                <button onClick={() => deleteImage(img)}>×</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <style>{`
        .admin-container { padding: 40px; color: #fff; background: #0c0d12; min-height: 100vh; font-family: sans-serif; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .admin-grid-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .admin-grid-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 500px; }
        
        .glass-card { background: rgba(255,255,255,0.05); padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: #a1a1aa; }
        input, textarea { width: 100%; background: #1a1b26; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 8px; }
        textarea { height: 100px; }
        .save-btn { background: #7c3aed; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
        .save-btn:hover { transform: scale(1.05); }
        .add-btn { background: #10b981; border: none; color: #fff; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        
        .scroll-area { flex: 1; overflow-y: auto; padding-right: 10px; }
        .review-item { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #333; }
        .review-item input { margin-bottom: 10px; }
        .remove-btn { background: #ef4444; border: none; color: #fff; padding: 5px 10px; border-radius: 4px; margin-top: 10px; cursor: pointer; }

        .upload-box { margin-bottom: 20px; }
        input[type="file"] { display: none; }
        .custom-file-upload {
            display: inline-block;
            padding: 12px 20px;
            cursor: pointer;
            background: #333;
            border-radius: 8px;
            border: 1px dashed #666;
            width: 100%;
            text-align: center;
            transition: background 0.2s;
        }
        .custom-file-upload:hover { background: #444; }
        .custom-file-upload.uploading { background: #555; cursor: wait; opacity: 0.7; }

        .image-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; flex: 1; overflow-y: auto; }
        .img-thumb { position: relative; aspect-ratio: 1; }
        .img-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
        .img-thumb button { position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-weight: bold; }
        .shopify-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
      `}</style>
        </div>
    );
};

export default Admin;
