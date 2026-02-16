import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'
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

function Account() {
    const { user, isLoggedIn, login, register, logout, updateProfile, getUserOrders, token } = useUser()
    const { items, getCartTotal, getCartCount } = useCart()
    const [activeTab, setActiveTab] = useState('orders')
    const [authTab, setAuthTab] = useState('login')
    const [orders, setOrders] = useState([])
    const [refunds, setRefunds] = useState([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const width = useWindowSize()
    const isMobile = width < 768

    // Order details modal state
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [editAddressMode, setEditAddressMode] = useState(false)
    const [addressForm, setAddressForm] = useState({ address: '', city: '', state: '', postcode: '' })
    const [refundReason, setRefundReason] = useState('')
    const [showRefundForm, setShowRefundForm] = useState(false)

    // Chat support state
    const [chats, setChats] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [chatMessage, setChatMessage] = useState('')
    const [products, setProducts] = useState([])
    const [showProductPicker, setShowProductPicker] = useState(false)
    const [productSearch, setProductSearch] = useState('')
    const [unreadChats, setUnreadChats] = useState(0)
    const [pickerTab, setPickerTab] = useState('history') // 'history' or 'all'
    const messagesEndRef = useRef(null)

    const [loginData, setLoginData] = useState({ email: '', password: '' })
    const [registerData, setRegisterData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
    const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' })
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

    // Load user data and orders from backend
    useEffect(() => {
        if (user) {
            setProfileData({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' })
            getUserOrders().then(setOrders)
            // Fetch refunds
            fetch(`${API_BASE_URL}/api/refunds/customer/${user.email}`)
                .then(r => r.json())
                .then(setRefunds)
                .catch(() => { })
            // Fetch chats
            fetchChats()
            // Fetch products for sharing
            fetch(`${API_BASE_URL}/api/products`)
                .then(r => r.json())
                .then(setProducts)
                .catch(() => { })
            // Poll for new messages
            const interval = setInterval(fetchChats, 5000)
            return () => clearInterval(interval)
        }
    }, [user])

    const fetchChats = async () => {
        if (!user?.email) return
        try {
            const res = await fetch(`${API_BASE_URL}/api/support-chats/customer/${user.email}`)
            const data = await res.json()
            setChats(data || [])
            const unread = data.reduce((sum, c) => sum + (c.unreadCustomer || 0), 0)
            setUnreadChats(unread)
            // Update selected chat if it exists
            if (selectedChat) {
                const updated = data.find(c => c.id === selectedChat.id)
                if (updated) setSelectedChat(updated)
            }
        } catch (err) { }
    }

    const createNewChat = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/support-chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
                    subject: 'Support Request'
                })
            })
            const data = await res.json()
            setSelectedChat(data)
            fetchChats()
        } catch (err) {
            setError('Failed to create chat')
        }
    }

    const sendChatMessage = async (messageType = 'text', attachment = null) => {
        if (messageType === 'text' && !chatMessage.trim()) return
        try {
            await fetch(`${API_BASE_URL}/api/support-chats/${selectedChat.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: 'customer', message: chatMessage, messageType, attachment })
            })
            setChatMessage('')
            setShowProductPicker(false)
            fetchChats()
        } catch (err) {
            setError('Failed to send message')
        }
    }

    // Get ALL items from customer's order history (with full details including qty)
    const getOrderHistoryItems = () => {
        const items = []
        orders.forEach(order => {
            order.items?.forEach(item => {
                items.push({
                    id: item.productId || item._id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity || 1,
                    orderId: order.orderId,
                    orderDate: order.createdAt,
                    orderStatus: order.status
                })
            })
        })
        return items
    }

    const sendProductInChat = (item) => {
        sendChatMessage('product', {
            type: 'product',
            id: item.id || item._id || item.productId,
            name: item.name,
            image: item.images?.[0] || item.image,
            price: item.salePrice || item.price,
            quantity: item.quantity, // Include quantity for bulk orders
            orderId: item.orderId // Include order reference if from history
        })
    }

    const markChatAsRead = async (chatId) => {
        try {
            await fetch(`${API_BASE_URL}/api/support-chats/${chatId}/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readBy: 'customer' })
            })
            fetchChats()
        } catch (err) { }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        const result = await login(loginData.email, loginData.password)
        if (!result.success) setError(result.error)
        setLoading(false)
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')
        if (registerData.password !== registerData.confirmPassword) { setError('Passwords do not match'); return }
        if (registerData.password.length < 6) { setError('Password must be at least 6 characters'); return }
        setLoading(true)
        const result = await register(registerData)
        if (!result.success) setError(result.error)
        setLoading(false)
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setError(''); setSuccess('')
        setLoading(true)
        const result = await updateProfile(profileData)
        if (result.success) { setSuccess('Profile updated successfully!'); setTimeout(() => setSuccess(''), 3000) }
        else setError(result.error)
        setLoading(false)
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setError(''); setSuccess('')

        if (passwordData.newPassword !== passwordData.confirmPassword) { setError('New passwords do not match'); return }
        if (passwordData.newPassword.length < 6) { setError('Password must be at least 6 characters'); return }

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user._id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess('Password changed successfully!')
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setTimeout(() => setSuccess(''), 3000)
            } else setError(data.error || 'Failed to change password')
        } catch (err) { setError('Network error') }
        setLoading(false)
    }

    // Cancel order
    const handleCancelOrder = async (orderId) => {
        if (!confirm('Are you sure you want to cancel this order?')) return
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, { method: 'PUT' })
            const data = await res.json()
            if (res.ok) {
                setSuccess('Order cancelled successfully!')
                getUserOrders().then(setOrders)
                setSelectedOrder({ ...selectedOrder, status: 'cancelled' })
            } else setError(data.error || 'Failed to cancel order')
        } catch (err) { setError('Network error') }
        setLoading(false)
    }

    // Update shipping address
    const handleUpdateAddress = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${selectedOrder._id}/shipping`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressForm)
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess('Address updated successfully!')
                setEditAddressMode(false)
                setSelectedOrder({ ...selectedOrder, shipping: addressForm })
                getUserOrders().then(setOrders)
            } else setError(data.error || 'Failed to update address')
        } catch (err) { setError('Network error') }
        setLoading(false)
    }

    // Request refund
    const handleRequestRefund = async () => {
        if (!refundReason.trim()) { setError('Please provide a reason for the refund'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/refunds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: selectedOrder._id, reason: refundReason })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess('Refund request submitted! We will review it shortly.')
                setShowRefundForm(false)
                setRefundReason('')
                fetch(`${API_BASE_URL}/api/refunds/customer/${user.email}`).then(r => r.json()).then(setRefunds)
            } else setError(data.error || 'Failed to submit refund request')
        } catch (err) { setError('Network error') }
        setLoading(false)
    }

    const couriers = {
        'australia-post': 'Australia Post',
        'startrack': 'StarTrack',
        'aramex': 'Aramex',
        'dhl': 'DHL Express',
        'tnt': 'TNT',
        'fedex': 'FedEx',
        'sendle': 'Sendle',
        'couriers-please': 'Couriers Please'
    }

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', padding: isMobile ? '20px' : '40px 20px' },
        container: { maxWidth: '1000px', margin: '0 auto' },
        header: { textAlign: 'center', marginBottom: '40px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '36px', color: '#222', marginBottom: '12px' },
        subtitle: { fontSize: '16px', color: '#666' },
        tabs: { display: 'flex', gap: '8px', background: '#fff', padding: '8px', borderRadius: '12px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px', flexWrap: 'wrap' },
        tab: { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: 'transparent', color: '#666', minWidth: 'fit-content' },
        tabActive: { background: '#6B2346', color: '#fff' },
        card: { background: '#fff', borderRadius: '16px', padding: isMobile ? '24px' : '40px', border: '1px solid #eee', maxWidth: '450px', margin: '0 auto' },
        cardWide: { background: '#fff', borderRadius: '16px', padding: isMobile ? '24px' : '40px', border: '1px solid #eee' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' },
        btn: { width: '100%', padding: '16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
        btnSecondary: { width: '100%', padding: '14px', background: 'transparent', color: '#6B2346', border: '2px solid #6B2346', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' },
        btnDanger: { padding: '12px 20px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        btnSmall: { padding: '10px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: '#E3F2FD', color: '#1565C0' },
        error: { background: '#FFEBEE', color: '#C62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
        success: { background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
        divider: { textAlign: 'center', color: '#999', margin: '24px 0', fontSize: '13px' },
        grid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: '24px' },
        sidebar: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee', height: 'fit-content' },
        sidebarItem: { padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' },
        sidebarItemActive: { background: '#FCE8ED', color: '#6B2346' },
        userInfo: { textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #eee' },
        avatar: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6B2346 0%, #C64977 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', margin: '0 auto 16px' },
        userName: { fontSize: '18px', fontWeight: '600', color: '#222' },
        userEmail: { fontSize: '14px', color: '#888' },
        sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#222', marginBottom: '20px' },
        orderCard: { border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '16px', cursor: 'pointer', transition: 'border-color 0.2s' },
        orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' },
        orderId: { fontSize: '16px', fontWeight: '600', color: '#222' },
        orderDate: { fontSize: '13px', color: '#888' },
        orderStatus: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
        statusPending: { background: '#FFF3E0', color: '#E65100' },
        statusProcessing: { background: '#E3F2FD', color: '#1565C0' },
        statusShipped: { background: '#F3E5F5', color: '#7B1FA2' },
        statusDelivered: { background: '#E8F5E9', color: '#2E7D32' },
        statusCancelled: { background: '#FFEBEE', color: '#C62828' },
        orderItems: { fontSize: '14px', color: '#555', marginBottom: '12px' },
        orderTotal: { fontSize: '16px', fontWeight: '700', color: '#6B2346' },
        noOrders: { textAlign: 'center', padding: '60px 20px', color: '#888' },
        cartItem: { display: 'flex', gap: '16px', padding: '16px', border: '1px solid #eee', borderRadius: '12px', marginBottom: '12px' },
        cartImage: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' },
        cartInfo: { flex: 1 },
        cartName: { fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '4px' },
        cartPrice: { fontSize: '16px', fontWeight: '700', color: '#6B2346' },
        badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#6B2346', color: '#fff', fontSize: '11px', fontWeight: '700', borderRadius: '10px', padding: '2px 8px', marginLeft: '8px' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' },
        trackingBox: { background: '#E8F5E9', padding: '20px', borderRadius: '12px', marginTop: '16px', textAlign: 'center' },
        refundCard: { border: '1px solid #eee', borderRadius: '12px', padding: '16px', marginBottom: '12px' }
    }

    // Not logged in - show login/register
    if (!isLoggedIn) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>My Account</h1>
                        <p style={styles.subtitle}>Sign in or create an account to view your orders</p>
                    </div>
                    <div style={styles.tabs}>
                        <button style={{ ...styles.tab, ...(authTab === 'login' ? styles.tabActive : {}) }} onClick={() => { setAuthTab('login'); setError('') }}>Sign In</button>
                        <button style={{ ...styles.tab, ...(authTab === 'register' ? styles.tabActive : {}) }} onClick={() => { setAuthTab('register'); setError('') }}>Register</button>
                    </div>
                    <div style={styles.card}>
                        {error && <div style={styles.error}>⚠️ {error}</div>}
                        {authTab === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <div style={styles.formGroup}><label style={styles.label}>Email Address</label><input type="email" style={styles.input} value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} placeholder="your@email.com" required /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Password</label><input type="password" style={styles.input} value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} placeholder="••••••••" required /></div>
                                <button type="submit" style={styles.btn} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                                <p style={styles.divider}>Don't have an account?</p>
                                <button type="button" style={styles.btnSecondary} onClick={() => setAuthTab('register')}>Create Account</button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div><label style={styles.label}>First Name</label><input type="text" style={styles.input} value={registerData.firstName} onChange={e => setRegisterData({ ...registerData, firstName: e.target.value })} placeholder="John" required /></div>
                                    <div><label style={styles.label}>Last Name</label><input type="text" style={styles.input} value={registerData.lastName} onChange={e => setRegisterData({ ...registerData, lastName: e.target.value })} placeholder="Doe" required /></div>
                                </div>
                                <div style={styles.formGroup}><label style={styles.label}>Email Address</label><input type="email" style={styles.input} value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} placeholder="your@email.com" required /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Password (min 6 characters)</label><input type="password" style={styles.input} value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} placeholder="••••••••" required minLength="6" /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Confirm Password</label><input type="password" style={styles.input} value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })} placeholder="••••••••" required /></div>
                                <button type="submit" style={styles.btn} disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
                                <p style={styles.divider}>Already have an account?</p>
                                <button type="button" style={styles.btnSecondary} onClick={() => setAuthTab('login')}>Sign In</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'delivered': return styles.statusDelivered
            case 'shipped': return styles.statusShipped
            case 'processing': return styles.statusProcessing
            case 'cancelled': return styles.statusCancelled
            default: return styles.statusPending
        }
    }

    const getRefundStatusColor = (status) => {
        const colors = {
            pending: { bg: '#FFF3E0', text: '#E65100' },
            reviewing: { bg: '#E3F2FD', text: '#1565C0' },
            approved: { bg: '#E8F5E9', text: '#2E7D32' },
            denied: { bg: '#FFEBEE', text: '#C62828' },
            processed: { bg: '#E8F5E9', text: '#1B5E20' }
        }
        return colors[status] || { bg: '#f0f0f0', text: '#666' }
    }

    // Check if order has pending refund
    const hasRefund = (orderId) => refunds.find(r => r.orderId === orderId || r.order === orderId)

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Welcome back, {user.firstName}!</h1>
                    <p style={styles.subtitle}>Manage your account and view your orders</p>
                </div>

                <div style={styles.grid}>
                    {/* Sidebar */}
                    <div style={styles.sidebar}>
                        <div style={styles.userInfo}>
                            <div style={styles.avatar}>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</div>
                            <div style={styles.userName}>{user.firstName} {user.lastName}</div>
                            <div style={styles.userEmail}>{user.email}</div>
                        </div>
                        <div style={{ ...styles.sidebarItem, ...(activeTab === 'orders' ? styles.sidebarItemActive : {}) }} onClick={() => setActiveTab('orders')}>📦 My Orders</div>
                        <div style={{ ...styles.sidebarItem, ...(activeTab === 'support' ? styles.sidebarItemActive : {}) }} onClick={() => setActiveTab('support')}>
                            💬 Support Chat {unreadChats > 0 && <span style={styles.badge}>{unreadChats}</span>}
                        </div>
                        <div style={{ ...styles.sidebarItem, ...(activeTab === 'refunds' ? styles.sidebarItemActive : {}) }} onClick={() => setActiveTab('refunds')}>
                            💰 Refund Requests {refunds.length > 0 && <span style={styles.badge}>{refunds.length}</span>}
                        </div>
                        <div style={{ ...styles.sidebarItem, ...(activeTab === 'cart' ? styles.sidebarItemActive : {}) }} onClick={() => setActiveTab('cart')}>
                            🛒 My Cart {getCartCount() > 0 && <span style={styles.badge}>{getCartCount()}</span>}
                        </div>
                        <div style={{ ...styles.sidebarItem, ...(activeTab === 'profile' ? styles.sidebarItemActive : {}) }} onClick={() => setActiveTab('profile')}>👤 Profile Settings</div>
                        <div style={{ ...styles.sidebarItem, ...(activeTab === 'password' ? styles.sidebarItemActive : {}) }} onClick={() => setActiveTab('password')}>🔒 Change Password</div>
                        <button style={{ ...styles.btnSecondary, marginTop: '20px' }} onClick={logout}>Sign Out</button>
                    </div>

                    {/* Main Content */}
                    <div style={styles.cardWide}>
                        {error && <div style={styles.error}>⚠️ {error}</div>}
                        {success && <div style={styles.success}>✓ {success}</div>}

                        {activeTab === 'orders' && (
                            <>
                                <h2 style={styles.sectionTitle}>📦 My Orders ({orders.length})</h2>
                                {orders.length === 0 ? (
                                    <div style={styles.noOrders}>
                                        <p style={{ fontSize: '60px', marginBottom: '20px' }}>🛒</p>
                                        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No orders yet</p>
                                        <p>When you place an order, it will appear here.</p>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div
                                            key={order.id || order._id}
                                            style={styles.orderCard}
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setAddressForm(order.shipping || {})
                                                setEditAddressMode(false)
                                                setShowRefundForm(false)
                                                setError('')
                                                setSuccess('')
                                            }}
                                        >
                                            <div style={styles.orderHeader}>
                                                <div>
                                                    <span style={styles.orderId}>Order #{order.orderId}</span>
                                                    <div style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                </div>
                                                <span style={{ ...styles.orderStatus, ...getStatusStyle(order.status) }}>{order.status}</span>
                                            </div>
                                            <div style={styles.orderItems}>{order.items?.map((item, i) => <div key={i}>{item.quantity}x {item.name}</div>)}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={styles.orderTotal}>Total: ${order.total?.toFixed(2)} AUD</div>
                                                <span style={{ ...styles.btnSmall }}>View Details →</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'refunds' && (
                            <>
                                <h2 style={styles.sectionTitle}>💰 Refund Requests ({refunds.length})</h2>
                                {refunds.length === 0 ? (
                                    <div style={styles.noOrders}>
                                        <p style={{ fontSize: '60px', marginBottom: '20px' }}>💰</p>
                                        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No refund requests</p>
                                        <p>You haven't submitted any refund requests.</p>
                                    </div>
                                ) : (
                                    refunds.map(refund => (
                                        <div key={refund.id || refund._id} style={styles.refundCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                                                <div>
                                                    <strong>{refund.refundId}</strong>
                                                    <div style={{ fontSize: '13px', color: '#888' }}>Order: {refund.orderId}</div>
                                                </div>
                                                <span style={{ ...styles.orderStatus, background: getRefundStatusColor(refund.status).bg, color: getRefundStatusColor(refund.status).text }}>
                                                    {refund.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Amount:</strong> ${refund.amount?.toFixed(2)} AUD</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}><strong>Reason:</strong> {refund.reason}</div>
                                            {refund.messages?.filter(m => m.from === 'admin').length > 0 && (
                                                <div style={{ background: '#E3F2FD', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1565C0', marginBottom: '4px' }}>Latest response from support:</div>
                                                    <div style={{ fontSize: '14px' }}>{refund.messages?.filter(m => m.from === 'admin').slice(-1)[0]?.message}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'cart' && (
                            <>
                                <h2 style={styles.sectionTitle}>🛒 My Cart ({getCartCount()} items)</h2>
                                {items.length === 0 ? (
                                    <div style={styles.noOrders}>
                                        <p style={{ fontSize: '60px', marginBottom: '20px' }}>🛒</p>
                                        <p style={{ fontSize: '18px', marginBottom: '8px' }}>Your cart is empty</p>
                                        <Link to="/products" style={{ ...styles.btn, display: 'inline-block', marginTop: '16px' }}>Start Shopping</Link>
                                    </div>
                                ) : (
                                    <>
                                        {items.map(item => (
                                            <div key={item.id} style={styles.cartItem}>
                                                <img src={item.image || '/placeholder.svg'} alt={item.name} style={styles.cartImage} onError={e => e.target.src = '/placeholder.svg'} />
                                                <div style={styles.cartInfo}>
                                                    <div style={styles.cartName}>{item.name}</div>
                                                    <div style={styles.cartPrice}>${(item.salePrice || item.price)?.toFixed(2)} x {item.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ padding: '16px', background: '#f8f8f8', borderRadius: '12px', marginTop: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#222' }}>
                                                <span>Total:</span><span style={{ color: '#6B2346' }}>${getCartTotal().toFixed(2)} AUD</span>
                                            </div>
                                        </div>
                                        <Link to="/cart" style={{ ...styles.btn, display: 'block', textAlign: 'center', marginTop: '16px', textDecoration: 'none' }}>View Cart & Checkout</Link>
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === 'profile' && (
                            <>
                                <h2 style={styles.sectionTitle}>👤 Profile Settings</h2>
                                <form onSubmit={handleUpdateProfile}>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div style={styles.formGroup}><label style={styles.label}>First Name</label><input type="text" style={styles.input} value={profileData.firstName} onChange={e => setProfileData({ ...profileData, firstName: e.target.value })} /></div>
                                        <div style={styles.formGroup}><label style={styles.label}>Last Name</label><input type="text" style={styles.input} value={profileData.lastName} onChange={e => setProfileData({ ...profileData, lastName: e.target.value })} /></div>
                                    </div>
                                    <div style={styles.formGroup}><label style={styles.label}>Email (cannot be changed)</label><input type="email" style={{ ...styles.input, background: '#f5f5f5', cursor: 'not-allowed' }} value={user.email} disabled /></div>
                                    <div style={styles.formGroup}><label style={styles.label}>Phone Number</label><input type="tel" style={styles.input} value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} placeholder="0412 345 678" /></div>
                                    <button type="submit" style={styles.btn} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                                </form>
                            </>
                        )}

                        {activeTab === 'password' && (
                            <>
                                <h2 style={styles.sectionTitle}>🔒 Change Password</h2>
                                <form onSubmit={handleChangePassword}>
                                    <div style={styles.formGroup}><label style={styles.label}>Current Password</label><input type="password" style={styles.input} value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="••••••••" required /></div>
                                    <div style={styles.formGroup}><label style={styles.label}>New Password (min 6 characters)</label><input type="password" style={styles.input} value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="••••••••" required minLength="6" /></div>
                                    <div style={styles.formGroup}><label style={styles.label}>Confirm New Password</label><input type="password" style={styles.input} value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="••••••••" required /></div>
                                    <button type="submit" style={styles.btn} disabled={loading}>{loading ? 'Changing Password...' : 'Change Password'}</button>
                                </form>
                            </>
                        )}

                        {activeTab === 'support' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={styles.sectionTitle}>💬 Support Chat</h2>
                                    {!selectedChat && <button style={styles.btn} onClick={createNewChat}>+ New Chat</button>}
                                </div>

                                {!selectedChat ? (
                                    // Chat list
                                    chats.length === 0 ? (
                                        <div style={styles.noOrders}>
                                            <p style={{ fontSize: '60px', marginBottom: '20px' }}>💬</p>
                                            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No support chats yet</p>
                                            <p style={{ marginBottom: '20px' }}>Start a new chat if you need help!</p>
                                            <button style={styles.btn} onClick={createNewChat}>Start New Chat</button>
                                        </div>
                                    ) : (
                                        chats.map(chat => (
                                            <div
                                                key={chat.id}
                                                style={{ ...styles.orderCard, cursor: 'pointer' }}
                                                onClick={() => { setSelectedChat(chat); markChatAsRead(chat.id) }}
                                            >
                                                <div style={styles.orderHeader}>
                                                    <span style={styles.orderId}>{chat.chatId}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {chat.unreadCustomer > 0 && <span style={{ ...styles.badge, background: '#C62828' }}>{chat.unreadCustomer} new</span>}
                                                        <span style={{ ...styles.orderStatus, ...(chat.status === 'resolved' ? styles.statusDelivered : styles.statusProcessing) }}>{chat.status}</span>
                                                    </div>
                                                </div>
                                                <div style={styles.orderItems}>{chat.messages?.slice(-1)[0]?.message || 'No messages yet'}</div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>{new Date(chat.lastMessage).toLocaleString()}</div>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    // Chat view
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                                            <div>
                                                <strong>{selectedChat.chatId}</strong>
                                                <span style={{ ...styles.orderStatus, marginLeft: '12px', ...(selectedChat.status === 'resolved' ? styles.statusDelivered : styles.statusProcessing) }}>{selectedChat.status}</span>
                                            </div>
                                            <button style={styles.btnSmall} onClick={() => setSelectedChat(null)}>← Back to Chats</button>
                                        </div>

                                        {/* Messages */}
                                        <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px', paddingRight: '8px' }}>
                                            {selectedChat.messages?.map((msg, i) => (
                                                <div key={i} style={{ marginBottom: '16px', maxWidth: '80%', marginLeft: msg.from === 'customer' ? 'auto' : 0, marginRight: msg.from === 'admin' ? 'auto' : 0 }}>
                                                    <div style={{ padding: '12px 16px', borderRadius: '16px', background: msg.from === 'customer' ? '#6B2346' : '#f0f0f0', color: msg.from === 'customer' ? '#fff' : '#333', borderBottomRightRadius: msg.from === 'customer' ? '4px' : '16px', borderBottomLeftRadius: msg.from === 'admin' ? '4px' : '16px' }}>
                                                        {msg.messageType === 'text' && msg.message}
                                                        {msg.messageType === 'product' && msg.attachment && (
                                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px', marginTop: '8px' }}>
                                                                <img src={msg.attachment.image || '/placeholder.svg'} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} onError={e => e.target.src = '/placeholder.svg'} />
                                                                <div>
                                                                    <div style={{ fontWeight: '600' }}>{msg.attachment.name}</div>
                                                                    <div style={{ fontWeight: '700' }}>${msg.attachment.price?.toFixed(2)}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', textAlign: msg.from === 'customer' ? 'right' : 'left' }}>
                                                        {msg.from === 'customer' ? 'You' : '👤 Support'} • {new Date(msg.date).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Input area */}
                                        <div style={{ position: 'relative', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                            {showProductPicker && (
                                                <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '8px', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', maxHeight: '300px', overflow: 'auto', zIndex: 10 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <strong style={{ fontSize: '14px' }}>📦 Share a Product</strong>
                                                        <button onClick={() => setShowProductPicker(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
                                                    </div>

                                                    {/* Tabs */}
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                        <button
                                                            onClick={() => setPickerTab('history')}
                                                            style={{
                                                                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                                                                background: pickerTab === 'history' ? '#6B2346' : '#f0f0f0',
                                                                color: pickerTab === 'history' ? '#fff' : '#666'
                                                            }}
                                                        >
                                                            📦 My Orders ({getOrderHistoryItems().length})
                                                        </button>
                                                        <button
                                                            onClick={() => setPickerTab('all')}
                                                            style={{
                                                                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                                                                background: pickerTab === 'all' ? '#6B2346' : '#f0f0f0',
                                                                color: pickerTab === 'all' ? '#fff' : '#666'
                                                            }}
                                                        >
                                                            🛍️ All Products
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px' }}
                                                        placeholder="Search products..."
                                                        value={productSearch}
                                                        onChange={e => setProductSearch(e.target.value)}
                                                    />

                                                    {pickerTab === 'history' ? (
                                                        getOrderHistoryItems().filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                                                            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No products in your order history</p>
                                                        ) : (
                                                            getOrderHistoryItems().filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase())).map((item, idx) => (
                                                                <div
                                                                    key={`${item.id}-${idx}`}
                                                                    style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #eee', marginBottom: '8px', background: '#FFF8E1' }}
                                                                    onClick={() => sendProductInChat(item)}
                                                                >
                                                                    <img src={item.image || '/placeholder.svg'} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} onError={e => e.target.src = '/placeholder.svg'} />
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                                                                            <span style={{ color: '#6B2346', fontWeight: '700', fontSize: '14px' }}>${item.price?.toFixed(2)}</span>
                                                                            <span style={{ background: '#6B2346', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>Qty: {item.quantity}</span>
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                                            Order: <strong>{item.orderId}</strong> • {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : ''} • {item.orderStatus}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )
                                                    ) : (
                                                        products.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8).length === 0 ? (
                                                            <p style={{ color: '#888', textAlign: 'center', padding: '10px' }}>No products found</p>
                                                        ) : (
                                                            products.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8).map(product => (
                                                                <div
                                                                    key={product.id || product._id}
                                                                    style={{ display: 'flex', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #eee', marginBottom: '8px', background: '#fafafa' }}
                                                                    onClick={() => sendProductInChat(product)}
                                                                >
                                                                    <img src={product.images?.[0] || product.image || '/placeholder.svg'} alt="" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.src = '/placeholder.svg'} />
                                                                    <div>
                                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{product.name}</div>
                                                                        <div style={{ color: '#6B2346', fontWeight: '700', fontSize: '13px' }}>${(product.salePrice || product.price)?.toFixed(2)}</div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )
                                                    )}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => setShowProductPicker(!showProductPicker)}
                                                    style={{ padding: '12px 16px', background: '#E3F2FD', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
                                                    title="Share Product"
                                                >
                                                    📦
                                                </button>
                                                <input
                                                    type="text"
                                                    style={{ flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', outline: 'none', minWidth: 0 }}
                                                    placeholder="Type a message..."
                                                    value={chatMessage}
                                                    onChange={e => setChatMessage(e.target.value)}
                                                    onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                                                />
                                                <button
                                                    onClick={() => sendChatMessage()}
                                                    style={{ padding: '12px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                                                >
                                                    Send
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div style={styles.modal} onClick={() => setSelectedOrder(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Order #{selectedOrder.orderId}</h2>
                            <span style={{ ...styles.orderStatus, ...getStatusStyle(selectedOrder.status) }}>{selectedOrder.status}</span>
                        </div>

                        {error && <div style={styles.error}>⚠️ {error}</div>}
                        {success && <div style={styles.success}>✓ {success}</div>}

                        {/* Tracking Info (if shipped) */}
                        {selectedOrder.trackingNumber && (
                            <div style={styles.trackingBox}>
                                <h3 style={{ margin: '0 0 12px', color: '#2E7D32' }}>📦 Tracking Information</h3>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedOrder.trackingNumber}</div>
                                {selectedOrder.courier && <div style={{ marginBottom: '8px' }}>Courier: {couriers[selectedOrder.courier] || selectedOrder.courier}</div>}
                                {selectedOrder.deliveryDays && <div style={{ marginBottom: '12px' }}>Est. Delivery: {selectedOrder.deliveryDays} Business Days</div>}
                                {selectedOrder.trackingUrl && (
                                    <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-block', background: '#2E7D32', color: '#fff', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: '600' }}>
                                        Track Package →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Order Items */}
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '12px' }}>Order Items</h3>
                            {selectedOrder.items?.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                                    <span>{item.quantity}x {item.name}</span>
                                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                                </div>
                            ))}
                            <div style={{ padding: '16px 0', borderTop: '2px solid #eee', marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#6B2346' }}>
                                    <span>Total</span><span>${selectedOrder.total?.toFixed(2)} AUD</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div style={{ marginTop: '20px', background: '#f8f8f8', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0 }}>Shipping Address</h3>
                                {['pending', 'processing'].includes(selectedOrder.status) && !editAddressMode && (
                                    <button style={styles.btnSmall} onClick={() => setEditAddressMode(true)}>Edit</button>
                                )}
                            </div>

                            {editAddressMode ? (
                                <div>
                                    <div style={styles.formGroup}>
                                        <input style={styles.input} value={addressForm.address} onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="Street Address" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <input style={styles.input} value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" />
                                        <input style={styles.input} value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" />
                                    </div>
                                    <div style={{ marginTop: '12px' }}>
                                        <input style={styles.input} value={addressForm.postcode} onChange={e => setAddressForm({ ...addressForm, postcode: e.target.value })} placeholder="Postcode" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                        <button style={{ ...styles.btn, flex: 1 }} onClick={handleUpdateAddress} disabled={loading}>Save Address</button>
                                        <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => setEditAddressMode(false)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {selectedOrder.shipping?.address}<br />
                                    {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.postcode}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {/* Cancel Order (only if pending/processing and not cancelled) */}
                            {['pending', 'processing'].includes(selectedOrder.status) && (
                                <button style={styles.btnDanger} onClick={() => handleCancelOrder(selectedOrder._id)} disabled={loading}>
                                    Cancel Order
                                </button>
                            )}

                            {/* Request Refund (only if cancelled and no existing refund) */}
                            {selectedOrder.status === 'cancelled' && !hasRefund(selectedOrder.orderId) && !showRefundForm && (
                                <button style={{ ...styles.btn, background: '#1565C0' }} onClick={() => setShowRefundForm(true)}>
                                    Request Refund
                                </button>
                            )}

                            {hasRefund(selectedOrder.orderId) && (
                                <div style={{ background: '#E3F2FD', padding: '12px 16px', borderRadius: '10px', color: '#1565C0', fontWeight: '600' }}>
                                    ✓ Refund request submitted
                                </div>
                            )}

                            <button style={styles.btnSecondary} onClick={() => setSelectedOrder(null)}>Close</button>
                        </div>

                        {/* Refund Form */}
                        {showRefundForm && (
                            <div style={{ marginTop: '20px', background: '#FFF3E0', padding: '20px', borderRadius: '12px' }}>
                                <h3 style={{ margin: '0 0 12px' }}>Request Refund</h3>
                                <textarea
                                    style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    placeholder="Please explain why you're requesting a refund..."
                                />
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button style={styles.btn} onClick={handleRequestRefund} disabled={loading}>
                                        {loading ? 'Submitting...' : 'Submit Refund Request'}
                                    </button>
                                    <button style={styles.btnSecondary} onClick={() => { setShowRefundForm(false); setRefundReason('') }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Account
