import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect, useRef } from 'react'

function Slider() {
    const [slides, setSlides] = useState([])
    const [editingSlide, setEditingSlide] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchSlides()
    }, [])

    const fetchSlides = () => {
        fetch(`${API_BASE_URL}/api/slider`)
            .then(r => r.json())
            .then(data => { setSlides(data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const data = await adminApi.upload('/api/upload', formData)
            if (data.url) {
                const fullUrl = data.url.startsWith('http') ? data.url : `${API_BASE_URL}${data.url}`
                setEditingSlide(prev => ({ ...prev, image: fullUrl }))
            }
        } catch (err) {
            console.error('Upload failed', err)
        }
        setUploading(false)
    }

    const handleSave = async () => {
        try {
            if (editingSlide.id) {
                await adminApi.put(`/api/slider/${editingSlide.id}`, editingSlide)
            } else {
                await adminApi.post('/api/slider', editingSlide)
            }
            setEditingSlide(null)
            fetchSlides()
        } catch (e) {
            console.error('Save failed', e)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this slide?')) return
        await adminApi.delete(`/api/slider/${id}`)
        fetchSlides()
    }

    const toggleEnabled = async (slide) => {
        await adminApi.put(`/api/slider/${slide.id}`, { ...slide, enabled: !slide.enabled })
        fetchSlides()
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        addBtn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
        card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5' },
        cardImage: { width: '100%', height: '180px', objectFit: 'cover', background: 'linear-gradient(135deg, #6B2346 0%, #C64977 100%)' },
        cardContent: { padding: '20px' },
        cardTitle: { fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '8px' },
        cardSubtitle: { fontSize: '14px', color: '#888', marginBottom: '16px' },
        badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginRight: '8px' },
        badgeEnabled: { background: '#E8F5E9', color: '#2E7D32' },
        badgeDisabled: { background: '#f0f0f0', color: '#888' },
        actions: { display: 'flex', gap: '10px', marginTop: '16px' },
        btn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
        btnEdit: { background: '#E3F2FD', color: '#1565C0' },
        btnDelete: { background: '#FFEBEE', color: '#C62828' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
        imageUpload: { width: '100%', height: '180px', border: '2px dashed #ddd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundSize: 'cover', backgroundPosition: 'center', color: '#666', fontSize: '14px' },
        formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
        hint: { fontSize: '12px', color: '#888', marginTop: '6px' },
        checkbox: { display: 'flex', alignItems: 'center', gap: '10px' },
        modalActions: { display: 'flex', gap: '12px', marginTop: '24px' },
        btnCancel: { flex: 1, padding: '14px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        btnSave: { flex: 1, padding: '14px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        empty: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px' }
    }

    const emptySlide = { title: '', subtitle: '', description: '', image: '', buttonText: 'Shop Now', buttonLink: '/products', order: slides.length + 1, enabled: true }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Hero Slider ({slides.length})</h1>
                <button style={styles.addBtn} onClick={() => setEditingSlide(emptySlide)}>+ Add Slide</button>
            </div>

            <p style={{ color: '#666', marginBottom: '24px' }}>Manage the hero slider on your homepage. Drag to reorder.</p>

            <div style={styles.grid}>
                {slides.map(slide => (
                    <div key={slide.id} style={styles.card}>
                        {slide.image ? (
                            <img src={slide.image} alt="" style={styles.cardImage} onError={e => e.target.style.background = 'linear-gradient(135deg, #6B2346 0%, #C64977 100%)'} />
                        ) : (
                            <div style={{ ...styles.cardImage, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>🖼️</div>
                        )}
                        <div style={styles.cardContent}>
                            <div style={styles.cardTitle} dangerouslySetInnerHTML={{ __html: slide.title || 'Untitled' }} />
                            <div style={styles.cardSubtitle}>{slide.subtitle || 'No subtitle'}</div>
                            <span style={{ ...styles.badge, ...(slide.enabled ? styles.badgeEnabled : styles.badgeDisabled) }}>
                                {slide.enabled ? 'Active' : 'Disabled'}
                            </span>
                            <span style={styles.badge}>Order: {slide.order || 1}</span>
                            <div style={styles.actions}>
                                <button style={{ ...styles.btn, ...styles.btnEdit }} onClick={() => setEditingSlide(slide)}>Edit</button>
                                <button style={{ ...styles.btn, background: '#F5F5F5', color: '#333' }} onClick={() => toggleEnabled(slide)}>
                                    {slide.enabled ? 'Disable' : 'Enable'}
                                </button>
                                <button style={{ ...styles.btn, ...styles.btnDelete }} onClick={() => handleDelete(slide.id)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {slides.length === 0 && (
                <div style={styles.empty}>
                    <p style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</p>
                    <p style={{ color: '#666' }}>No slides yet. Add your first hero slide!</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingSlide && (
                <div style={styles.modal} onClick={() => setEditingSlide(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>{editingSlide.id ? 'Edit Slide' : 'Add Slide'}</h2>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Slide Image</label>
                            <div
                                style={{ ...styles.imageUpload, backgroundImage: editingSlide.image ? `url(${editingSlide.image})` : 'none', color: editingSlide.image ? 'transparent' : '#666' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? 'Uploading...' : (editingSlide.image ? '' : '📷 Click to upload image')}
                            </div>
                            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                            <p style={styles.hint}>Recommended size: 1920x600px</p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Title</label>
                            <input type="text" style={styles.input} value={editingSlide.title || ''} onChange={e => setEditingSlide({ ...editingSlide, title: e.target.value })} placeholder="Welcome to <span>DecoraBake</span>" />
                            <p style={styles.hint}>Use &lt;span&gt; tags to highlight text</p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Subtitle</label>
                            <input type="text" style={styles.input} value={editingSlide.subtitle || ''} onChange={e => setEditingSlide({ ...editingSlide, subtitle: e.target.value })} placeholder="Premium Cake Decorating Supplies" />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea style={styles.textarea} value={editingSlide.description || ''} onChange={e => setEditingSlide({ ...editingSlide, description: e.target.value })} placeholder="Discover our amazing range..." />
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Button Text</label>
                                <input type="text" style={styles.input} value={editingSlide.buttonText || ''} onChange={e => setEditingSlide({ ...editingSlide, buttonText: e.target.value })} placeholder="Shop Now" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Button Link</label>
                                <input type="text" style={styles.input} value={editingSlide.buttonLink || ''} onChange={e => setEditingSlide({ ...editingSlide, buttonLink: e.target.value })} placeholder="/products" />
                            </div>
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Order</label>
                                <input type="number" style={styles.input} value={editingSlide.order || 1} onChange={e => setEditingSlide({ ...editingSlide, order: parseInt(e.target.value) })} min="1" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Status</label>
                                <div style={{ ...styles.checkbox, marginTop: '12px' }}>
                                    <input type="checkbox" id="enabled" checked={editingSlide.enabled} onChange={e => setEditingSlide({ ...editingSlide, enabled: e.target.checked })} />
                                    <label htmlFor="enabled">Enabled</label>
                                </div>
                            </div>
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.btnCancel} onClick={() => setEditingSlide(null)}>Cancel</button>
                            <button style={styles.btnSave} onClick={handleSave}>Save Slide</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Slider


