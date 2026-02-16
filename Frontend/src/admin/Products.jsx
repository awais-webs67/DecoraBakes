import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect, useRef } from 'react'

function Products() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchProducts()
        fetch(`${API_BASE_URL}/api/categories`).then(r => r.json()).then(setCategories).catch(console.error)
    }, [])

    const fetchProducts = () => {
        fetch(`${API_BASE_URL}/api/products?limit=100`)
            .then(r => r.json())
            .then(data => { setProducts(data.products || data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleImageUpload = async (e) => {
        const files = e.target.files
        if (!files.length) return
        setUploading(true)

        const formData = new FormData()
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i])
        }

        try {
            const response = await adminApi.upload('/api/upload/multiple', formData)
            if (response.urls) {
                const currentImages = editingProduct.images || []
                const fullUrls = response.urls.map(url => url.startsWith('http') ? url : `${API_BASE_URL}${url}`)
                setEditingProduct({ ...editingProduct, images: [...currentImages, ...fullUrls] })
            }
        } catch (err) {
            console.error('Upload failed', err)
        }
        setUploading(false)
    }

    const removeImage = (index) => {
        const images = [...(editingProduct.images || [])]
        images.splice(index, 1)
        setEditingProduct({ ...editingProduct, images })
    }

    const addVariant = () => {
        const variants = editingProduct.variants || []
        setEditingProduct({ ...editingProduct, variants: [...variants, { name: '', price: '', stock: '' }] })
    }

    const updateVariant = (index, field, value) => {
        const variants = [...(editingProduct.variants || [])]
        variants[index] = { ...variants[index], [field]: value }
        setEditingProduct({ ...editingProduct, variants })
    }

    const removeVariant = (index) => {
        const variants = [...(editingProduct.variants || [])]
        variants.splice(index, 1)
        setEditingProduct({ ...editingProduct, variants })
    }

    const handleSave = async () => {
        const productId = editingProduct.id || editingProduct._id
        if (productId) {
            await adminApi.put(`/api/products/${productId}`, editingProduct)
        } else {
            await adminApi.post('/api/products', editingProduct)
        }
        setEditingProduct(null)
        fetchProducts()
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return
        await adminApi.delete(`/api/products/${id}`)
        fetchProducts()
    }

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchCategory = !filterCategory || p.categoryId === filterCategory
        return matchSearch && matchCategory
    })

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        addBtn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        filters: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
        searchInput: { flex: 1, minWidth: '200px', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px' },
        select: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minWidth: '150px' },
        table: { width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5' },
        th: { padding: '16px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', background: '#fafafa' },
        td: { padding: '16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333' },
        productImage: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: '#f5f5f5' },
        productName: { fontWeight: '600', color: '#222' },
        badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginRight: '4px' },
        badgeStock: { background: '#E8F5E9', color: '#2E7D32' },
        badgeOut: { background: '#FFEBEE', color: '#C62828' },
        badgeShipping: { background: '#FFF3E0', color: '#E65100' },
        actions: { display: 'flex', gap: '8px' },
        btn: { padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
        btnEdit: { background: '#E3F2FD', color: '#1565C0' },
        btnDelete: { background: '#FFEBEE', color: '#C62828' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px' },
        formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
        formGroup: { marginBottom: '20px' },
        formGroupFull: { gridColumn: '1 / -1', marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
        checkbox: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
        section: { background: '#f8f8f8', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
        sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '16px' },
        imageUpload: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
        imageThumb: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', position: 'relative' },
        imageRemove: { position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' },
        uploadBtn: { width: '80px', height: '80px', border: '2px dashed #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '24px', color: '#999' },
        variantRow: { display: 'grid', gridTemplateColumns: '1fr 100px 80px 40px', gap: '10px', marginBottom: '10px', alignItems: 'center' },
        variantInput: { padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' },
        removeBtn: { width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#FFEBEE', color: '#C62828', cursor: 'pointer' },
        hint: { fontSize: '12px', color: '#888', marginTop: '6px' },
        modalActions: { display: 'flex', gap: '12px', marginTop: '24px' },
        btnCancel: { flex: 1, padding: '14px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        btnSave: { flex: 1, padding: '14px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
    }

    const emptyProduct = { name: '', description: '', price: 0, salePrice: null, images: [], categoryId: '', stock: 100, isNew: false, isFeatured: false, customShipping: null, variants: [] }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Products ({products.length})</h1>
                <button style={styles.addBtn} onClick={() => setEditingProduct(emptyProduct)}>+ Add Product</button>
            </div>

            <div style={styles.filters}>
                <input type="text" style={styles.searchInput} placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <select style={styles.select} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>Price</th>
                            <th style={styles.th}>Stock</th>
                            <th style={styles.th}>Shipping</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => {
                            const productId = product.id || product._id
                            const category = categories.find(c => (c.id || c._id) === product.categoryId)
                            const mainImage = product.images?.[0] || product.image || '/hero-bg.png'
                            return (
                                <tr key={productId}>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={mainImage} alt={product.name} style={styles.productImage} onError={e => e.target.src = '/hero-bg.png'} />
                                            <div>
                                                <div style={styles.productName}>{product.name}</div>
                                                {product.variants?.length > 0 && <span style={{ fontSize: '12px', color: '#888' }}>{product.variants.length} variants</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{category?.name || '-'}</td>
                                    <td style={styles.td}>
                                        {product.salePrice ? (
                                            <><span style={{ textDecoration: 'line-through', color: '#999' }}>${product.price}</span> <strong style={{ color: '#6B2346' }}>${product.salePrice}</strong></>
                                        ) : (
                                            <strong>${product.price}</strong>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, ...((product.stock === undefined || product.stock > 0) ? styles.badgeStock : styles.badgeOut) }}>
                                            {(product.stock === undefined || product.stock > 0) ? `${product.stock || 'In Stock'}` : 'Out'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        {product.customShipping ? (
                                            <span style={{ ...styles.badge, ...styles.badgeShipping }}>${product.customShipping}</span>
                                        ) : (
                                            <span style={{ color: '#888' }}>Default</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actions}>
                                            <button style={{ ...styles.btn, ...styles.btnEdit }} onClick={() => setEditingProduct(product)}>Edit</button>
                                            <button style={{ ...styles.btn, ...styles.btnDelete }} onClick={() => handleDelete(productId)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {filteredProducts.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No products found</div>}

            {/* Edit Modal */}
            {editingProduct && (
                <div style={styles.modal} onClick={() => setEditingProduct(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>{editingProduct.id ? 'Edit Product' : 'Add New Product'}</h2>

                        {/* Images Section */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>📷 Product Images</div>
                            <div style={styles.imageUpload}>
                                {(editingProduct.images || []).map((img, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <img src={img} alt="" style={styles.imageThumb} onError={e => e.target.src = '/hero-bg.png'} />
                                        <button style={styles.imageRemove} onClick={() => removeImage(i)}>×</button>
                                    </div>
                                ))}
                                <div style={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                                    {uploading ? '...' : '+'}
                                </div>
                                <input type="file" ref={fileInputRef} multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                            </div>
                            <p style={styles.hint}>Click + to upload images. First image is the main image.</p>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Product Name *</label>
                                <input type="text" style={styles.input} value={editingProduct.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Category</label>
                                <select style={styles.input} value={editingProduct.categoryId || ''} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Stock Quantity</label>
                                <input type="number" style={styles.input} value={editingProduct.stock ?? 100} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} min="0" />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Regular Price ($)</label>
                                <input type="number" style={styles.input} value={editingProduct.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} step="0.01" />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sale Price ($)</label>
                                <input type="number" style={styles.input} value={editingProduct.salePrice || ''} onChange={e => setEditingProduct({ ...editingProduct, salePrice: e.target.value ? parseFloat(e.target.value) : null })} step="0.01" placeholder="Leave empty for no sale" />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Custom Shipping Cost ($)</label>
                                <input type="number" style={styles.input} value={editingProduct.customShipping || ''} onChange={e => setEditingProduct({ ...editingProduct, customShipping: e.target.value ? parseFloat(e.target.value) : null })} step="0.01" placeholder="Leave empty for default" />
                                <p style={styles.hint}>If set, this overrides default shipping for orders with this product</p>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Options</label>
                                <div style={styles.checkbox}>
                                    <input type="checkbox" id="isNew" checked={editingProduct.isNew || false} onChange={e => setEditingProduct({ ...editingProduct, isNew: e.target.checked })} />
                                    <label htmlFor="isNew">Mark as New</label>
                                </div>
                                <div style={styles.checkbox}>
                                    <input type="checkbox" id="isFeatured" checked={editingProduct.isFeatured || false} onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })} />
                                    <label htmlFor="isFeatured">Featured Product</label>
                                </div>
                            </div>

                            <div style={styles.formGroupFull}>
                                <label style={styles.label}>Description</label>
                                <textarea style={styles.textarea} value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>🎨 Product Variants (optional)</div>
                            {(editingProduct.variants || []).map((v, i) => (
                                <div key={i} style={styles.variantRow}>
                                    <input style={styles.variantInput} placeholder="Variant name (e.g. Large, Red)" value={v.name || ''} onChange={e => updateVariant(i, 'name', e.target.value)} />
                                    <input style={styles.variantInput} placeholder="Price" type="number" value={v.price || ''} onChange={e => updateVariant(i, 'price', e.target.value)} />
                                    <input style={styles.variantInput} placeholder="Stock" type="number" value={v.stock || ''} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                                    <button style={styles.removeBtn} onClick={() => removeVariant(i)}>×</button>
                                </div>
                            ))}
                            <button style={{ ...styles.btn, background: '#E3F2FD', color: '#1565C0' }} onClick={addVariant}>+ Add Variant</button>
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.btnCancel} onClick={() => setEditingProduct(null)}>Cancel</button>
                            <button style={styles.btnSave} onClick={handleSave}>Save Product</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Products


