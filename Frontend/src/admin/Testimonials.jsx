import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

function Testimonials() {
    const [testimonials, setTestimonials] = useState([])
    const [editingItem, setEditingItem] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTestimonials()
    }, [])

    const fetchTestimonials = () => {
        fetch(`${API_BASE_URL}/api/testimonials`)
            .then(r => r.json())
            .then(data => { setTestimonials(data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleSave = async () => {
        try {
            if (editingItem.id) {
                await adminApi.put(`/api/testimonials/${editingItem.id}`, editingItem)
            } else {
                await adminApi.post('/api/testimonials', editingItem)
            }
            setEditingItem(null)
            fetchTestimonials()
        } catch (e) {
            console.error('Save failed', e)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this testimonial?')) return
        await adminApi.delete(`/api/testimonials/${id}`)
        fetchTestimonials()
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        addBtn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
        card: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' },
        stars: { color: '#C9A865', fontSize: '18px', marginBottom: '12px' },
        quote: { fontSize: '15px', color: '#555', lineHeight: '1.6', marginBottom: '20px', fontStyle: 'italic' },
        author: { display: 'flex', alignItems: 'center', gap: '12px' },
        avatar: { width: '48px', height: '48px', borderRadius: '50%', background: '#6B2346', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' },
        authorName: { fontSize: '15px', fontWeight: '600', color: '#222' },
        authorLocation: { fontSize: '13px', color: '#888' },
        actions: { display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' },
        btn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
        btnEdit: { background: '#E3F2FD', color: '#1565C0' },
        btnDelete: { background: '#FFEBEE', color: '#C62828' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '500px' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
        ratingSelect: { display: 'flex', gap: '8px' },
        ratingStar: { fontSize: '28px', cursor: 'pointer' },
        modalActions: { display: 'flex', gap: '12px', marginTop: '24px' },
        btnCancel: { flex: 1, padding: '14px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        btnSave: { flex: 1, padding: '14px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        empty: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px' }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Testimonials ({testimonials.length})</h1>
                <button style={styles.addBtn} onClick={() => setEditingItem({ name: '', location: '', rating: 5, text: '', enabled: true })}>
                    + Add Testimonial
                </button>
            </div>

            <p style={{ color: '#666', marginBottom: '24px' }}>Customer reviews displayed on your homepage.</p>

            <div style={styles.grid}>
                {testimonials.map(item => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.stars}>{'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}</div>
                        <p style={styles.quote}>"{item.text}"</p>
                        <div style={styles.author}>
                            <div style={styles.avatar}>{item.name?.charAt(0) || 'U'}</div>
                            <div>
                                <div style={styles.authorName}>{item.name}</div>
                                <div style={styles.authorLocation}>{item.location}</div>
                            </div>
                        </div>
                        <div style={styles.actions}>
                            <button style={{ ...styles.btn, ...styles.btnEdit }} onClick={() => setEditingItem(item)}>Edit</button>
                            <button style={{ ...styles.btn, ...styles.btnDelete }} onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {testimonials.length === 0 && (
                <div style={styles.empty}>
                    <p style={{ fontSize: '48px', marginBottom: '16px' }}>💬</p>
                    <p style={{ color: '#666' }}>No testimonials yet. Add your first customer review!</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingItem && (
                <div style={styles.modal} onClick={() => setEditingItem(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>{editingItem.id ? 'Edit Testimonial' : 'Add Testimonial'}</h2>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Customer Name *</label>
                            <input type="text" style={styles.input} value={editingItem.name || ''} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Sarah Mitchell" />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Location</label>
                            <input type="text" style={styles.input} value={editingItem.location || ''} onChange={e => setEditingItem({ ...editingItem, location: e.target.value })} placeholder="Sydney, NSW" />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Rating</label>
                            <div style={styles.ratingSelect}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        style={{ ...styles.ratingStar, color: star <= (editingItem.rating || 5) ? '#C9A865' : '#ddd' }}
                                        onClick={() => setEditingItem({ ...editingItem, rating: star })}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Testimonial Text *</label>
                            <textarea style={styles.textarea} value={editingItem.text || ''} onChange={e => setEditingItem({ ...editingItem, text: e.target.value })} placeholder="What the customer said about your products..." />
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.btnCancel} onClick={() => setEditingItem(null)}>Cancel</button>
                            <button style={styles.btnSave} onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Testimonials


