import API_BASE_URL from '../config/api'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function Checkout() {
    const { items, getCartTotal, clearCart } = useCart()
    const { user, isLoggedIn, token } = useUser()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [settings, setSettings] = useState({ freeShippingEnabled: true, freeShippingThreshold: 149, shippingCost: 9.95 })
    const [promoCode, setPromoCode] = useState('')
    const [appliedPromo, setAppliedPromo] = useState(null)
    const [promoError, setPromoError] = useState('')
    const [promoLoading, setPromoLoading] = useState(false)
    const width = useWindowSize()
    const isMobile = width < 768

    // Pre-fill form with user data if logged in
    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', address: '', city: '', state: '', postcode: '', phone: '',
        paymentMethod: 'card'
    })

    // Pre-fill user data when logged in
    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || ''
            }))
        }
    }, [isLoggedIn, user])

    // Fetch settings
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => { if (data) setSettings(prev => ({ ...prev, ...data })) })
            .catch(console.error)
    }, [])

    // Calculate totals with custom shipping override
    const subtotal = getCartTotal()

    // Check if any item has custom shipping - if so, use the highest custom shipping cost
    const customShippingCosts = items.filter(item => item.customShipping).map(item => item.customShipping)
    const hasCustomShipping = customShippingCosts.length > 0
    const maxCustomShipping = hasCustomShipping ? Math.max(...customShippingCosts) : 0

    // If any product has custom shipping, that overrides default for whole order
    const shippingCost = hasCustomShipping
        ? maxCustomShipping  // Use highest custom shipping from products
        : (settings.freeShippingEnabled && subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost)

    const promoDiscount = appliedPromo
        ? (appliedPromo.discountType === 'percentage'
            ? subtotal * (appliedPromo.discountValue / 100)
            : appliedPromo.discountValue)
        : 0
    const totalAmount = subtotal + shippingCost - promoDiscount

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const applyPromoCode = async () => {
        if (!promoCode.trim()) return
        setPromoLoading(true)
        setPromoError('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/promo-codes/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode, orderTotal: subtotal })
            })
            const data = await response.json()

            if (response.ok && data.valid) {
                setAppliedPromo(data.promo)
                setPromoError('')
            } else {
                setPromoError(data.error || 'Invalid promo code')
                setAppliedPromo(null)
            }
        } catch (e) {
            setPromoError('Error validating code')
        }
        setPromoLoading(false)
    }

    const removePromo = () => {
        setAppliedPromo(null)
        setPromoCode('')
        setPromoError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const orderPayload = {
                items: items.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    salePrice: item.salePrice,
                    image: item.images?.[0] || item.image,
                    quantity: item.quantity,
                    customShipping: item.customShipping
                })),
                customer: { email: formData.email, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone },
                shipping: { address: formData.address, city: formData.city, state: formData.state, postcode: formData.postcode },
                subtotal, shippingCost, promoDiscount,
                promoCode: appliedPromo?.code || null,
                total: totalAmount
            }

            // Try Stripe checkout first
            const stripeRes = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            })

            if (stripeRes.ok) {
                const { url } = await stripeRes.json()
                if (url) {
                    window.location.href = url
                    return
                }
            }

            // Fallback: direct order creation (when Stripe not configured)
            const order = {
                ...orderPayload,
                customer: { ...orderPayload.customer, name: `${formData.firstName} ${formData.lastName}` },
                paymentMethod: formData.paymentMethod,
                status: 'pending'
            }
            const response = await fetch(`${API_BASE_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
            if (response.ok) {
                const data = await response.json()
                if (appliedPromo) {
                    await fetch(`${API_BASE_URL}/api/promo-codes/${appliedPromo.id}/use`, { method: 'POST' })
                }
                clearCart()
                navigate(`/checkout/success?order=${data.orderId || data.id}`)
            }
            else throw new Error('Order failed')
        } catch (error) { showToast('Error processing order. Please try again.', 'error') }
        finally { setLoading(false) }
    }

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', padding: isMobile ? '20px 0 100px' : '40px 0 60px' },
        container: { maxWidth: '1100px', margin: '0 auto', padding: '0 20px' },
        header: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '40px' },
        logo: { height: '50px' },
        steps: { display: 'flex', gap: isMobile ? '10px' : '30px' },
        step: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '12px' : '14px', color: '#999' },
        stepActive: { color: '#6B2346', fontWeight: '600' },
        stepNumber: { width: '28px', height: '28px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' },
        stepNumberActive: { background: '#6B2346', color: '#fff' },
        layout: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: '40px' },
        form: { background: '#fff', padding: isMobile ? '20px' : '30px', borderRadius: '16px', border: '1px solid #eee' },
        sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '600', color: '#222', marginBottom: '24px' },
        formGroup: { marginBottom: '20px' },
        formRow: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' },
        formRow3: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' },
        select: { width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '15px', background: '#fff' },
        paymentMethods: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
        paymentMethod: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '2px solid #eee', borderRadius: '12px', cursor: 'pointer' },
        paymentMethodSelected: { borderColor: '#6B2346', background: '#FCE8ED' },
        paymentRadio: { width: '20px', height: '20px', accentColor: '#6B2346' },
        paymentName: { fontSize: '15px', fontWeight: '600', color: '#222' },
        paymentDesc: { fontSize: '13px', color: '#666' },
        cardFields: { marginTop: '20px' },
        buttons: { display: 'flex', gap: '16px', marginTop: '30px' },
        btnBack: { padding: '14px 28px', background: 'transparent', color: '#6B2346', border: '2px solid #6B2346', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        btnNext: { flex: 1, padding: '16px 32px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
        sidebar: { background: '#fff', padding: isMobile ? '20px' : '30px', borderRadius: '16px', border: '1px solid #eee', height: 'fit-content', marginBottom: isMobile ? '80px' : 0 },
        sidebarTitle: { fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '600', color: '#222', marginBottom: '20px' },
        orderItems: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #eee' },
        orderItem: { display: 'flex', gap: '16px' },
        orderImage: { width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', position: 'relative' },
        orderQty: { position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', background: '#6B2346', color: '#fff', borderRadius: '50%', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        orderInfo: { flex: 1 },
        orderName: { fontSize: '14px', fontWeight: '500', color: '#222', marginBottom: '4px' },
        orderPrice: { fontSize: '15px', fontWeight: '700', color: '#6B2346' },
        promoSection: { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' },
        promoInput: { display: 'flex', gap: '10px' },
        promoField: { flex: 1, padding: '12px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', textTransform: 'uppercase' },
        promoBtn: { padding: '12px 18px', background: '#222', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
        promoSuccess: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F5E9', padding: '12px 16px', borderRadius: '8px', marginTop: '10px' },
        promoRemove: { background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: '12px' },
        promoError: { color: '#C62828', fontSize: '13px', marginTop: '8px' },
        totals: { display: 'flex', flexDirection: 'column', gap: '12px' },
        totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#555' },
        totalRowDiscount: { display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#2E7D32' },
        totalRowFinal: { display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700', color: '#222', paddingTop: '16px', borderTop: '2px solid #eee', marginTop: '8px' },
        freeShippingBadge: { background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
        customShippingBadge: { background: '#FFF3E0', color: '#E65100', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
        empty: { textAlign: 'center', padding: '80px 20px' },
        emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '12px' },
        emptyText: { fontSize: '16px', color: '#666', marginBottom: '30px' },
        btn: { display: 'inline-block', padding: '16px 40px', background: '#6B2346', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600' },
        loginRequired: { background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '60px auto', border: '1px solid #eee' }
    }

    // Require login before checkout
    if (!isLoggedIn) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.loginRequired}>
                        <h2 style={styles.emptyTitle}>Please Sign In</h2>
                        <p style={styles.emptyText}>You need to create an account or sign in before placing an order. This helps us track your orders and provide better support.</p>
                        <Link to="/account" style={styles.btn}>Sign In / Register</Link>
                        <Link to="/cart" style={{ display: 'block', marginTop: '20px', color: '#6B2346', textDecoration: 'none' }}>← Back to Cart</Link>
                    </div>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.empty}>
                        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
                        <p style={styles.emptyText}>Add some products before checking out.</p>
                        <Link to="/products" style={styles.btn}>Shop Now</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <Link to="/"><img src="/logo.png" alt="DecoraBake" style={styles.logo} /></Link>
                    <div style={styles.steps}>
                        <div style={{ ...styles.step, ...(step >= 1 ? styles.stepActive : {}) }}>
                            <span style={{ ...styles.stepNumber, ...(step >= 1 ? styles.stepNumberActive : {}) }}>1</span>
                            {!isMobile && 'Information'}
                        </div>
                        <div style={{ ...styles.step, ...(step >= 2 ? styles.stepActive : {}) }}>
                            <span style={{ ...styles.stepNumber, ...(step >= 2 ? styles.stepNumberActive : {}) }}>2</span>
                            {!isMobile && 'Payment'}
                        </div>
                    </div>
                </div>

                <div style={styles.layout}>
                    {/* Form */}
                    <form style={styles.form} onSubmit={handleSubmit}>
                        {step === 1 && (
                            <>
                                <h2 style={styles.sectionTitle}>Contact Information</h2>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} placeholder="your@email.com" required />
                                </div>

                                <h2 style={styles.sectionTitle}>Shipping Address</h2>
                                <div style={{ ...styles.formRow, marginBottom: '20px' }}>
                                    <div><label style={styles.label}>First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={styles.input} required /></div>
                                    <div><label style={styles.label}>Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={styles.input} required /></div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Street Address</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} style={styles.input} placeholder="123 Main Street" required />
                                </div>
                                <div style={{ ...styles.formRow3, marginBottom: '20px' }}>
                                    <div><label style={styles.label}>City</label><input type="text" name="city" value={formData.city} onChange={handleChange} style={styles.input} required /></div>
                                    <div><label style={styles.label}>State</label>
                                        <select name="state" value={formData.state} onChange={handleChange} style={styles.select} required>
                                            <option value="">Select</option><option value="NSW">NSW</option><option value="VIC">VIC</option><option value="QLD">QLD</option><option value="WA">WA</option><option value="SA">SA</option><option value="TAS">TAS</option><option value="ACT">ACT</option><option value="NT">NT</option>
                                        </select>
                                    </div>
                                    <div><label style={styles.label}>Postcode</label><input type="text" name="postcode" value={formData.postcode} onChange={handleChange} style={styles.input} maxLength="4" required /></div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Phone Number</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} placeholder="0412 345 678" required />
                                </div>
                                <button type="button" style={styles.btnNext} onClick={() => setStep(2)}>Continue to Payment</button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h2 style={styles.sectionTitle}>Payment Method</h2>
                                <div style={styles.paymentMethods}>
                                    {['card', 'afterpay', 'paypal'].map(method => (
                                        <label key={method} style={{ ...styles.paymentMethod, ...(formData.paymentMethod === method ? styles.paymentMethodSelected : {}) }}>
                                            <input type="radio" name="paymentMethod" value={method} checked={formData.paymentMethod === method} onChange={handleChange} style={styles.paymentRadio} />
                                            <div>
                                                <div style={styles.paymentName}>{method === 'card' ? 'Credit Card' : method === 'afterpay' ? 'Afterpay' : 'PayPal'}</div>
                                                {method === 'afterpay' && <div style={styles.paymentDesc}>4 payments of ${(totalAmount / 4).toFixed(2)}</div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div style={{ padding: '24px', background: '#F7F9FC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#635BFF"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" /></svg>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1f36' }}>Secure Payment with Stripe</div>
                                            <div style={{ fontSize: '13px', color: '#697386' }}>Your payment info is encrypted and secure</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map(name => (
                                            <span key={name} style={{ padding: '4px 10px', background: '#fff', borderRadius: '6px', fontSize: '12px', color: '#555', border: '1px solid #e0e0e0' }}>{name}</span>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                                        🔒 You'll be redirected to Stripe's secure checkout page to complete your payment.
                                    </p>
                                </div>

                                <div style={styles.buttons}>
                                    <button type="button" style={styles.btnBack} onClick={() => setStep(1)}>← Back</button>
                                    <button type="submit" style={styles.btnNext} disabled={loading}>
                                        {loading ? 'Redirecting to payment...' : `Pay $${totalAmount.toFixed(2)}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    {/* Sidebar */}
                    <div style={styles.sidebar}>
                        <h3 style={styles.sidebarTitle}>Order Summary</h3>
                        <div style={styles.orderItems}>
                            {items.map(item => {
                                const price = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price
                                return (
                                    <div key={item.id} style={styles.orderItem}>
                                        <div style={{ position: 'relative' }}>
                                            <img src={item.images?.[0] || item.image || '/hero-bg.png'} alt={item.name} style={styles.orderImage} onError={e => e.target.src = '/hero-bg.png'} />
                                            <span style={styles.orderQty}>{item.quantity}</span>
                                        </div>
                                        <div style={styles.orderInfo}>
                                            <div style={styles.orderName}>{item.name}</div>
                                            <div style={styles.orderPrice}>${(price * item.quantity).toFixed(2)}</div>
                                            {item.customShipping && <span style={styles.customShippingBadge}>+${item.customShipping} shipping</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Promo Code Section */}
                        <div style={styles.promoSection}>
                            <label style={styles.label}>Promo Code</label>
                            {appliedPromo ? (
                                <div style={styles.promoSuccess}>
                                    <span><strong>{appliedPromo.code}</strong> - {appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% off` : `$${appliedPromo.discountValue} off`}</span>
                                    <button style={styles.promoRemove} onClick={removePromo}>Remove</button>
                                </div>
                            ) : (
                                <>
                                    <div style={styles.promoInput}>
                                        <input type="text" style={styles.promoField} value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" />
                                        <button type="button" style={styles.promoBtn} onClick={applyPromoCode} disabled={promoLoading}>
                                            {promoLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {promoError && <div style={styles.promoError}>{promoError}</div>}
                                </>
                            )}
                        </div>

                        <div style={styles.totals}>
                            <div style={styles.totalRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div style={styles.totalRow}>
                                <span>Shipping</span>
                                <span>
                                    {hasCustomShipping ? (
                                        <span style={styles.customShippingBadge}>${shippingCost.toFixed(2)}</span>
                                    ) : shippingCost === 0 ? (
                                        <span style={styles.freeShippingBadge}>FREE</span>
                                    ) : `$${shippingCost.toFixed(2)}`}
                                </span>
                            </div>
                            {appliedPromo && (
                                <div style={styles.totalRowDiscount}>
                                    <span>Discount ({appliedPromo.code})</span>
                                    <span>-${promoDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={styles.totalRowFinal}><span>Total</span><span>${totalAmount.toFixed(2)} AUD</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout


