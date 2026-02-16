import { useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'

function Diagnostics() {
    const [diagnostics, setDiagnostics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [testResults, setTestResults] = useState({})

    const fetchDiagnostics = async () => {
        setLoading(true)
        try {
            const data = await adminApi.get('/api/diagnostics')
            setDiagnostics(data)
        } catch (err) {
            setDiagnostics({ success: false, error: err.message })
        }
        setLoading(false)
    }

    useEffect(() => { fetchDiagnostics() }, [])

    const runTest = async (testName, testFn) => {
        setTestResults(prev => ({ ...prev, [testName]: { loading: true } }))
        try {
            const result = await testFn()
            setTestResults(prev => ({ ...prev, [testName]: { success: true, result } }))
        } catch (err) {
            setTestResults(prev => ({ ...prev, [testName]: { success: false, error: err.message } }))
        }
    }

    const tests = [
        { name: 'Database', fn: async () => { const r = await fetch(`${API_BASE_URL}/api/health`); return (await r.json()).db ? 'Connected' : 'Disconnected' } },
        { name: 'Products API', fn: async () => { const r = await fetch(`${API_BASE_URL}/api/products?limit=1`); const d = await r.json(); return `${d.total || d.length || 0} products found` } },
        { name: 'Categories API', fn: async () => { const r = await fetch(`${API_BASE_URL}/api/categories`); const d = await r.json(); return `${d.length || 0} categories found` } },
        { name: 'Settings API', fn: async () => { const r = await fetch(`${API_BASE_URL}/api/settings`); return r.ok ? 'Settings accessible' : 'Failed' } },
        { name: 'Orders API', fn: async () => { const r = await fetch(`${API_BASE_URL}/api/orders`); const d = await r.json(); return `${d.length || 0} orders found` } },
        { name: 'Upload Folder', fn: async () => { const r = await fetch(`${API_BASE_URL}/uploads/.test`); return r.status === 404 ? 'Upload folder accessible' : 'Check complete' } }
    ]

    const runAllTests = async () => {
        for (const test of tests) {
            await runTest(test.name, test.fn)
        }
    }

    const styles = {
        page: { padding: '24px 0' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        btn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
        card: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' },
        cardTitle: { fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' },
        stat: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
        statLabel: { color: '#666' },
        statValue: { fontWeight: '600', color: '#222' },
        badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
        badgeGreen: { background: '#E8F5E9', color: '#2E7D32' },
        badgeRed: { background: '#FFEBEE', color: '#C62828' },
        badgeYellow: { background: '#FFF8E1', color: '#F57C00' },
        testRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f8f8', borderRadius: '8px', marginBottom: '8px' },
        testName: { fontSize: '14px', fontWeight: '500' },
        testBtn: { padding: '6px 16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }
    }

    if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading diagnostics...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>🔧 System Diagnostics</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={styles.btn} onClick={runAllTests}>Run All Tests</button>
                    <button style={{ ...styles.btn, background: '#fff', color: '#6B2346', border: '2px solid #6B2346' }} onClick={fetchDiagnostics}>Refresh</button>
                </div>
            </div>

            <div style={styles.grid}>
                {/* Database Status */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <span style={{ fontSize: '24px' }}>🗄️</span>
                        Database Status
                    </h3>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Connection</span>
                        <span style={{ ...styles.badge, ...(diagnostics?.database?.status === 'connected' ? styles.badgeGreen : styles.badgeRed) }}>
                            {diagnostics?.database?.status || 'Unknown'}
                        </span>
                    </div>
                </div>

                {/* Collections */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <span style={{ fontSize: '24px' }}>📊</span>
                        Collections
                    </h3>
                    {diagnostics?.collections && Object.entries(diagnostics.collections).map(([key, value]) => (
                        <div key={key} style={styles.stat}>
                            <span style={styles.statLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            <span style={styles.statValue}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Settings */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <span style={{ fontSize: '24px' }}>⚙️</span>
                        Settings Status
                    </h3>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Settings Configured</span>
                        <span style={{ ...styles.badge, ...(diagnostics?.settings?.exists ? styles.badgeGreen : styles.badgeRed) }}>
                            {diagnostics?.settings?.exists ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Chatbot Enabled</span>
                        <span style={{ ...styles.badge, ...(diagnostics?.settings?.chatbotEnabled ? styles.badgeGreen : styles.badgeYellow) }}>
                            {diagnostics?.settings?.chatbotEnabled ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Gemini API</span>
                        <span style={{ ...styles.badge, ...(diagnostics?.settings?.geminiConfigured ? styles.badgeGreen : styles.badgeYellow) }}>
                            {diagnostics?.settings?.geminiConfigured ? 'Configured' : 'Not Set'}
                        </span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Longcat API</span>
                        <span style={{ ...styles.badge, ...(diagnostics?.settings?.longcatConfigured ? styles.badgeGreen : styles.badgeYellow) }}>
                            {diagnostics?.settings?.longcatConfigured ? 'Configured' : 'Not Set'}
                        </span>
                    </div>
                </div>

                {/* Tests */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <span style={{ fontSize: '24px' }}>🧪</span>
                        API Tests
                    </h3>
                    {tests.map(test => (
                        <div key={test.name} style={styles.testRow}>
                            <span style={styles.testName}>{test.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {testResults[test.name] && (
                                    <span style={{ ...styles.badge, ...(testResults[test.name].success ? styles.badgeGreen : styles.badgeRed) }}>
                                        {testResults[test.name].loading ? '...' : testResults[test.name].success ? '✓' : '✗'}
                                    </span>
                                )}
                                <button style={styles.testBtn} onClick={() => runTest(test.name, test.fn)}>Test</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Diagnostics
