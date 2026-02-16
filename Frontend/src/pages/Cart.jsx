import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSEO } from '../hooks/useSEO'
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

function Cart() {
    const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
    const width = useWindowSize()
    const isMobile = width < 768

    useSEO({
        title: 'Shopping Cart',
        description: 'Review your cart and checkout. Free shipping on orders over $149 Australia-wide.',
        url: '/cart'
    })

    // Fetch settings for dynamic shipping threshold
    const [settings, setSettings] = useState({ freeShippingEnabled: true, freeShippingThreshold: 149, shippingCost: 9.95 })

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => { if (data) setSettings(prev => ({ ...prev, ...data })) })
            .catch(console.error)
    }, [])

    const threshold = settings.freeShippingThreshold || 149
    const shippingCost = settings.shippingCost || 9.95
    const cartTotal = getCartTotal()
    const qualifiesForFreeShipping = settings.freeShippingEnabled && cartTotal >= threshold

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', padding: isMobile ? '20px 0 40px' : '40px 0 60px' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        header: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '30px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '36px', fontWeight: '600', color: '#222', margin: 0 },
        clearBtn: { padding: '10px 20px', background: 'transparent', color: '#e53935', border: '1px solid #e53935', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
        layout: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: '30px' },
        items: { display: 'flex', flexDirection: 'column', gap: '16px' },
        item: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '20px', background: '#fff', padding: isMobile ? '16px' : '20px', borderRadius: '16px', border: '1px solid #eee' },
        itemImage: { width: isMobile ? '100%' : '100px', height: isMobile ? '150px' : '100px', objectFit: 'cover', borderRadius: '12px' },
        itemInfo: { flex: 1 },
        itemName: { fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '600', color: '#222', marginBottom: '8px', textDecoration: 'none', display: 'block' },
        itemPrice: { fontSize: '18px', fontWeight: '700', color: '#6B2346' },
        itemOriginal: { fontSize: '14px', color: '#999', textDecoration: 'line-through', marginLeft: '8px' },
        quantity: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' },
        quantityBtn: { width: '36px', height: '36px', border: 'none', background: '#f8f8f8', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        quantityValue: { width: '50px', textAlign: 'center', fontSize: '15px', fontWeight: '600' },
        itemTotal: { fontWeight: '700', fontSize: '18px', color: '#222', minWidth: '80px', textAlign: 'right' },
        removeBtn: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#999', cursor: 'pointer' },
        summary: { background: '#fff', padding: isMobile ? '24px' : '30px', borderRadius: '16px', border: '1px solid #eee', height: 'fit-content', position: isMobile ? 'relative' : 'sticky', top: '100px' },
        summaryTitle: { fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '600', color: '#222', marginBottom: '24px' },
        summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '15px', color: '#555' },
        summaryTotal: { display: 'flex', justifyContent: 'space-between', padding: '20px 0', marginTop: '16px', borderTop: '2px solid #eee', fontSize: '20px', fontWeight: '700', color: '#222' },
        progress: { background: '#FCE8ED', padding: '16px', borderRadius: '12px', marginBottom: '20px' },
        progressText: { fontSize: '14px', color: '#6B2346', marginBottom: '10px' },
        progressBar: { height: '8px', background: '#fff', borderRadius: '4px', overflow: 'hidden' },
        progressFill: { height: '100%', background: '#6B2346', borderRadius: '4px', transition: 'width 0.3s' },
        checkoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px', background: '#6B2346', color: '#fff', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', marginBottom: '20px' },
        trust: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: '#666', marginBottom: '16px' },
        continueLink: { display: 'block', textAlign: 'center', color: '#6B2346', fontSize: '14px', textDecoration: 'none' },
        empty: { textAlign: 'center', padding: '80px 20px' },
        emptyIcon: { marginBottom: '24px', color: '#ccc' },
        emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '12px' },
        emptyText: { fontSize: '16px', color: '#666', marginBottom: '30px' },
        btn: { display: 'inline-block', padding: '16px 40px', background: '#6B2346', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '16px' }
    }

    if (items.length === 0) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}>
                            <svg viewBox="0 0 24 24" width="80" height="80"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                        </div>
                        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
                        <p style={styles.emptyText}>Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/products" style={styles.btn}>Start Shopping</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Shopping Cart</h1>
                    <button style={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
                </div>

                <div style={styles.layout}>
                    <div style={styles.items}>
                        {items.map(item => {
                            const price = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price
                            return (
                                <div key={item.id} style={styles.item}>
                                    <img src={item.image || item.images?.[0] || '/placeholder.svg'} alt={item.name} style={styles.itemImage} loading="lazy" onError={e => e.target.src = '/placeholder.svg'} />
                                    <div style={styles.itemInfo}>
                                        <Link to={`/product/${item.id}`} style={styles.itemName}>{item.name}</Link>
                                        <div>
                                            <span style={styles.itemPrice}>${price?.toFixed(2)}</span>
                                            {item.salePrice && item.salePrice < item.price && <span style={styles.itemOriginal}>${item.price.toFixed(2)}</span>}
                                        </div>
                                    </div>
                                    <div style={styles.quantity}>
                                        <button style={styles.quantityBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                                        <span style={styles.quantityValue}>{item.quantity}</span>
                                        <button style={styles.quantityBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>
                                    <div style={styles.itemTotal}>${(price * item.quantity).toFixed(2)}</div>
                                    <button style={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                                        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    <div style={styles.summary}>
                        <h3 style={styles.summaryTitle}>Order Summary</h3>
                        <div style={styles.summaryRow}><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
                        <div style={styles.summaryRow}>
                            <span>Shipping</span>
                            <span>{qualifiesForFreeShipping ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                        </div>

                        {settings.freeShippingEnabled && !qualifiesForFreeShipping && (
                            <div style={styles.progress}>
                                <div style={styles.progressText}>Add <strong>${(threshold - cartTotal).toFixed(2)}</strong> more for free shipping!</div>
                                <div style={styles.progressBar}>
                                    <div style={{ ...styles.progressFill, width: `${Math.min(100, (cartTotal / threshold) * 100)}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div style={styles.summaryTotal}>
                            <span>Total</span>
                            <span>${(cartTotal + (qualifiesForFreeShipping ? 0 : shippingCost)).toFixed(2)} AUD</span>
                        </div>
                        <Link to="/checkout" style={styles.checkoutBtn}>Proceed to Checkout</Link>
                        <div style={styles.trust}>
                            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#6B2346" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
                            <span>Secure Checkout</span>
                        </div>
                        <Link to="/products" style={styles.continueLink}>← Continue Shopping</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart
