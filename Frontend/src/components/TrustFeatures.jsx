import { useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function TrustFeatures() {
    const [features, setFeatures] = useState([])
    const width = useWindowSize()
    const isMobile = width < 576
    const isTablet = width >= 576 && width < 992

    const getGridColumns = () => {
        if (isMobile) return '1fr 1fr'  // 2 columns on mobile
        if (isTablet) return 'repeat(2, 1fr)'
        return 'repeat(4, 1fr)'
    }

    const defaultFeatures = [
        { id: 1, icon: 'shipping', title: 'Free Shipping', description: 'On orders over $149 Australia-wide' },
        { id: 2, icon: 'payment', title: 'Secure Payment', description: 'Multiple payment options available' },
        { id: 3, icon: 'returns', title: 'Easy Returns', description: '30-day hassle-free returns' },
        { id: 4, icon: 'quality', title: 'Premium Quality', description: 'Top brands & quality products' }
    ]

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/sections/trust-features`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setFeatures(data)
                else setFeatures(defaultFeatures)
            })
            .catch(() => setFeatures(defaultFeatures))
    }, [])

    const styles = {
        section: { background: '#fff', borderBottom: '1px solid #eee', padding: isMobile ? '20px 0' : '30px 0' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        grid: { display: 'grid', gridTemplateColumns: getGridColumns(), gap: isMobile ? '12px' : '20px' },
        feature: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '8px' : '16px',
            padding: isMobile ? '14px 10px' : '20px',
            background: '#f9f9f9',
            borderRadius: '12px',
            border: '1px solid #eee'
        },
        icon: {
            width: isMobile ? '40px' : '52px',
            height: isMobile ? '40px' : '52px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#6B2346',
            color: '#fff',
            borderRadius: '12px'
        },
        content: { flex: isMobile ? 'none' : 1 },
        title: {
            fontFamily: "'Poppins', sans-serif",
            fontSize: isMobile ? '11px' : '15px',
            fontWeight: '600',
            color: '#222',
            marginBottom: '2px'
        },
        desc: {
            fontSize: isMobile ? '9px' : '13px',
            color: '#777',
            margin: 0,
            display: isMobile ? 'none' : 'block'
        }
    }

    const getIcon = (iconName) => {
        const size = isMobile ? 20 : 26
        const icons = {
            shipping: <svg viewBox="0 0 24 24" width={size} height={size}><path fill="currentColor" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>,
            payment: <svg viewBox="0 0 24 24" width={size} height={size}><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>,
            returns: <svg viewBox="0 0 24 24" width={size} height={size}><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z" /></svg>,
            quality: <svg viewBox="0 0 24 24" width={size} height={size}><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
        }
        return icons[iconName] || icons.quality
    }

    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.grid}>
                    {features.map(f => (
                        <div key={f.id} style={styles.feature}>
                            <div style={styles.icon}>{getIcon(f.icon)}</div>
                            <div style={styles.content}>
                                <h3 style={styles.title}>{f.title}</h3>
                                <p style={styles.desc}>{f.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default TrustFeatures
