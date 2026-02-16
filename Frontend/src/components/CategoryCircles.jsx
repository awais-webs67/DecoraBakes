import { useState, useEffect } from 'react'
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

function CategoryCircles() {
    const [categories, setCategories] = useState([])
    const width = useWindowSize()

    useEffect(() => {
        // Only fetch categories marked as showOnHome in admin settings
        fetch(`${API_BASE_URL}/api/categories?showOnHome=true`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setCategories(data.slice(0, 6)) })
            .catch(console.error)
    }, [])

    const styles = {
        section: { padding: width < 768 ? '40px 0' : '60px 0', background: '#fff' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        header: { textAlign: 'center', marginBottom: width < 768 ? '30px' : '40px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: width < 768 ? '26px' : '32px', fontWeight: '600', color: '#222', marginBottom: '10px' },
        subtitle: { fontSize: width < 768 ? '14px' : '15px', color: '#666' },
        grid: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: width < 768 ? '20px' : '35px' },
        circle: { display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', width: width < 768 ? '100px' : '140px' },
        imageWrap: { width: width < 768 ? '80px' : '110px', height: width < 768 ? '80px' : '110px', borderRadius: '50%', overflow: 'hidden', marginBottom: '14px', border: '4px solid #F9D5E0', background: '#f5f5f5' },
        image: { width: '100%', height: '100%', objectFit: 'cover' },
        name: { fontFamily: "'Poppins', sans-serif", fontSize: width < 768 ? '12px' : '14px', fontWeight: '600', color: '#222', textAlign: 'center', marginBottom: '4px' },
        count: { fontSize: width < 768 ? '11px' : '12px', color: '#888' },
        cta: { textAlign: 'center', marginTop: '40px' },
        btn: { display: 'inline-flex', padding: '12px 28px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', background: '#fff', color: '#6B2346', border: '2px solid #6B2346', textDecoration: 'none' }
    }

    if (categories.length === 0) return null

    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Shop by Category</h2>
                    <p style={styles.subtitle}>Find exactly what you need</p>
                </div>
                <div style={styles.grid}>
                    {categories.map(cat => (
                        <Link to={`/category/${cat.slug}`} key={cat.id} style={styles.circle}>
                            <div style={styles.imageWrap}>
                                <img src={cat.image || '/hero-bg.png'} alt={cat.name} style={styles.image} loading="lazy" onError={e => e.target.src = '/hero-bg.png'} />
                            </div>
                            <span style={styles.name}>{cat.name}</span>
                            <span style={styles.count}>{cat.productCount || 0} Products</span>
                        </Link>
                    ))}
                </div>
                <div style={styles.cta}>
                    <Link to="/products" style={styles.btn}>View All Categories</Link>
                </div>
            </div>
        </section>
    )
}

export default CategoryCircles

