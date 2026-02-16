import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import API_BASE_URL from '../config/api'

// Custom hook for responsive design
function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200
    })

    useEffect(() => {
        function handleResize() {
            setWindowSize({ width: window.innerWidth })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return windowSize
}

// Product card with proper image error handling and Add to Cart button
function ProductCard({ product, styles, isMobile }) {
    const [imgSrc, setImgSrc] = useState(product.image || product.images?.[0] || '/placeholder.svg')
    const [imgError, setImgError] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)
    const { addToCart } = useCart()
    const productId = product.id || product._id

    const handleImageError = () => {
        if (!imgError) {
            setImgError(true)
            setImgSrc('/placeholder.svg')
        }
    }

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product, 1)
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 1500)
    }

    if (!productId) return null

    return (
        <div style={styles.cardWrapper}>
            <Link to={`/product/${productId}`} style={{ textDecoration: 'none' }}>
                <div style={styles.card}>
                    <div style={styles.imageWrap}>
                        <img
                            src={imgSrc}
                            alt={product.name}
                            style={styles.image}
                            loading="lazy"
                            onError={handleImageError}
                        />
                        {product.isNew && <span style={styles.badgeNew}>New</span>}
                        {product.salePrice && <span style={styles.badgeSale}>Sale</span>}

                        {/* Quick Add to Cart Button */}
                        <button
                            style={styles.quickAddBtn}
                            onClick={handleAddToCart}
                            title="Add to Cart"
                        >
                            {addedToCart ? (
                                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4l-3.87 7H8.53L4.27 2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z" /></svg>
                            )}
                        </button>
                    </div>
                    <div style={styles.content}>
                        <p style={styles.category}>{product.category || 'Cake Supplies'}</p>
                        <h3 style={styles.name}>{product.name}</h3>
                        <div style={styles.priceRow}>
                            <span style={styles.price}>${product.salePrice || product.price}</span>
                            {product.salePrice && <span style={styles.oldPrice}>${product.price}</span>}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

function FeaturedProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { width } = useWindowSize()
    const isMobile = width < 576

    // Responsive grid columns
    const getGridColumns = () => {
        if (width < 576) return '1fr 1fr'
        if (width < 992) return 'repeat(3, 1fr)'
        return 'repeat(4, 1fr)'
    }

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/products?featured=true&limit=8`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const styles = {
        section: { padding: isMobile ? '40px 0' : '60px 0', background: '#f8f8f8' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        header: { textAlign: 'center', marginBottom: isMobile ? '30px' : '40px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '26px' : '32px', fontWeight: '600', color: '#222', marginBottom: '10px' },
        subtitle: { fontSize: isMobile ? '14px' : '15px', color: '#666' },
        grid: { display: 'grid', gridTemplateColumns: getGridColumns(), gap: isMobile ? '12px' : '20px' },
        cardWrapper: { position: 'relative' },
        card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', transition: 'all 0.3s ease', height: '100%' },
        imageWrap: { position: 'relative', paddingTop: '100%', background: '#f5f5f5', overflow: 'hidden' },
        image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
        badgeNew: { position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', fontSize: '10px', fontWeight: '700', borderRadius: '4px', textTransform: 'uppercase', background: '#6B2346', color: '#fff' },
        badgeSale: { position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', fontSize: '10px', fontWeight: '700', borderRadius: '4px', textTransform: 'uppercase', background: '#e53935', color: '#fff' },
        quickAddBtn: {
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '40px',
            height: '40px',
            background: '#6B2346',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s',
            opacity: 0.95
        },
        content: { padding: isMobile ? '12px' : '16px' },
        category: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
        name: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '13px' : '15px', fontWeight: '600', color: '#222', marginBottom: '8px', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
        priceRow: { display: 'flex', alignItems: 'baseline', gap: '8px' },
        price: { fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#6B2346' },
        oldPrice: { fontSize: '13px', color: '#999', textDecoration: 'line-through' },
        cta: { textAlign: 'center', marginTop: isMobile ? '30px' : '40px' },
        btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 24px' : '14px 36px', fontSize: isMobile ? '14px' : '15px', fontWeight: '600', borderRadius: '8px', background: '#6B2346', color: '#fff', textDecoration: 'none', border: 'none', cursor: 'pointer' },
        loading: { display: 'flex', justifyContent: 'center', padding: '60px 0' }
    }

    if (loading) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <h2 style={styles.title}>Featured Products</h2>
                    </div>
                    <div style={styles.loading}><p>Loading...</p></div>
                </div>
            </section>
        )
    }

    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Featured Products</h2>
                    <p style={styles.subtitle}>Handpicked favorites for your cake decorating needs</p>
                </div>

                <div style={styles.grid}>
                    {products.map(product => (
                        <ProductCard
                            key={product.id || product._id}
                            product={product}
                            styles={styles}
                            isMobile={isMobile}
                        />
                    ))}
                </div>

                <div style={styles.cta}>
                    <Link to="/products?featured=true" style={styles.btn}>
                        View All Featured
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default FeaturedProducts
