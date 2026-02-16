import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin')
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(credentials.username, credentials.password)
            if (result.success) {
                navigate('/admin')
            } else {
                setError(result.error || 'Invalid username or password')
            }
        } catch (err) {
            setError('Login failed. Please try again.')
        }
        setLoading(false)
    }

    const styles = {
        page: { minHeight: '100vh', background: 'linear-gradient(135deg, #6B2346 0%, #4A1830 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
        card: { background: '#fff', borderRadius: '24px', padding: '50px 40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
        logo: { textAlign: 'center', marginBottom: '30px' },
        logoImg: { height: '60px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: '8px' },
        subtitle: { fontSize: '15px', color: '#666', textAlign: 'center', marginBottom: '32px' },
        error: { background: '#FFEBEE', color: '#C62828', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box', transition: 'border-color 0.2s' },
        submitBtn: { width: '100%', padding: '16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
        hint: { marginTop: '30px', paddingTop: '24px', borderTop: '1px solid #eee', textAlign: 'center' },
        hintText: { fontSize: '13px', color: '#888' }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <img src="/logo.png" alt="DecoraBake" style={styles.logoImg} />
                </div>

                <h1 style={styles.title}>Admin Login</h1>
                <p style={styles.subtitle}>Sign in to manage your store</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={credentials.username}
                            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                            placeholder="Enter username"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={credentials.password}
                            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                            placeholder="Enter password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={styles.hint}>
                    <p style={styles.hintText}>
                        Default credentials can be changed in Settings after login
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
