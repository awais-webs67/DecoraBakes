import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
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

function HeroSlider() {
    const [slides, setSlides] = useState([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const width = useWindowSize()
    const isMobile = width < 768

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/slider`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setSlides(data.filter(s => s.enabled))
            })
            .catch(console.error)
    }, [])

    const nextSlide = useCallback(() => {
        if (slides.length > 0) setCurrentSlide(prev => (prev + 1) % slides.length)
    }, [slides.length])

    const prevSlide = () => {
        if (slides.length > 0) setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
    }

    useEffect(() => {
        if (slides.length <= 1) return
        const interval = setInterval(nextSlide, 5000)
        return () => clearInterval(interval)
    }, [slides.length, nextSlide])

    const styles = {
        hero: {
            position: 'relative',
            minHeight: isMobile ? '400px' : '500px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center'
        },
        overlay: {
            position: 'absolute',
            inset: 0,
            background: isMobile
                ? 'rgba(107, 35, 70, 0.85)'
                : 'linear-gradient(to right, rgba(107, 35, 70, 0.9) 0%, rgba(107, 35, 70, 0.6) 50%, rgba(107, 35, 70, 0.3) 100%)'
        },
        container: { position: 'relative', zIndex: 2, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 20px' },
        content: { maxWidth: isMobile ? '100%' : '550px', color: '#fff', textAlign: isMobile ? 'center' : 'left' },
        badge: { display: 'inline-block', background: '#C9A865', color: '#4A1830', padding: '8px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '32px' : '48px', fontWeight: '700', lineHeight: '1.15', marginBottom: '20px', color: '#fff' },
        titleSpan: { color: '#F9D5E0' },
        text: { fontSize: isMobile ? '15px' : '17px', lineHeight: '1.7', marginBottom: '30px', opacity: 0.9 },
        buttons: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' },
        btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 24px' : '14px 32px', fontSize: '15px', fontWeight: '600', borderRadius: '8px', background: '#fff', color: '#6B2346', textDecoration: 'none', border: 'none' },
        btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 24px' : '14px 32px', fontSize: '15px', fontWeight: '600', borderRadius: '8px', background: 'transparent', color: '#fff', textDecoration: 'none', border: '2px solid #fff' },
        arrow: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: '#fff', display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(5px)' },
        arrowPrev: { left: '30px' },
        arrowNext: { right: '30px' },
        dots: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 },
        dot: { width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' },
        dotActive: { background: '#fff', width: '30px', borderRadius: '6px' }
    }

    const currentData = slides[currentSlide] || {}
    const bgImage = currentData.image || '/hero-bg.png'

    const renderHero = (data) => (
        <section style={{ ...styles.hero, backgroundImage: `url(${bgImage})` }}>
            <div style={styles.overlay}></div>
            <div style={styles.container}>
                <div style={styles.content}>
                    <span style={styles.badge}>{data.subtitle || "Australia's #1 Cake Store"}</span>
                    <h1 style={styles.title}>
                        {data.title ? (
                            <span dangerouslySetInnerHTML={{ __html: data.title }} />
                        ) : (
                            <>Beautiful Cakes Start With <span style={styles.titleSpan}>Quality Supplies</span></>
                        )}
                    </h1>
                    <p style={styles.text}>{data.description || 'Discover premium cake toppers, sprinkles, fondant tools, and everything you need to create stunning masterpieces.'}</p>
                    <div style={styles.buttons}>
                        <Link to={data.buttonLink || '/products'} style={styles.btnPrimary}>{data.buttonText || 'Shop Now'}</Link>
                        <Link to="/products?new=true" style={styles.btnSecondary}>New Arrivals</Link>
                    </div>
                </div>
            </div>

            {slides.length > 1 && (
                <>
                    <button style={{ ...styles.arrow, ...styles.arrowPrev }} onClick={prevSlide}>
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                    </button>
                    <button style={{ ...styles.arrow, ...styles.arrowNext }} onClick={nextSlide}>
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                    </button>
                    <div style={styles.dots}>
                        {slides.map((_, index) => (
                            <button key={index} style={{ ...styles.dot, ...(index === currentSlide ? styles.dotActive : {}) }} onClick={() => setCurrentSlide(index)} />
                        ))}
                    </div>
                </>
            )}
        </section>
    )

    return renderHero(currentData)
}

export default HeroSlider

