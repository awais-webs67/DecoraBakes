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

function Testimonials() {
    const [testimonials, setTestimonials] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const width = useWindowSize()
    const isMobile = width < 768

    const defaultTestimonials = [
        { id: 1, name: 'Sarah Mitchell', location: 'Sydney, NSW', rating: 5, text: 'Absolutely love the quality of supplies from DecoraBake! The sprinkles are vibrant and the fondant tools are professional grade.' },
        { id: 2, name: 'Emma Thompson', location: 'Melbourne, VIC', rating: 5, text: 'Fast shipping and excellent customer service. The cake toppers I ordered were exactly as pictured.' },
        { id: 3, name: 'Jessica Williams', location: 'Brisbane, QLD', rating: 5, text: 'Best cake decorating store in Australia! Great variety and reasonable prices.' }
    ]

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/sections/testimonials`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setTestimonials(data)
                else setTestimonials(defaultTestimonials)
            })
            .catch(() => setTestimonials(defaultTestimonials))
    }, [])

    useEffect(() => {
        if (testimonials.length > 1) {
            const interval = setInterval(() => setCurrentIndex(prev => (prev + 1) % testimonials.length), 5000)
            return () => clearInterval(interval)
        }
    }, [testimonials.length])

    const styles = {
        section: { padding: isMobile ? '40px 0' : '60px 0', background: '#f8f8f8' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        header: { textAlign: 'center', marginBottom: isMobile ? '30px' : '40px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '26px' : '32px', fontWeight: '600', color: '#222', marginBottom: '10px' },
        subtitle: { fontSize: isMobile ? '14px' : '15px', color: '#666' },
        slider: { position: 'relative', maxWidth: '750px', margin: '0 auto' },
        content: { position: 'relative', minHeight: isMobile ? '320px' : '280px' },
        testimonial: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: isMobile ? '24px' : '35px', background: '#fff', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', opacity: 0, transform: 'translateX(30px)', transition: 'all 0.4s ease', pointerEvents: 'none' },
        testimonialActive: { opacity: 1, transform: 'translateX(0)', pointerEvents: 'auto' },
        rating: { display: 'flex', gap: '4px', marginBottom: '20px' },
        star: { color: '#C9A865', fontSize: '18px' },
        text: { fontSize: isMobile ? '15px' : '17px', color: '#555', lineHeight: '1.8', marginBottom: isMobile ? '20px' : '28px', fontStyle: 'italic' },
        author: { display: 'flex', alignItems: 'center', gap: '16px' },
        avatar: { width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '50%', background: '#6B2346', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: isMobile ? '18px' : '22px' },
        name: { fontFamily: "'Poppins', sans-serif", fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: '#222', marginBottom: '4px' },
        location: { fontSize: isMobile ? '12px' : '13px', color: '#888' },
        dots: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: isMobile ? '25px' : '35px' },
        dot: { width: '12px', height: '12px', borderRadius: '50%', background: '#ddd', border: 'none', cursor: 'pointer' },
        dotActive: { background: '#6B2346' }
    }

    if (testimonials.length === 0) return null

    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>What Our Customers Say</h2>
                    <p style={styles.subtitle}>Join thousands of happy bakers across Australia</p>
                </div>
                <div style={styles.slider}>
                    <div style={styles.content}>
                        {testimonials.map((t, index) => (
                            <div key={t.id} style={{ ...styles.testimonial, ...(index === currentIndex ? styles.testimonialActive : {}) }}>
                                <div style={styles.rating}>{[...Array(5)].map((_, i) => <span key={i} style={styles.star}>★</span>)}</div>
                                <p style={styles.text}>"{t.text}"</p>
                                <div style={styles.author}>
                                    <div style={styles.avatar}>{t.name?.charAt(0) || 'U'}</div>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={styles.name}>{t.name}</p>
                                        <p style={styles.location}>{t.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={styles.dots}>
                        {testimonials.map((_, index) => (
                            <button key={index} style={{ ...styles.dot, ...(index === currentIndex ? styles.dotActive : {}) }} onClick={() => setCurrentIndex(index)} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Testimonials

