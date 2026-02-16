import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { useSEO } from '../hooks/useSEO'
import { trackViewProduct, trackAddToCart } from '../components/Analytics'
import RecentlyViewed, { trackRecentlyViewed } from '../components/RecentlyViewed'
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

function ProductDetail() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [relatedProducts, setRelatedProducts] = useState([])
    const [reviews, setReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 })
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [mainImgError, setMainImgError] = useState(false)
    const [zoomActive, setZoomActive] = useState(false)
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
    const imgContainerRef = useRef(null)
    const { addToCart } = useCart()
    const { showToast } = useToast()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const productId = product?.id || product?._id || id
    const wishlisted = isInWishlist(productId)
    const width = useWindowSize()
    const isMobile = width < 768

    useEffect(() => {
        setLoading(true)
        setMainImgError(false)
        setSelectedImage(0)
        fetch(`${API_BASE_URL}/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data)
                setLoading(false)
                if (data.categoryId) {
                    fetch(`${API_BASE_URL}/api/products?category=${data.categoryId}&limit=4&exclude=${id}`)
                        .then(res => res.json())
                        .then(related => setRelatedProducts(related.products || related || []))
                        .catch(console.error)
                }
            })
            .catch(() => setLoading(false))

        // Fetch reviews
        fetch(`${API_BASE_URL}/api/products/${id}/reviews`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(console.error)
    }, [id])

    // SEO structured data for product pages
    useSEO({
        title: product?.name,
        description: product?.description?.substring(0, 160),
        image: product?.images?.[0] || product?.image,
        url: `/product/${id}`,
        type: 'product',
        product: product ? {
            name: product.name,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice,
            images: product.images || [product.image],
            sku: product.sku,
            stock: product.stock,
            id: product.id || product._id,
            rating: reviews.averageRating,
            reviewCount: reviews.totalReviews
        } : null,
        breadcrumbs: product ? [
            { name: 'Home', url: '/' },
            { name: 'Products', url: '/products' },
            { name: product.name }
        ] : null
    })

    // Track product view + recently viewed
    useEffect(() => {
        if (product) {
            trackViewProduct(product)
            trackRecentlyViewed(product)
        }
    }, [product])

    const hasDiscount = product?.salePrice && product.salePrice > 0 && product.salePrice < product.price
    const displayPrice = hasDiscount ? product.salePrice : product?.price
    const discountPercent = hasDiscount ? Math.round((1 - product.salePrice / product.price) * 100) : 0

    const handleAddToCart = () => {
        addToCart(product, quantity)
        trackAddToCart(product, quantity)
        setQuantity(1)
        showToast(`${product.name} added to cart!`, 'success')
    }

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', paddingBottom: '60px' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px' : '40px 20px' },
        breadcrumb: { display: 'flex', gap: '8px', fontSize: '13px', color: '#888', marginBottom: '30px' },
        breadcrumbLink: { color: '#6B2346', textDecoration: 'none' },
        detail: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '30px' : '50px', background: '#fff', borderRadius: '16px', padding: isMobile ? '20px' : '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        gallery: {},
        mainImage: { position: 'relative', background: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' },
        image: { width: '100%', height: isMobile ? '300px' : '450px', objectFit: 'cover' },
        badge: { position: 'absolute', top: '16px', left: '16px', background: '#e53935', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
        thumbnails: { display: 'flex', gap: '12px' },
        thumbnail: { width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '2px solid transparent', cursor: 'pointer', background: 'none', padding: 0 },
        thumbnailActive: { border: '2px solid #6B2346' },
        thumbnailImg: { width: '100%', height: '100%', objectFit: 'cover' },
        info: {},
        category: { display: 'inline-block', fontSize: '12px', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textDecoration: 'none' },
        name: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '26px' : '32px', fontWeight: '600', color: '#222', marginBottom: '20px', lineHeight: '1.3' },
        priceRow: { display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '20px' },
        priceOriginal: { fontSize: '18px', color: '#999', textDecoration: 'line-through' },
        priceCurrent: { fontSize: '32px', fontWeight: '700', color: '#6B2346' },
        discount: { background: '#FCE8ED', color: '#6B2346', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' },
        stock: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
        stockAvailable: { display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '14px', fontWeight: '500' },
        stockOut: { color: '#e53935', fontSize: '14px', fontWeight: '500' },
        description: { margin: '24px 0', padding: '20px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' },
        descText: { fontSize: '15px', color: '#555', lineHeight: '1.8' },
        actions: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '16px', marginBottom: '30px' },
        quantitySelector: { display: 'flex', alignItems: 'center', border: '2px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' },
        quantityBtn: { width: '44px', height: '44px', border: 'none', background: '#f8f8f8', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        quantityValue: { width: '60px', textAlign: 'center', fontSize: '16px', fontWeight: '600' },
        addToCartBtn: { flex: isMobile ? 'none' : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px 32px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
        meta: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
        metaItem: { display: 'flex', gap: '8px', fontSize: '14px' },
        metaLabel: { color: '#888', minWidth: '60px' },
        metaValue: { color: '#333' },
        trust: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', padding: '20px', background: '#f8f8f8', borderRadius: '12px' },
        trustItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#555' },
        related: { marginTop: '60px' },
        relatedTitle: { fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '600', color: '#222', marginBottom: '30px', textAlign: 'center' },
        relatedGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : width < 992 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '24px' },
        card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' },
        cardImage: { width: '100%', height: '200px', objectFit: 'cover' },
        cardContent: { padding: '16px' },
        cardName: { fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' },
        cardPrice: { fontSize: '16px', fontWeight: '700', color: '#6B2346' },
        loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' },
        notFound: { textAlign: 'center', padding: '80px 20px' },
        notFoundTitle: { fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '20px' },
        btn: { display: 'inline-block', padding: '14px 32px', background: '#6B2346', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.loading}>
                        <p>Loading product...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.notFound}>
                        <h2 style={styles.notFoundTitle}>Product not found</h2>
                        <Link to="/products" style={styles.btn}>View All Products</Link>
                    </div>
                </div>
            </div>
        )
    }

    // Calculate images after product is loaded
    const images = product.images?.length > 0 ? product.images : [product.image || '/placeholder.svg']
    const currentImage = mainImgError ? '/placeholder.svg' : (images[selectedImage] || '/placeholder.svg')

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Breadcrumb */}
                <nav style={styles.breadcrumb}>
                    <Link to="/" style={styles.breadcrumbLink}>Home</Link>
                    <span>/</span>
                    <Link to="/products" style={styles.breadcrumbLink}>Products</Link>
                    <span>/</span>
                    <span>{product.name}</span>
                </nav>

                <div style={styles.detail}>
                    {/* Gallery */}
                    <div style={styles.gallery}>
                        <div
                            ref={imgContainerRef}
                            style={{ ...styles.mainImage, cursor: zoomActive ? 'zoom-out' : 'zoom-in', overflow: 'hidden' }}
                            onClick={() => setZoomActive(!zoomActive)}
                            onMouseMove={(e) => {
                                if (!zoomActive || !imgContainerRef.current) return
                                const rect = imgContainerRef.current.getBoundingClientRect()
                                const x = ((e.clientX - rect.left) / rect.width) * 100
                                const y = ((e.clientY - rect.top) / rect.height) * 100
                                setZoomPos({ x, y })
                            }}
                            onMouseLeave={() => setZoomActive(false)}
                        >
                            {hasDiscount && <span style={styles.badge}>{discountPercent}% OFF</span>}
                            <img
                                src={currentImage}
                                alt={product.name}
                                style={{
                                    ...styles.image,
                                    transform: zoomActive ? 'scale(2)' : 'scale(1)',
                                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                    transition: zoomActive ? 'none' : 'transform 0.3s ease'
                                }}
                                onError={() => !mainImgError && setMainImgError(true)}
                            />
                            {!zoomActive && (
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                    Click to zoom
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div style={styles.thumbnails}>
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        style={{ ...styles.thumbnail, ...(index === selectedImage ? styles.thumbnailActive : {}) }}
                                        onClick={() => { setSelectedImage(index); setMainImgError(false) }}
                                    >
                                        <img src={img || '/placeholder.svg'} alt="" style={styles.thumbnailImg} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={styles.info}>
                        {product.category && (
                            <Link to={`/category/${product.categorySlug}`} style={styles.category}>
                                {product.category}
                            </Link>
                        )}

                        <h1 style={styles.name}>{product.name}</h1>

                        <div style={styles.priceRow}>
                            {hasDiscount && <span style={styles.priceOriginal}>${product.price.toFixed(2)}</span>}
                            <span style={styles.priceCurrent}>${displayPrice?.toFixed(2)}</span>
                            {hasDiscount && <span style={styles.discount}>Save ${(product.price - product.salePrice).toFixed(2)}</span>}
                        </div>

                        <div style={styles.stock}>
                            {(product.stock === undefined || product.stock > 0) ? (
                                <>
                                    <span style={styles.stockAvailable}>
                                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                        In Stock {product.stock !== undefined && `(${product.stock} available)`}
                                    </span>
                                    {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3CD', color: '#856404', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginLeft: '8px', animation: 'pulse 2s infinite' }}>
                                            🔥 Only {product.stock} left — selling fast!
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span style={styles.stockOut}>Out of Stock</span>
                            )}
                        </div>

                        <div style={styles.description}>
                            <p style={styles.descText}>{product.description || 'Premium quality cake decorating supply. Perfect for professionals and hobbyists alike.'}</p>
                        </div>

                        {(product.stock === undefined || product.stock > 0) && (
                            <div style={styles.actions}>
                                <div style={styles.quantitySelector}>
                                    <button style={styles.quantityBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                                    <span style={styles.quantityValue}>{quantity}</span>
                                    <button style={styles.quantityBtn} onClick={() => setQuantity(q => Math.min(product.stock || 999, q + 1))} disabled={product.stock && quantity >= product.stock}>+</button>
                                </div>
                                <button style={styles.addToCartBtn} onClick={handleAddToCart}>
                                    <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                    Add to Cart
                                </button>
                                <button
                                    style={{ width: '50px', height: '50px', borderRadius: '12px', border: wishlisted ? '2px solid #EF4444' : '2px solid #ddd', background: wishlisted ? '#FEF2F2' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                                    onClick={() => { const added = toggleWishlist(product); showToast(added ? `${product.name} added to wishlist ♡` : `${product.name} removed from wishlist`, added ? 'success' : 'info') }}
                                    title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22">
                                        <path fill={wishlisted ? '#EF4444' : 'none'} stroke={wishlisted ? '#EF4444' : '#999'} strokeWidth="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <div style={styles.meta}>
                            {product.sku && (
                                <div style={styles.metaItem}>
                                    <span style={styles.metaLabel}>SKU:</span>
                                    <span style={styles.metaValue}>{product.sku}</span>
                                </div>
                            )}
                        </div>

                        <div style={styles.trust}>
                            <div style={styles.trustItem}>
                                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#6B2346" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" /></svg>
                                <span>Free Shipping on $149+</span>
                            </div>
                            <div style={styles.trustItem}>
                                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#6B2346" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
                                <span>Secure Checkout</span>
                            </div>
                            <div style={styles.trustItem}>
                                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#6B2346" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z" /></svg>
                                <span>30-Day Returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <section style={{ marginTop: '50px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        Customer Reviews
                        {reviews.totalReviews > 0 && (
                            <span style={{ fontSize: '16px', fontWeight: '400', color: '#666' }}>
                                ({reviews.averageRating} / 5 • {reviews.totalReviews} {reviews.totalReviews === 1 ? 'review' : 'reviews'})
                            </span>
                        )}
                    </h2>

                    {reviews.totalReviews > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {reviews.reviews.map(review => (
                                <div key={review._id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} style={{ color: star <= review.rating ? '#F59E0B' : '#E5E7EB', fontSize: '18px' }}>★</span>
                                                ))}
                                            </div>
                                            <strong style={{ fontSize: '15px' }}>{review.reviewerName}</strong>
                                            {review.isVerifiedPurchase && (
                                                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>✓ Verified Purchase</span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '13px', color: '#888' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {review.title && <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>{review.title}</h4>}
                                    <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>{review.review}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                            <p style={{ color: '#666', margin: 0 }}>No reviews yet. Be the first to review this product!</p>
                        </div>
                    )}
                </section>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section style={styles.related}>
                        <h2 style={styles.relatedTitle}>Related Products</h2>
                        <div style={styles.relatedGrid}>
                            {relatedProducts.map(p => {
                                const pId = p.id || p._id
                                if (!pId) return null
                                const pImg = p.image || p.images?.[0] || '/placeholder.svg'
                                return (
                                    <Link key={pId} to={`/product/${pId}`} style={{ textDecoration: 'none' }}>
                                        <div style={styles.card}>
                                            <img src={pImg} alt={p.name} style={styles.cardImage} />
                                            <div style={styles.cardContent}>
                                                <h3 style={styles.cardName}>{p.name}</h3>
                                                <span style={styles.cardPrice}>${p.salePrice || p.price}</span>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}
                {/* Social Sharing */}
                <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>Share:</span>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
                    </a>
                    <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E60023', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2Z" /></svg>
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', cursor: 'pointer' }} title="Copy link">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" /></svg>
                    </button>
                </div>

                {/* Recently Viewed */}
                <RecentlyViewed exclude={id} />
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
        </div>
    )
}

export default ProductDetail

