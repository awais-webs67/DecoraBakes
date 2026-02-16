import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function About() {
    const [page, setPage] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)

    useSEO({
        title: 'About Us',
        description: "Learn about DecoraBake - Australia's premier cake decorating supply store. Premium quality, fast shipping, expert support since 2020.",
        url: '/about'
    })

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE_URL}/api/pages/about`).then(r => r.json()).catch(() => null),
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
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #6B2346', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    // If custom content exists from admin
    if (page?.content) {
        return (
            <div style={{ minHeight: '100vh', background: '#fafafa' }}>
                <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '100px 20px 80px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff', marginBottom: '20px' }}>{page.title}</h1>
                    </div>
                </div>
                <div style={{ maxWidth: '900px', margin: '-40px auto 60px', padding: '0 20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '50px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize: '17px', lineHeight: '1.9', color: '#444' }} dangerouslySetInnerHTML={{ __html: page.content }} />
                    </div>
                </div>
            </div>
        )
    }

    // Default beautiful About page
    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '120px 20px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: '50px', marginBottom: '24px' }}>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500', letterSpacing: '1px' }}>ABOUT US</span>
                    </div>
                    <h1 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '28px' : '52px', fontWeight: '800', color: '#ffffff', marginBottom: '24px', lineHeight: '1.2' }}>
                        Australia's Premier Cake Decorating Supply Store
                    </h1>
                    <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto' }}>
                        We're passionate about helping bakers create beautiful, delicious works of art
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div style={{ background: '#fff', padding: '0 20px', marginTop: '-50px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', background: '#fff', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '24px' : '40px' }}>
                    {[
                        { num: '5,000+', label: 'Products' },
                        { num: '50,000+', label: 'Happy Customers' },
                        { num: '4.9/5', label: 'Customer Rating' },
                        { num: '24h', label: 'Fast Dispatch' }
                    ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: '10px' }}>
                            <div style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '24px' : '36px', fontWeight: '800', color: '#6B2346', marginBottom: '8px' }}>{s.num}</div>
                            <div style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Our Story */}
            <div style={{ padding: '100px 20px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: typeof window !== 'undefined' && window.innerWidth < 768 ? '30px' : '60px', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: '#6B2346', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Our Story</span>
                        <h2 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '28px' : '40px', fontWeight: '700', color: '#222', marginTop: '16px', marginBottom: '24px', lineHeight: '1.2' }}>
                            Born from a Passion for Baking Excellence
                        </h2>
                        <p style={{ fontSize: '17px', color: '#555', lineHeight: '1.9', marginBottom: '20px' }}>
                            Founded in 2020, {settings.siteName || 'DecoraBake'} started with a simple mission: to provide Australian bakers with access to the world's finest cake decorating supplies at affordable prices.
                        </p>
                        <p style={{ fontSize: '17px', color: '#555', lineHeight: '1.9', marginBottom: '20px' }}>
                            What began as a small online store has grown into Australia's most trusted destination for baking professionals and home enthusiasts alike. We carefully curate our collection from leading global manufacturers, ensuring every product meets our rigorous quality standards.
                        </p>
                        <p style={{ fontSize: '17px', color: '#555', lineHeight: '1.9' }}>
                            From premium fondant and edible decorations to professional-grade tools and equipment, we stock everything you need to bring your sweetest visions to life.
                        </p>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #FCE8ED 0%, #fff5f7 100%)', borderRadius: '24px', padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '30px' : '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '200px' : '400px' }}>
                        <div style={{ fontSize: '100px', marginBottom: '20px' }}>🎂</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#6B2346', textAlign: 'center' }}>Making Baking Beautiful</div>
                        <div style={{ fontSize: '16px', color: '#888', textAlign: 'center', marginTop: '8px' }}>Since 2020</div>
                    </div>
                </div>
            </div>

            {/* Why Choose Us */}
            <div style={{ background: '#fff', padding: '100px 20px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
                    <span style={{ color: '#6B2346', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Why Choose Us</span>
                    <h2 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '28px' : '40px', fontWeight: '700', color: '#222', marginTop: '16px', marginBottom: '40px' }}>
                        The {settings.siteName || 'DecoraBake'} Difference
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                        {[
                            { icon: '✨', title: 'Premium Quality', desc: 'We source only the finest products from trusted manufacturers worldwide, ensuring exceptional quality in every item.' },
                            { icon: '🚚', title: 'Fast Shipping', desc: 'Orders dispatched within 24 hours. Free shipping Australia-wide on orders over $149.' },
                            { icon: '💬', title: 'Expert Support', desc: 'Our team of passionate bakers is here to help with product advice, tips, and recommendations.' },
                            { icon: '🔄', title: '30-Day Returns', desc: "Not satisfied? Return any unused item within 30 days for a full refund. No questions asked." }
                        ].map((item, i) => (
                            <div key={i} style={{ background: '#fafafa', padding: '40px 30px', borderRadius: '20px', transition: 'all 0.3s' }}>
                                <div style={{ width: '80px', height: '80px', background: '#FCE8ED', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 24px' }}>{item.icon}</div>
                                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#222', marginBottom: '12px' }}>{item.title}</h3>
                                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.7' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '80px 20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '24px' : '36px', fontWeight: '700', color: '#ffffff', marginBottom: '16px' }}>Ready to Start Creating?</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', marginBottom: '32px' }}>Browse our collection of premium cake decorating supplies</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/products" style={{ display: 'inline-block', padding: '16px 40px', background: '#fff', color: '#6B2346', borderRadius: '50px', fontWeight: '600', textDecoration: 'none', fontSize: '16px' }}>
                        Shop Now
                    </Link>
                    <Link to="/contact" style={{ display: 'inline-block', padding: '16px 40px', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50px', fontWeight: '600', textDecoration: 'none', fontSize: '16px' }}>
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default About
