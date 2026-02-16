import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'

function Privacy() {
    const [page, setPage] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE_URL}/api/pages/privacy`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
        ]).then(([pageData, settingsData]) => {
            if (pageData && !pageData.error) setPage(pageData)
            setSettings(settingsData || {})
            setLoading(false)
        })
    }, [])

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
                    <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff', marginBottom: '16px' }}>{page.title}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Last updated: {new Date(page.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div style={{ maxWidth: '800px', margin: '-40px auto 60px', padding: '0 20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '50px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }} dangerouslySetInnerHTML={{ __html: page.content }} />
                </div>
            </div>
        )
    }

    // Default Privacy Policy
    const sections = [
        {
            icon: '📋',
            title: 'Information We Collect',
            content: [
                'Personal details you provide when creating an account (name, email, phone)',
                'Shipping and billing addresses for order fulfillment',
                'Payment information processed securely through Stripe',
                'Order history and product preferences',
                'Communications with our customer support team'
            ]
        },
        {
            icon: '🔧',
            title: 'How We Use Your Information',
            content: [
                'Process and fulfill your orders accurately and efficiently',
                'Send order confirmations, shipping updates, and delivery notifications',
                'Respond to your inquiries and provide customer support',
                'Send marketing communications (with your consent)',
                'Improve our website, products, and services',
                'Prevent fraud and ensure secure transactions'
            ]
        },
        {
            icon: '🤝',
            title: 'Information Sharing',
            content: [
                'Shipping carriers to deliver your orders',
                'Payment processors (Stripe) to handle transactions securely',
                'Analytics tools to understand website usage patterns',
                'Legal authorities when required by law',
                'We never sell your personal information to third parties'
            ]
        },
        {
            icon: '🔒',
            title: 'Data Security',
            content: [
                'SSL encryption for all data transmission',
                'Secure payment processing through PCI-compliant providers',
                'Regular security audits and vulnerability assessments',
                'Strict access controls and employee training',
                'Secure data storage with regular backups'
            ]
        },
        {
            icon: '🍪',
            title: 'Cookies & Tracking',
            content: [
                'Essential cookies for website functionality and shopping cart',
                'Analytics cookies to understand how you use our site',
                'Preference cookies to remember your settings',
                'Marketing cookies for relevant advertising (with consent)',
                'You can manage cookies through your browser settings'
            ]
        },
        {
            icon: '⚖️',
            title: 'Your Rights',
            content: [
                'Access the personal information we hold about you',
                'Request correction of inaccurate information',
                'Request deletion of your personal data',
                'Opt-out of marketing communications at any time',
                'Lodge a complaint with a data protection authority'
            ]
        }
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '100px 20px 80px', textAlign: 'center' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: '50px', marginBottom: '20px' }}>
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500', letterSpacing: '1px' }}>LEGAL</span>
                    </div>
                    <h1 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '32px' : '48px', fontWeight: '700', color: '#ffffff', marginBottom: '16px' }}>Privacy Policy</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                        Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '900px', margin: '-40px auto 80px', padding: '0 20px' }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '24px' : '50px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
                    {/* Intro */}
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '30px', marginBottom: '40px' }}>
                        <p style={{ fontSize: '17px', color: '#555', lineHeight: '1.9' }}>
                            At {settings.siteName || 'DecoraBake'}, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your data when you visit our website or make a purchase with us.
                        </p>
                    </div>

                    {/* Sections */}
                    {sections.map((section, i) => (
                        <div key={i} style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ width: '50px', height: '50px', background: '#FCE8ED', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    {section.icon}
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#222', margin: 0 }}>{section.title}</h2>
                            </div>
                            <ul style={{ margin: 0, padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '0 0 0 20px' : '0 0 0 66px', listStyle: 'none' }}>
                                {section.content.map((item, j) => (
                                    <li key={j} style={{ fontSize: '16px', color: '#555', lineHeight: '1.8', marginBottom: '12px', paddingLeft: '20px', position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 0, color: '#6B2346' }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact */}
                    <div style={{ background: '#FCE8ED', borderRadius: '16px', padding: '30px', marginTop: '40px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#6B2346', marginBottom: '12px' }}>Questions About Your Privacy?</h3>
                        <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.7', marginBottom: '16px' }}>
                            If you have any questions about this Privacy Policy or how we handle your personal information, please don't hesitate to contact us.
                        </p>
                        <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6B2346', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}>
                            Contact Us
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Privacy
