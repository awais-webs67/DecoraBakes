import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

function Customers() {
    const [customers, setCustomers] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        Promise.all([
            adminApi.get('/api/customers'),
            adminApi.get('/api/orders')
        ]).then(([customersData, ordersData]) => {
            setCustomers(customersData || [])
            setOrders(ordersData || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const getCustomerOrders = (email) => orders.filter(o => o.customer?.email === email)
    const getCustomerTotal = (email) => getCustomerOrders(email).reduce((sum, o) => sum + (o.total || 0), 0)

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        searchInput: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minWidth: '250px' },
        stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
        statCard: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e5e5' },
        statValue: { fontSize: '28px', fontWeight: '700', color: '#222' },
        statLabel: { fontSize: '13px', color: '#666', marginTop: '4px' },
        table: { width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5' },
        th: { padding: '16px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', background: '#fafafa' },
        td: { padding: '16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333' },
        avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#6B2346', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' },
        btn: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: '#E3F2FD', color: '#1565C0' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px' },
        section: { marginBottom: '24px' },
        sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '12px' },
        infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
        infoItem: { background: '#f8f8f8', padding: '14px', borderRadius: '10px' },
        infoLabel: { fontSize: '12px', color: '#888', marginBottom: '4px' },
        infoValue: { fontSize: '14px', fontWeight: '500', color: '#222' },
        orderRow: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f8f8', borderRadius: '8px', marginBottom: '8px' },
        closeBtn: { padding: '12px 24px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%' }
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Customers ({customers.length})</h1>
                <input type="text" style={styles.searchInput} placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* Stats */}
            <div style={styles.stats}>
                <div style={styles.statCard}><div style={styles.statValue}>{customers.length}</div><div style={styles.statLabel}>Total Customers</div></div>
                <div style={styles.statCard}><div style={styles.statValue}>{orders.length}</div><div style={styles.statLabel}>Total Orders</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#2E7D32' }}>${totalRevenue.toFixed(0)}</div><div style={styles.statLabel}>Total Revenue</div></div>
            </div>

            {/* Customers Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Orders</th>
                            <th style={styles.th}>Total Spent</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => {
                            const customerOrders = getCustomerOrders(customer.email)
                            const totalSpent = getCustomerTotal(customer.email)
                            return (
                                <tr key={customer.id || customer.email}>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={styles.avatar}>{customer.name?.charAt(0) || 'U'}</div>
                                            <strong>{customer.name || 'Unknown'}</strong>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{customer.email}</td>
                                    <td style={styles.td}>{customerOrders.length}</td>
                                    <td style={styles.td}><strong style={{ color: '#2E7D32' }}>${totalSpent.toFixed(2)}</strong></td>
                                    <td style={styles.td}>
                                        <button style={styles.btn} onClick={() => setSelectedCustomer(customer)}>View Details</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {filteredCustomers.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No customers found</div>}

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div style={styles.modal} onClick={() => setSelectedCustomer(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Customer Details</h2>

                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Contact Information</div>
                            <div style={styles.infoGrid}>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Name</div><div style={styles.infoValue}>{selectedCustomer.name}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Email</div><div style={styles.infoValue}>{selectedCustomer.email}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Phone</div><div style={styles.infoValue}>{selectedCustomer.phone || '-'}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Total Spent</div><div style={styles.infoValue}>${getCustomerTotal(selectedCustomer.email).toFixed(2)}</div></div>
                            </div>
                        </div>

                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Order History ({getCustomerOrders(selectedCustomer.email).length} orders)</div>
                            {getCustomerOrders(selectedCustomer.email).length === 0 ? (
                                <p style={{ color: '#666' }}>No orders yet</p>
                            ) : (
                                getCustomerOrders(selectedCustomer.email).map(order => (
                                    <div key={order.id} style={styles.orderRow}>
                                        <div>
                                            <strong>Order #{order.id}</strong>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong>${order.total?.toFixed(2)}</strong>
                                            <div style={{ fontSize: '12px', color: order.status === 'delivered' ? '#2E7D32' : '#888' }}>{order.status}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button style={styles.closeBtn} onClick={() => setSelectedCustomer(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Customers


