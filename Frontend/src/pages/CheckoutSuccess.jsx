import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { trackPurchase } from '../components/Analytics'
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

function CheckoutSuccess() {
    const [searchParams] = useSearchParams()
    const orderParam = searchParams.get('order')
    const sessionId = searchParams.get('session_id')
    const { clearCart } = useCart()
    const [orderId, setOrderId] = useState(orderParam)
    const [loading, setLoading] = useState(!!sessionId)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false)
    const width = useWindowSize()
    const isMobile = width < 768

    // Handle Stripe redirect — fetch order info from session
    useEffect(() => {
        if (sessionId) {
            clearCart()
            fetch(`${API_BASE_URL}/api/stripe/session/${sessionId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.orderId) setOrderId(data.orderId)
                    if (data.status === 'paid') {
                        setPaymentConfirmed(true)
                        // Fire purchase conversion tracking for ads
                        trackPurchase({
                            orderId: data.orderId,
                            total: data.amountTotal || 0,
                            items: data.items || []
                        })
                    }
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        } else if (orderParam) {
            clearCart()
            // Fire purchase tracking for direct orders too
            trackPurchase({ orderId: orderParam, total: 0, items: [] })
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
        card: { background: '#fff', borderRadius: '24px', padding: isMobile ? '40px 24px' : '60px 50px', textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' },
        iconWrapper: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #6B2346 0%, #C64977 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' },
        checkmark: { width: '50px', height: '50px', color: '#fff' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '34px', fontWeight: '700', color: '#222', marginBottom: '16px' },
        subtitle: { fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.6' },
        orderBox: { background: '#FCE8ED', borderRadius: '12px', padding: '20px', marginBottom: '30px' },
        orderLabel: { fontSize: '13px', color: '#6B2346', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
        orderId: { fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: '700', color: '#6B2346' },
        infoList: { textAlign: 'left', marginBottom: '35px' },
        infoItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#555' },
        infoIcon: { width: '40px', height: '40px', borderRadius: '10px', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        btnPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px 32px', background: '#6B2346', color: '#fff', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', marginBottom: '16px' },
        btnSecondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px 32px', background: 'transparent', color: '#6B2346', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', border: '2px solid #6B2346' },
        footer: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '13px', color: '#888' }
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={{ fontSize: '18px', color: '#666' }}>Confirming your payment...</div>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Success Icon */}
                <div style={styles.iconWrapper}>
                    <svg style={styles.checkmark} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>

                <h1 style={styles.title}>Order Confirmed!</h1>
                <p style={styles.subtitle}>Thank you for your purchase. We've received your order and will begin processing it right away.</p>

                {/* Payment Confirmed Badge */}
                {paymentConfirmed && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#059669', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        Payment confirmed via Stripe
                    </div>
                )}

                {/* Order ID */}
                {orderId && (
                    <div style={styles.orderBox}>
                        <div style={styles.orderLabel}>Order Number</div>
                        <div style={styles.orderId}>#{orderId}</div>
                    </div>
                )}

                {/* What's Next */}
                <div style={styles.infoList}>
                    <div style={styles.infoItem}>
                        <div style={styles.infoIcon}>
                            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#6B2346" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                        </div>
                        <span>A confirmation email has been sent to your inbox</span>
                    </div>
                    <div style={styles.infoItem}>
                        <div style={styles.infoIcon}>
                            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#6B2346" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
                        </div>
                        <span>Your order will be shipped within 1-2 business days</span>
                    </div>
                    <div style={styles.infoItem}>
                        <div style={styles.infoIcon}>
                            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#6B2346" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </div>
                        <span>Track your order in your account dashboard</span>
                    </div>
                </div>

                {/* Buttons */}
                <Link to="/products" style={styles.btnPrimary}>
                    Continue Shopping
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                </Link>
                <Link to="/account" style={styles.btnSecondary}>
                    View My Orders
                </Link>

                <div style={styles.footer}>
                    Need help? <a href="mailto:support@decorabake.com.au" style={{ color: '#6B2346' }}>Contact Support</a>
                </div>
            </div>
        </div>
    )
}

export default CheckoutSuccess


