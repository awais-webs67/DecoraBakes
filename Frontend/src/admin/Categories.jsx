import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect, useRef } from 'react'

function Categories() {
    const [categories, setCategories] = useState([])
    const [editingCategory, setEditingCategory] = useState(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = () => {
        setLoading(true)
        fetch(`${API_BASE_URL}/api/categories`)
            .then(r => r.json())
            .then(data => { setCategories(data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleSave = async () => {
        const categoryId = editingCategory.id || editingCategory._id
        if (categoryId) {
            await adminApi.put(`/api/categories/${categoryId}`, editingCategory)
        } else {
            await adminApi.post('/api/categories', editingCategory)
        }
        setEditingCategory(null)
        fetchCategories()
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this category? Products in this category will not be deleted.')) return
        await adminApi.delete(`/api/categories/${id}`)
        fetchCategories()
    }

    const toggleVisibility = async (category, field) => {
        const catId = category.id || category._id
        await adminApi.put(`/api/categories/${catId}`, { ...category, [field]: !category[field] })
        fetchCategories()
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const data = await adminApi.upload('/api/upload', formData)
            if (data.url) {
                setEditingCategory({ ...editingCategory, image: `${API_BASE_URL}${data.url}` })
            }
        } catch (err) {
            console.error('Upload failed:', err)
        } finally {
            setUploading(false)
        }
    }

    const styles = {
        page: { padding: '0' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        addBtn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
        card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5', minWidth: '0' },
        cardImage: { width: '100%', height: '140px', objectFit: 'cover', background: 'linear-gradient(135deg, #6B2346 0%, #C64977 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px' },
        cardContent: { padding: '16px' },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' },
        cardTitle: { fontSize: '16px', fontWeight: '600', color: '#222' },
        cardSlug: { fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: 'monospace' },
        productCount: { background: '#FCE8ED', color: '#6B2346', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
        cardDescription: { fontSize: '13px', color: '#666', marginBottom: '14px', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
        toggles: { display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' },
        toggle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666', cursor: 'pointer' },
        toggleSwitch: { width: '32px', height: '18px', borderRadius: '9px', position: 'relative', transition: 'background 0.3s' },
        toggleKnob: { width: '14px', height: '14px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', transition: 'left 0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' },
        actions: { display: 'flex', gap: '8px' },
        btn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
        btnEdit: { background: '#E3F2FD', color: '#1565C0' },
        btnDelete: { background: '#FFEBEE', color: '#C62828' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
        hint: { fontSize: '12px', color: '#888', marginTop: '6px' },
        checkbox: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
        modalActions: { display: 'flex', gap: '12px', marginTop: '24px' },
        btnCancel: { flex: 1, padding: '14px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        btnSave: { flex: 1, padding: '14px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        uploadArea: { border: '2px dashed #ddd', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.3s', background: '#fafafa' },
        uploadPreview: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' },
        uploadBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }
    }

    const emptyCategory = { name: '', slug: '', description: '', image: '', showInNav: true, showOnHome: false }

    if (loading && categories.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Categories ({categories.length})</h1>
                <button style={styles.addBtn} onClick={() => setEditingCategory(emptyCategory)}>+ Add Category</button>
            </div>

            <p style={{ color: '#666', marginBottom: '24px' }}>Organize your products into categories for easy navigation.</p>

            <div style={styles.grid}>
                {categories.map(cat => {
                    const catId = cat.id || cat._id
                    const imageUrl = cat.image?.startsWith('http') ? cat.image : (cat.image ? `${API_BASE_URL}${cat.image}` : '')
                    return (
                        <div key={catId} style={styles.card}>
                            <div style={{ ...styles.cardImage, backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {!cat.image && '📁'}
                            </div>
                            <div style={styles.cardContent}>
                                <div style={styles.cardHeader}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={styles.cardTitle}>{cat.name}</div>
                                        <div style={styles.cardSlug}>/{cat.slug}</div>
                                    </div>
                                    <span style={styles.productCount}>{cat.productCount || 0} items</span>
                                </div>

                                <p style={styles.cardDescription}>{cat.description || 'No description'}</p>

                                <div style={styles.toggles}>
                                    <div style={styles.toggle} onClick={() => toggleVisibility(cat, 'showInNav')}>
                                        <div style={{ ...styles.toggleSwitch, background: cat.showInNav ? '#6B2346' : '#ddd' }}>
                                            <div style={{ ...styles.toggleKnob, left: cat.showInNav ? '16px' : '2px' }} />
                                        </div>
                                        <span>Nav</span>
                                    </div>
                                    <div style={styles.toggle} onClick={() => toggleVisibility(cat, 'showOnHome')}>
                                        <div style={{ ...styles.toggleSwitch, background: cat.showOnHome ? '#6B2346' : '#ddd' }}>
                                            <div style={{ ...styles.toggleKnob, left: cat.showOnHome ? '16px' : '2px' }} />
                                        </div>
                                        <span>Home</span>
                                    </div>
                                </div>

                                <div style={styles.actions}>
                                    <button style={{ ...styles.btn, ...styles.btnEdit }} onClick={() => setEditingCategory(cat)}>Edit</button>
                                    <button style={{ ...styles.btn, ...styles.btnDelete }} onClick={() => handleDelete(catId)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {categories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px' }}>
                    <p style={{ color: '#666', marginBottom: '16px' }}>No categories yet. Create your first one!</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingCategory && (
                <div style={styles.modal} onClick={() => setEditingCategory(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>{(editingCategory.id || editingCategory._id) ? 'Edit Category' : 'Add Category'}</h2>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Category Name *</label>
                            <input type="text" style={styles.input} value={editingCategory.name || ''} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} placeholder="e.g. Cake Toppers" />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Slug</label>
                            <input type="text" style={styles.input} value={editingCategory.slug || ''} onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })} placeholder="cake-toppers" />
                            <p style={styles.hint}>URL-friendly name (auto-generated from name)</p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Category Image</label>
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                                {editingCategory.image ? (
                                    <img src={editingCategory.image} alt="Preview" style={styles.uploadPreview} />
                                ) : (
                                    <div style={{ color: '#888', padding: '20px' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📷</div>
                                        <p>Click to upload image</p>
                                    </div>
                                )}
                            </div>
                            {uploading && <p style={{ color: '#6B2346', marginTop: '8px' }}>Uploading...</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description</label>
                            <textarea style={styles.textarea} value={editingCategory.description || ''} onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })} placeholder="Brief description of this category..." />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Visibility</label>
                            <div style={styles.checkbox}>
                                <input type="checkbox" id="showInNav" checked={editingCategory.showInNav} onChange={e => setEditingCategory({ ...editingCategory, showInNav: e.target.checked })} />
                                <label htmlFor="showInNav">Show in navigation menu</label>
                            </div>
                            <div style={styles.checkbox}>
                                <input type="checkbox" id="showOnHome" checked={editingCategory.showOnHome} onChange={e => setEditingCategory({ ...editingCategory, showOnHome: e.target.checked })} />
                                <label htmlFor="showOnHome">Feature on homepage</label>
                            </div>
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.btnCancel} onClick={() => setEditingCategory(null)}>Cancel</button>
                            <button style={styles.btnSave} onClick={handleSave} disabled={!editingCategory.name}>Save Category</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Categories
