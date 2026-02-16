import { createContext, useContext, useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'

const AuthContext = createContext()

const getAdminToken = () => localStorage.getItem('decorabake_admin_token')
const setAdminToken = (token) => localStorage.setItem('decorabake_admin_token', token)
const removeAdminToken = () => localStorage.removeItem('decorabake_admin_token')

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = getAdminToken()
        if (token) {
            const saved = localStorage.getItem('decorabake_admin')
            if (saved) try { setAdmin(JSON.parse(saved)) } catch { removeAdminToken() }
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            if (!res.ok) throw new Error((await res.json()).message || 'Login failed')
            const data = await res.json()
            setAdmin(data.admin)
            setAdminToken(data.token)
            localStorage.setItem('decorabake_admin', JSON.stringify(data.admin))
            return { success: true }
        } catch (err) { return { success: false, error: err.message } }
    }

    const logout = () => {
        setAdmin(null)
        removeAdminToken()
        localStorage.removeItem('decorabake_admin')
    }

    const isAuthenticated = admin !== null

    return (
        <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated, getAdminToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}

