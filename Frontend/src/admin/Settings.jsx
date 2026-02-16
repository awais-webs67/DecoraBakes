import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

function Settings() {
    const [settings, setSettings] = useState({
        siteName: 'DecoraBake',
        announcementText: '🎂 Free Australia-Wide Shipping on Orders Over $149!',
        announcementEnabled: true,
        freeShippingEnabled: true,
        freeShippingThreshold: 149,
        shippingCost: 9.95,
        contactEmail: 'hello@decorabake.com.au',
        contactPhone: '1300 123 456',
        currency: 'AUD',
        socialFacebook: '',
        socialInstagram: '',
        socialPinterest: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => { if (data) setSettings(prev => ({ ...prev, ...data })); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await adminApi.put('/api/settings', settings)
            setMessage('Settings saved! Changes are now live on your website.')
            setTimeout(() => setMessage(''), 4000)
        } catch (e) {
            setMessage('Error saving settings')
        }
        setSaving(false)
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        saveBtn: { padding: '12px 28px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        message: { padding: '14px 20px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '10px', marginBottom: '24px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' },
        section: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5', marginBottom: '20px' },
        sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' },
        sectionIcon: { width: '28px', height: '28px', background: '#FCE8ED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        inputGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
        inputPrefix: { padding: '12px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: '14px', color: '#666' },
        inputWithPrefix: { flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: '0 10px 10px 0', fontSize: '14px' },
        textarea: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
        toggle: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
        toggleSwitch: { width: '50px', height: '28px', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' },
        toggleKnob: { width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
        hint: { fontSize: '12px', color: '#888', marginTop: '6px' },
        preview: { background: '#6B2346', color: '#fff', textAlign: 'center', padding: '12px 20px', borderRadius: '8px', marginTop: '16px', fontSize: '13px' }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Site Settings</h1>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>

            {message && <div style={styles.message}>✓ {message}</div>}

            {/* Announcement Bar */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📢</span>
                    Announcement Bar
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>This banner appears at the top of every page on your website.</p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.announcementEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('announcementEnabled', !settings.announcementEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.announcementEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Announcement Bar</span>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Announcement Text</label>
                    <textarea style={styles.textarea} value={settings.announcementText} onChange={e => handleChange('announcementText', e.target.value)} placeholder="Enter your announcement..." />
                    <p style={styles.hint}>Use emojis to make it stand out! 🎂 🎉 ✨</p>
                </div>

                {settings.announcementEnabled && (
                    <div style={styles.preview}>{settings.announcementText}</div>
                )}
            </div>

            {/* Shipping Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🚚</span>
                    Shipping Settings
                </h2>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.freeShippingEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('freeShippingEnabled', !settings.freeShippingEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.freeShippingEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Free Shipping</span>
                </div>

                <div style={styles.grid}>
                    {settings.freeShippingEnabled && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Free Shipping Threshold</label>
                            <div style={styles.inputGroup}>
                                <span style={styles.inputPrefix}>$</span>
                                <input type="number" style={styles.inputWithPrefix} value={settings.freeShippingThreshold} onChange={e => handleChange('freeShippingThreshold', parseFloat(e.target.value))} />
                            </div>
                            <p style={styles.hint}>Orders above this amount qualify for free shipping</p>
                        </div>
                    )}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Standard Shipping Cost</label>
                        <div style={styles.inputGroup}>
                            <span style={styles.inputPrefix}>$</span>
                            <input type="number" style={styles.inputWithPrefix} value={settings.shippingCost} onChange={e => handleChange('shippingCost', parseFloat(e.target.value))} step="0.01" />
                        </div>
                        <p style={styles.hint}>Charged when order doesn't qualify for free shipping</p>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>⚙️</span>
                    General
                </h2>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Header Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={settings.siteLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.siteLogo}` : (settings.siteLogo || '/logo.png')} alt="Header Logo" style={{ height: '40px', objectFit: 'contain', background: '#f5f5f5', padding: '6px', borderRadius: '6px' }} />
                            <label style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                                Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (file) {
                                        const formData = new FormData(); formData.append('file', file)
                                        try {
                                            const data = await adminApi.upload('/api/upload', formData)
                                            if (data.url) handleChange('siteLogo', data.url)
                                        } catch (err) { console.error('Upload failed', err) }
                                    }
                                }} />
                            </label>
                        </div>
                        <p style={styles.hint}>Appears in website header</p>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Footer Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={settings.footerLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.footerLogo}` : (settings.footerLogo || '/logo.png')} alt="Footer Logo" style={{ height: '40px', objectFit: 'contain', background: '#f5f5f5', padding: '6px', borderRadius: '6px' }} />
                            <label style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                                Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (file) {
                                        const formData = new FormData(); formData.append('file', file)
                                        try {
                                            const data = await adminApi.upload('/api/upload', formData)
                                            if (data.url) handleChange('footerLogo', data.url)
                                        } catch (err) { console.error('Upload failed', err) }
                                    }
                                }} />
                            </label>
                        </div>
                        <p style={styles.hint}>Appears in website footer</p>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Site Name</label>
                        <input type="text" style={styles.input} value={settings.siteName || ''} onChange={e => handleChange('siteName', e.target.value)} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Currency</label>
                        <select style={styles.input} value={settings.currency || 'AUD'} onChange={e => handleChange('currency', e.target.value)}>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="GBP">GBP - British Pound</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📞</span>
                    Contact Information
                </h2>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Contact Email</label>
                        <input type="email" style={styles.input} value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Contact Phone</label>
                        <input type="tel" style={styles.input} value={settings.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Social Media */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🔗</span>
                    Social Media
                </h2>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Facebook URL</label>
                        <input type="url" style={styles.input} value={settings.socialFacebook || ''} onChange={e => handleChange('socialFacebook', e.target.value)} placeholder="https://facebook.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Instagram URL</label>
                        <input type="url" style={styles.input} value={settings.socialInstagram || ''} onChange={e => handleChange('socialInstagram', e.target.value)} placeholder="https://instagram.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Pinterest URL</label>
                        <input type="url" style={styles.input} value={settings.socialPinterest || ''} onChange={e => handleChange('socialPinterest', e.target.value)} placeholder="https://pinterest.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Twitter / X URL</label>
                        <input type="url" style={styles.input} value={settings.socialTwitter || ''} onChange={e => handleChange('socialTwitter', e.target.value)} placeholder="https://x.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>YouTube URL</label>
                        <input type="url" style={styles.input} value={settings.socialYoutube || ''} onChange={e => handleChange('socialYoutube', e.target.value)} placeholder="https://youtube.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>TikTok URL</label>
                        <input type="url" style={styles.input} value={settings.socialTiktok || ''} onChange={e => handleChange('socialTiktok', e.target.value)} placeholder="https://tiktok.com/..." />
                    </div>
                </div>
            </div>

            {/* Chatbot Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🤖</span>
                    Chatbot Settings
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Configure your AI chatbot assistant. Gemini is primary, Longcat is backup.</p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.chatbotEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('chatbotEnabled', !settings.chatbotEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.chatbotEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable AI Chatbot</span>
                </div>

                {settings.chatbotEnabled && (
                    <>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Gemini API Key (Primary)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="password" style={{ ...styles.input, flex: 1 }} value={settings.geminiApiKey || ''} onChange={e => handleChange('geminiApiKey', e.target.value)} placeholder="AIza..." />
                                <button
                                    style={{ padding: '12px 16px', background: '#4285f4', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    onClick={async () => {
                                        const data = await adminApi.post('/api/chatbot/test', { apiType: 'gemini' })
                                        alert(data.success ? '✓ ' + data.message : '✗ ' + data.error)
                                    }}
                                >Test</button>
                            </div>
                            <p style={styles.hint}>Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Longcat API Key (Backup - OpenAI compatible)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="password" style={{ ...styles.input, flex: 1 }} value={settings.longcatApiKey || ''} onChange={e => handleChange('longcatApiKey', e.target.value)} placeholder="sk-..." />
                                <button
                                    style={{ padding: '12px 16px', background: '#10a37f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    onClick={async () => {
                                        const data = await adminApi.post('/api/chatbot/test', { apiType: 'longcat' })
                                        alert(data.success ? '✓ ' + data.message : '✗ ' + data.error)
                                    }}
                                >Test</button>
                            </div>
                            <p style={styles.hint}>If Gemini fails, Longcat will be used as fallback</p>
                        </div>
                    </>
                )}

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={styles.toggle}>
                        <div style={{ ...styles.toggleSwitch, background: settings.whatsappEnabled ? '#25D366' : '#ddd' }} onClick={() => handleChange('whatsappEnabled', !settings.whatsappEnabled)}>
                            <div style={{ ...styles.toggleKnob, left: settings.whatsappEnabled ? '25px' : '3px' }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable WhatsApp Button</span>
                    </div>

                    {settings.whatsappEnabled && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>WhatsApp Number (with country code)</label>
                            <input type="tel" style={styles.input} value={settings.whatsappNumber || ''} onChange={e => handleChange('whatsappNumber', e.target.value)} placeholder="61412345678" />
                            <p style={styles.hint}>Enter number without + or spaces (e.g., 61412345678 for Australia)</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📧</span>
                    Email Settings
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Configure SMTP to send order confirmations, welcome emails, and shipping notifications.</p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.emailEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('emailEnabled', !settings.emailEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.emailEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Email Notifications</span>
                </div>

                {settings.emailEnabled && (
                    <>
                        <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>SMTP Configuration</h3>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Host</label>
                                    <input type="text" style={styles.input} value={settings.smtpHost || ''} onChange={e => handleChange('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                                    <p style={styles.hint}>Gmail: smtp.gmail.com | Outlook: smtp.office365.com</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Port</label>
                                    <input type="number" style={styles.input} value={settings.smtpPort || 587} onChange={e => handleChange('smtpPort', parseInt(e.target.value))} placeholder="587" />
                                    <p style={styles.hint}>Usually 587 (TLS) or 465 (SSL)</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Username</label>
                                    <input type="text" style={styles.input} value={settings.smtpUser || ''} onChange={e => handleChange('smtpUser', e.target.value)} placeholder="your-email@gmail.com" />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Password / App Password</label>
                                    <input type="password" style={styles.input} value={settings.smtpPassword || ''} onChange={e => handleChange('smtpPassword', e.target.value)} placeholder="••••••••" />
                                    <p style={styles.hint}>For Gmail, use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">App Password</a></p>
                                </div>
                            </div>

                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>From Email</label>
                                    <input type="email" style={styles.input} value={settings.emailFrom || ''} onChange={e => handleChange('emailFrom', e.target.value)} placeholder="noreply@decorabake.com.au" />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>From Name</label>
                                    <input type="text" style={styles.input} value={settings.emailFromName || ''} onChange={e => handleChange('emailFromName', e.target.value)} placeholder="DecoraBake" />
                                </div>
                            </div>

                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Admin Email (for notifications)</label>
                                    <input type="email" style={styles.input} value={settings.adminEmail || ''} onChange={e => handleChange('adminEmail', e.target.value)} placeholder="admin@decorabake.com.au" />
                                    <p style={styles.hint}>Receives new order and refund request notifications</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Site URL</label>
                                    <input type="text" style={styles.input} value={settings.siteUrl || ''} onChange={e => handleChange('siteUrl', e.target.value)} placeholder="https://decorabake.com.au" />
                                    <p style={styles.hint}>Used for links in admin notification emails</p>
                                </div>
                            </div>

                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.smtpSecure ? '#6B2346' : '#ddd' }} onClick={() => handleChange('smtpSecure', !settings.smtpSecure)}>
                                    <div style={{ ...styles.toggleKnob, left: settings.smtpSecure ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>Use SSL/TLS (check if port is 465)</span>
                            </div>

                            <button
                                style={{ padding: '12px 24px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '10px' }}
                                onClick={async () => {
                                    // Save settings first
                                    await adminApi.put('/api/settings', settings)
                                    // Then test
                                    const data = await adminApi.post('/api/email/test', {})
                                    alert(data.success ? '✓ ' + data.message : '✗ ' + (data.error || 'Connection failed'))
                                }}
                            >
                                Test Connection
                            </button>
                        </div>

                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>Email Types</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.sendOrderConfirmation !== false ? '#6B2346' : '#ddd' }} onClick={() => handleChange('sendOrderConfirmation', !(settings.sendOrderConfirmation !== false))}>
                                    <div style={{ ...styles.toggleKnob, left: settings.sendOrderConfirmation !== false ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>📦 Order Confirmation - Send when customer places an order</span>
                            </div>
                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.sendWelcomeEmail !== false ? '#6B2346' : '#ddd' }} onClick={() => handleChange('sendWelcomeEmail', !(settings.sendWelcomeEmail !== false))}>
                                    <div style={{ ...styles.toggleKnob, left: settings.sendWelcomeEmail !== false ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>👋 Welcome Email - Send when new customer registers</span>
                            </div>
                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.sendShippingNotification !== false ? '#6B2346' : '#ddd' }} onClick={() => handleChange('sendShippingNotification', !(settings.sendShippingNotification !== false))}>
                                    <div style={{ ...styles.toggleKnob, left: settings.sendShippingNotification !== false ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>🚚 Shipping Notification - Send when order is marked as shipped</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Settings


