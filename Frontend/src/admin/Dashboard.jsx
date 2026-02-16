import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Dashboard() {
    const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 })
    const [recentOrders, setRecentOrders] = useState([])

    useEffect(() => {
        // Fetch stats
        Promise.all([
            fetch(`${API_BASE_URL}/api/products`).then(r => r.json()),
            adminApi.get('/api/orders'),
            adminApi.get('/api/customers')
        ]).then(([products, orders, customers]) => {
            const productList = products.products || products || []
            const orderList = orders || []
            const customerList = customers || []
            const revenue = orderList.reduce((sum, o) => sum + (o.total || 0), 0)
            setStats({ products: productList.length, orders: orderList.length, customers: customerList.length, revenue })
            setRecentOrders(orderList.slice(0, 5))
        }).catch(console.error)
    }, [])

    const styles = {
        page: { overflowX: 'hidden' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222', marginBottom: '8px' },
        subtitle: { fontSize: '15px', color: '#666', marginBottom: '30px' },
        statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '30px' },
        statCard: { background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e5e5e5' },
        statIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' },
        statValue: { fontSize: '28px', fontWeight: '700', color: '#222', marginBottom: '4px' },
        statLabel: { fontSize: '13px', color: '#666' },
        section: { background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e5e5e5', marginBottom: '20px', overflowX: 'auto' },
        sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '20px' },
        tableWrapper: { overflowX: 'auto', margin: '0 -20px', padding: '0 20px' },
        table: { width: '100%', borderCollapse: 'collapse', minWidth: '400px' },
        th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', whiteSpace: 'nowrap' },
        td: { padding: '14px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333', whiteSpace: 'nowrap' },
        badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
        quickLinks: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' },
        quickLink: { display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', background: '#f8f8f8', borderRadius: '12px', textDecoration: 'none', color: '#333', fontSize: '13px', fontWeight: '500' }
    }

    const statCards = [
        { label: 'Total Products', value: stats.products, color: '#6B2346', icon: '📦' },
        { label: 'Total Orders', value: stats.orders, color: '#2E7D32', icon: '🛒' },
        { label: 'Customers', value: stats.customers, color: '#1565C0', icon: '👥' },
        { label: 'Revenue', value: `$${stats.revenue.toFixed(0)}`, color: '#C9A865', icon: '💰' }
    ]

    const getStatusStyle = (status) => {
        const colors = { completed: '#E8F5E9', processing: '#FFF3E0', pending: '#E3F2FD', cancelled: '#FFEBEE' }
        const text = { completed: '#2E7D32', processing: '#E65100', pending: '#1565C0', cancelled: '#C62828' }
        return { background: colors[status] || '#f0f0f0', color: text[status] || '#666' }
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back! Here's what's happening with your store.</p>

            {/* Stats */}
            <div style={styles.statsGrid}>
                {statCards.map((stat, i) => (
                    <div key={i} style={styles.statCard}>
                        <div style={{ ...styles.statIcon, background: `${stat.color}20`, color: stat.color, fontSize: '24px' }}>
                            {stat.icon}
                        </div>
                        <div style={styles.statValue}>{stat.value}</div>
                        <div style={styles.statLabel}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={styles.quickLinks}>
                    <Link to="/admin/products" style={styles.quickLink}>➕ Add Product</Link>
                    <Link to="/admin/slider" style={styles.quickLink}>🖼️ Edit Slider</Link>
                    <Link to="/admin/sections" style={styles.quickLink}>📝 Edit Sections</Link>
                    <Link to="/admin/settings" style={styles.quickLink}>⚙️ Site Settings</Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent Orders</h2>
                {recentOrders.length === 0 ? (
                    <p style={{ color: '#666' }}>No orders yet.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Order ID</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Total</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={styles.td}>#{order.id}</td>
                                    <td style={styles.td}>{order.customer?.firstName} {order.customer?.lastName}</td>
                                    <td style={styles.td}>${order.total?.toFixed(2)}</td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, ...getStatusStyle(order.status) }}>
                                            {order.status || 'pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Dashboard


