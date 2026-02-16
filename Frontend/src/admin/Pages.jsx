import { useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'

function Pages() {
    const [pages, setPages] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [tab, setTab] = useState('pages')
    const [form, setForm] = useState({ slug: '', title: '', content: '', type: 'page', isPublished: true, excerpt: '', featuredImage: '' })
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => { fetchPages() }, [])

    const fetchPages = () => {
        adminApi.get('/api/admin/pages')
            .then(data => { setPages(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editing) {
                await adminApi.put(`/api/admin/pages/${editing}`, form)
            } else {
                await adminApi.post('/api/admin/pages', form)
            }
            setMessage(editing ? '✓ Content saved successfully!' : '✓ Created successfully!')
            resetForm()
            fetchPages()
            setTimeout(() => setMessage(''), 4000)
        } catch (err) { setMessage('Error saving') }
    }

    const resetForm = () => {
        setEditing(null)
        setForm({ slug: '', title: '', content: '', type: tab === 'blog' ? 'blog' : 'page', isPublished: true, excerpt: '', featuredImage: '' })
    }

    const handleEdit = (page) => {
        setEditing(page._id)
        setTab(page.type === 'blog' ? 'blog' : 'pages')
        setForm({
            slug: page.slug,
            title: page.title,
            content: page.content || '',
            type: page.type,
            isPublished: page.isPublished,
            excerpt: page.excerpt || '',
            featuredImage: page.featuredImage || ''
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this permanently?')) return
        await adminApi.delete(`/api/admin/pages/${id}`)
        fetchPages()
        setMessage('✓ Deleted successfully')
        setTimeout(() => setMessage(''), 3000)
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append('image', file)
        try {
            const data = await adminApi.upload('/api/upload', formData)
            if (data.url) setForm({ ...form, featuredImage: data.url })
        } catch (err) { console.error('Upload failed') }
        setUploading(false)
    }

    const quickTemplate = (type) => {
        if (type === 'about') {
            return `<h2>Our Story</h2>
<p>Founded in 2020, we started with a simple mission: to provide the finest cake decorating supplies at affordable prices.</p>

<h2>Our Mission</h2>
<p>We believe every baker deserves access to quality tools and ingredients. That's why we carefully curate our collection from trusted manufacturers worldwide.</p>

<h2>Why Choose Us</h2>
<ul>
  <li>Premium quality products</li>
  <li>Fast Australia-wide shipping</li>
  <li>Expert customer support</li>
  <li>30-day satisfaction guarantee</li>
</ul>`
        }
        if (type === 'contact') {
            return `<p>We'd love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello.</p>

<h3>Customer Service Hours</h3>
<p>Monday - Friday: 9am - 5pm AEST<br>Saturday - Sunday: Closed</p>

<h3>Response Time</h3>
<p>We typically respond to all inquiries within 24 business hours.</p>`
        }
        if (type === 'privacy') {
            return `<h2>Information We Collect</h2>
<p>We collect information you provide when creating an account, making a purchase, or contacting us.</p>

<h2>How We Use Your Information</h2>
<p>We use your information to process orders, send updates, and improve our services. We never sell your data.</p>

<h2>Data Security</h2>
<p>We implement industry-standard security measures including SSL encryption and secure payment processing.</p>

<h2>Your Rights</h2>
<p>You have the right to access, correct, or delete your personal information at any time.</p>`
        }
        return ''
    }

    const filteredPages = pages.filter(p => tab === 'blog' ? p.type === 'blog' : p.type === 'page')

    if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>📄 Pages & Blog</h1>
                    <p style={{ fontSize: '14px', color: '#888' }}>Manage your website content and blog posts</p>
                </div>
            </div>

            {message && (
                <div style={{ padding: '14px 20px', background: message.includes('Error') ? '#FEE2E2' : '#ECFDF5', color: message.includes('Error') ? '#DC2626' : '#059669', borderRadius: '10px', marginBottom: '20px', fontWeight: '500' }}>
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button onClick={() => { setTab('pages'); resetForm() }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: tab === 'pages' ? '#6B2346' : '#f0f0f0', color: tab === 'pages' ? '#fff' : '#555' }}>
                    📑 Pages
                </button>
                <button onClick={() => { setTab('blog'); setForm({ ...form, type: 'blog' }); setEditing(null) }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: tab === 'blog' ? '#6B2346' : '#f0f0f0', color: tab === 'blog' ? '#fff' : '#555' }}>
                    ✍️ Blog Posts
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '24px' }}>
                {/* List */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                            {tab === 'pages' ? 'Website Pages' : 'Blog Posts'}
                        </h3>
                        <span style={{ fontSize: '13px', color: '#888' }}>{filteredPages.length} items</span>
                    </div>

                    {tab === 'pages' && !filteredPages.find(p => ['about', 'contact', 'privacy'].includes(p.slug)) && (
                        <div style={{ background: '#FEF3C7', padding: '16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#92400E' }}>
                            <strong>💡 Tip:</strong> Create pages with slugs "about", "contact", or "privacy" to customize their content. Use the quick templates below!
                        </div>
                    )}

                    {filteredPages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
                            <div style={{ fontSize: '40px', marginBottom: '16px' }}>{tab === 'blog' ? '✍️' : '📑'}</div>
                            <p style={{ marginBottom: '8px' }}>No {tab === 'blog' ? 'blog posts' : 'pages'} yet</p>
                            <p style={{ fontSize: '13px' }}>Create your first one using the form →</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredPages.map(page => (
                                <div key={page._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#fafafa', borderRadius: '12px', border: editing === page._id ? '2px solid #6B2346' : '1px solid transparent' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '15px' }}>{page.title}</strong>
                                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: page.isPublished ? '#ECFDF5' : '#FEF3C7', color: page.isPublished ? '#059669' : '#D97706' }}>
                                                {page.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                        <code style={{ fontSize: '12px', color: '#888', background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>/{page.slug}</code>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(page)} style={{ padding: '8px 16px', background: '#E0F2FE', color: '#0369A1', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(page._id)} style={{ padding: '8px 16px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e5e5' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                        {editing ? `✏️ Edit ${tab === 'blog' ? 'Blog Post' : 'Page'}` : `➕ New ${tab === 'blog' ? 'Blog Post' : 'Page'}`}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        {/* Quick Templates for Pages */}
                        {tab === 'pages' && !editing && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Quick Start Templates</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {[
                                        { slug: 'about', title: 'About Us', icon: '👋' },
                                        { slug: 'contact', title: 'Contact', icon: '📞' },
                                        { slug: 'privacy', title: 'Privacy Policy', icon: '🔒' }
                                    ].map(t => (
                                        <button
                                            key={t.slug}
                                            type="button"
                                            onClick={() => setForm({ ...form, slug: t.slug, title: t.title, content: quickTemplate(t.slug), type: 'page' })}
                                            style={{ padding: '8px 16px', background: '#f5f5f5', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                            {t.icon} {t.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }}>URL Slug *</label>
                            <input
                                type="text"
                                value={form.slug}
                                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                placeholder={tab === 'pages' ? 'about, contact, privacy' : 'my-blog-post'}
                                required
                                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>URL: /{form.slug || 'example'}</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }}>Title *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Page Title"
                                required
                                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        {tab === 'blog' && (
                            <>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }}>Excerpt</label>
                                    <input
                                        type="text"
                                        value={form.excerpt}
                                        onChange={e => setForm({ ...form, excerpt: e.target.value })}
                                        placeholder="Short description for blog listing"
                                        style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }}>Featured Image</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {form.featuredImage && (
                                            <img src={form.featuredImage.startsWith('/uploads') ? `${API_BASE_URL}${form.featuredImage}` : form.featuredImage} alt="Preview" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                        )}
                                        <label style={{ padding: '10px 20px', background: '#f5f5f5', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                            {uploading ? 'Uploading...' : 'Upload Image'}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }}>Content (HTML)</label>
                            <textarea
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                placeholder={`<h2>Section Title</h2>
<p>Your content paragraph here.</p>
<ul>
  <li>List item</li>
</ul>`}
                                rows="12"
                                style={{ width: '100%', padding: '14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>Use HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a href=""&gt;</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <input type="checkbox" id="published" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                            <label htmlFor="published" style={{ fontSize: '14px', color: '#333' }}>Published (visible on website)</label>
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                            {editing ? 'Save Changes' : `Create ${tab === 'blog' ? 'Blog Post' : 'Page'}`}
                        </button>

                        {editing && (
                            <button type="button" onClick={resetForm} style={{ width: '100%', padding: '12px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '10px', fontWeight: '500', cursor: 'pointer', marginTop: '10px' }}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Pages
