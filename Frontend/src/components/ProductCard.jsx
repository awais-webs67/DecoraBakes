import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function ProductCard({ product }) {
    const { addToCart, cartCount } = useCart()
    const [isHovered, setIsHovered] = useState(false)
    const [added, setAdded] = useState(false)
    const width = useWindowSize()
    const isMobile = width < 768

    const price = product.salePrice || product.price
    const originalPrice = product.salePrice ? product.price : null
    const mainImage = product.images?.[0] || product.image || '/hero-bg.png'

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product)
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
    }

    const styles = {
        card: {
            background: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #eee',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
            boxShadow: isHovered ? '0 15px 40px rgba(0,0,0,0.12)' : '0 2px 10px rgba(0,0,0,0.04)',
            position: 'relative'
        },
        imageWrapper: {
            position: 'relative',
            paddingTop: '100%',
            overflow: 'hidden',
            background: '#f8f8f8'
        },
        image: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.08)' : 'scale(1)'
        },
        badges: {
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 2
        },
        badge: {
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        badgeSale: { background: '#6B2346', color: '#fff' },
        badgeNew: { background: '#C9A865', color: '#fff' },
        badgeOutOfStock: { background: '#333', color: '#fff' },
        content: { padding: '16px' },
        name: {
            fontFamily: "'Poppins', sans-serif",
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: '600',
            color: '#222',
            marginBottom: '8px',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '40px'
        },
        priceRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
        price: { fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#6B2346' },
        originalPrice: { fontSize: '14px', color: '#999', textDecoration: 'line-through' },
        addToCart: {
            width: '100%',
            padding: '12px',
            background: added ? '#2E7D32' : '#6B2346',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
        },
        outOfStock: {
            width: '100%',
            padding: '12px',
            background: '#f5f5f5',
            color: '#888',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'not-allowed'
        }
    }

    const isOutOfStock = product.stock !== undefined && product.stock <= 0

    return (
        <Link
            to={`/product/${product.id}`}
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={styles.card}>
                <div style={styles.imageWrapper}>
                    <img
                        src={mainImage}
                        alt={product.name}
                        style={styles.image}
                        onError={(e) => e.target.src = '/hero-bg.png'}
                    />
                    <div style={styles.badges}>
                        {product.isNew && <span style={{ ...styles.badge, ...styles.badgeNew }}>New</span>}
                        {originalPrice && <span style={{ ...styles.badge, ...styles.badgeSale }}>Sale</span>}
                        {isOutOfStock && <span style={{ ...styles.badge, ...styles.badgeOutOfStock }}>Sold Out</span>}
                    </div>
                </div>
                <div style={styles.content}>
                    <h3 style={styles.name}>{product.name}</h3>
                    <div style={styles.priceRow}>
                        <span style={styles.price}>${price?.toFixed(2)}</span>
                        {originalPrice && <span style={styles.originalPrice}>${originalPrice?.toFixed(2)}</span>}
                    </div>
                    {isOutOfStock ? (
                        <button style={styles.outOfStock} disabled>Out of Stock</button>
                    ) : (
                        <button style={styles.addToCart} onClick={handleAddToCart}>
                            {added ? (
                                <>✓ Added!</>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Add to Cart
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default ProductCard

