import { useState, useEffect } from 'react'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function Contact() {
    const [settings, setSettings] = useState({})
    const [page, setPage] = useState(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(true)

    useSEO({
        title: 'Contact Us',
        description: "Get in touch with DecoraBake. We're here to help with product questions, order support, and more. Typically respond within 24 hours.",
        url: '/contact'
    })

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE_URL}/api/pages/contact`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
        ]).then(([pageData, settingsData]) => {
            if (pageData && !pageData.error) setPage(pageData)
            setSettings(settingsData || {})
            setLoading(false)
        })
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setStatus('sending')
        setTimeout(() => {
            setStatus('success')
            setForm({ name: '', email: '', phone: '', subject: '', message: '' })
        }, 1500)
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #6B2346', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // If custom content from admin
    if (page?.content) {
        return (
            <div style={{ minHeight: '100vh', background: '#fafafa' }}>
                <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '100px 20px 80px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff', marginBottom: '20px' }}>{page.title}</h1>
                </div>
                <div style={{ maxWidth: '900px', margin: '-40px auto 60px', padding: '0 20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '50px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }} dangerouslySetInnerHTML={{ __html: page.content }} />
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '100px 20px 80px', textAlign: 'center' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: '50px', marginBottom: '20px' }}>
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500', letterSpacing: '1px' }}>GET IN TOUCH</span>
                    </div>
                    <h1 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '32px' : '48px', fontWeight: '700', color: '#ffffff', marginBottom: '20px' }}>Contact Us</h1>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7' }}>
                        Have a question? We'd love to hear from you. Our team typically responds within 24 hours.
                    </p>
                </div>
            </div>

            {/* Contact Cards */}
            <div style={{ maxWidth: '1100px', margin: '-40px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: typeof window !== 'undefined' && window.innerWidth < 768 ? '12px' : '20px' }}>
                    {/* Phone */}
                    <a href={`tel:${(settings.contactPhone || '1300123456').replace(/\s/g, '')}`} style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center', transition: 'transform 0.3s' }}>
                            <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' }}>Phone</h3>
                            <p style={{ fontSize: '16px', color: '#6B2346', fontWeight: '600' }}>{settings.contactPhone || '1300 123 456'}</p>
                        </div>
                    </a>

                    {/* Email */}
                    <a href={`mailto:${settings.contactEmail || 'hello@decorabake.com.au'}`} style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                            <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' }}>Email</h3>
                            <p style={{ fontSize: '16px', color: '#6B2346', fontWeight: '600' }}>{settings.contactEmail || 'hello@decorabake.com.au'}</p>
                        </div>
                    </a>

                    {/* Location */}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || 'Sydney, Australia')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                            <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' }}>Location</h3>
                            <p style={{ fontSize: '16px', color: '#6B2346', fontWeight: '600' }}>{settings.address || 'Sydney, Australia'}</p>
                        </div>
                    </a>

                    {/* Hours */}
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                        <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' }}>Hours</h3>
                        <p style={{ fontSize: '16px', color: '#6B2346', fontWeight: '600' }}>Mon-Fri: 9am-5pm AEST</p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: typeof window !== 'undefined' && window.innerWidth < 768 ? '30px' : '60px', alignItems: 'start' }}>
                    {/* Info */}
                    <div>
                        <h2 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '26px' : '36px', fontWeight: '700', color: '#222', marginBottom: '20px' }}>Send Us a Message</h2>
                        <p style={{ fontSize: '17px', color: '#666', lineHeight: '1.8', marginBottom: '30px' }}>
                            Whether you have a question about our products, need help with an order, or just want to say hello, we're here for you. Fill out the form and we'll get back to you as soon as possible.
                        </p>
                        <div style={{ background: '#FCE8ED', borderRadius: '16px', padding: '24px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#6B2346', marginBottom: '12px' }}>💡 Quick Tips</h4>
                            <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                <li>Include your order number for order-related inquiries</li>
                                <li>Be specific about the product you're asking about</li>
                                <li>We respond within 24 business hours</li>
                            </ul>
                        </div>
                    </div>

                    {/* Form */}
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
                        {status === 'success' && (
                            <div style={{ background: '#ECFDF5', color: '#059669', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="#059669"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                <span style={{ fontWeight: '500' }}>Message sent successfully! We'll be in touch soon.</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 500 ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Full Name *</label>
                                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box', transition: 'border-color 0.2s', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Email *</label>
                                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 500 ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Phone</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0400 000 000" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Subject *</label>
                                    <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Product inquiry" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Message *</label>
                                <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows="5" placeholder="How can we help you?" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box', resize: 'vertical' }} />
                            </div>
                            <button type="submit" disabled={status === 'sending'} style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                                {status === 'sending' ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div style={{ borderTop: '1px solid #eee' }}>
                <iframe
                    title="Location Map"
                    width="100%"
                    height="400"
                    frameBorder="0"
                    style={{ border: 0, display: 'block' }}
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(settings.address || 'Sydney, Australia')}`}
                    allowFullScreen
                />
            </div>
        </div>
    )
}

export default Contact
