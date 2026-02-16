import { useState, useEffect } from 'react'
import './Admin.css'
import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'

function Reports() {
    const [report, setReport] = useState({ totalSales: 0, totalOrders: 0, averageOrder: 0, orders: [] })
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => { fetchReport() }, [])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)
            const data = await adminApi.get(`/api/reports/sales?${params}`)
            setReport(data)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const exportCSV = () => {
        const headers = ['Order ID', 'Customer', 'Total', 'Status', 'Date']
        const rows = report.orders.map(o => [o.orderId, `${o.customer?.firstName} ${o.customer?.lastName}`, o.total, o.status, o.createdAt])
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    }

    const exportPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF()
            doc.setFontSize(20)
            doc.text('DecoraBake Sales Report', 20, 20)
            doc.setFontSize(12)
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30)
            doc.text(`Period: ${startDate || 'All time'} - ${endDate || 'Present'}`, 20, 38)
            doc.setFontSize(14)
            doc.text(`Total Sales: $${report.totalSales.toFixed(2)}`, 20, 55)
            doc.text(`Total Orders: ${report.totalOrders}`, 20, 65)
            doc.text(`Average Order: $${report.averageOrder.toFixed(2)}`, 20, 75)
            doc.save(`sales-report-${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (err) { console.error(err); alert('PDF export failed') }
    }

    return (
        <div>
            <div className="admin-toolbar">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input" style={{ width: '160px' }} />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input" style={{ width: '160px' }} />
                    <button className="btn btn-outline" onClick={fetchReport}>Apply Filter</button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
                    <button className="btn btn-primary" onClick={exportPDF}>Export PDF</button>
                </div>
            </div>

            <div className="admin-stats">
                <div className="admin-stat">
                    <div className="admin-stat__icon admin-stat__icon--primary"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg></div>
                    <div className="admin-stat__content"><div className="admin-stat__value">${report.totalSales.toFixed(2)}</div><div className="admin-stat__label">Total Sales</div></div>
                </div>
                <div className="admin-stat">
                    <div className="admin-stat__icon admin-stat__icon--success"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg></div>
                    <div className="admin-stat__content"><div className="admin-stat__value">{report.totalOrders}</div><div className="admin-stat__label">Orders</div></div>
                </div>
                <div className="admin-stat">
                    <div className="admin-stat__icon admin-stat__icon--warning"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg></div>
                    <div className="admin-stat__content"><div className="admin-stat__value">${report.averageOrder.toFixed(2)}</div><div className="admin-stat__label">Avg Order Value</div></div>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header"><h3 className="admin-card__title">Orders in Period</h3></div>
                {loading ? <div className="admin-loading"><div className="spinner"></div></div> : report.orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '32px' }}>No orders in this period</p>
                ) : (
                    <table className="admin-table">
                        <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>
                            {report.orders.slice(0, 20).map(o => (
                                <tr key={o.id}>
                                    <td><strong>{o.orderId}</strong></td>
                                    <td>{o.customer?.firstName} {o.customer?.lastName}</td>
                                    <td>${o.total?.toFixed(2)}</td>
                                    <td><span className={`status-badge status-badge--${o.status}`}>{o.status}</span></td>
                                    <td>{new Date(o.createdAt).toLocaleDateString('en-AU')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Reports

