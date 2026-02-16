import { createContext, useContext, useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'

const UserContext = createContext()

const getToken = () => localStorage.getItem('decorabake_token')
const setToken = (token) => localStorage.setItem('decorabake_token', token)
const removeToken = () => localStorage.removeItem('decorabake_token')

export function UserProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = getToken()
        if (token) {
            fetch(`${API_BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setUser(data); else removeToken() })
                .catch(() => removeToken())
                .finally(() => setLoading(false))
        } else setLoading(false)
    }, [])

    const register = async (userData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })
            const data = await res.json()
            if (!res.ok) return { success: false, error: data.error }
            setUser(data.user); setToken(data.token)
            return { success: true }
        } catch { return { success: false, error: 'Network error' } }
    }

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()
            if (!res.ok) return { success: false, error: data.error }
            setUser(data.user); setToken(data.token)
            return { success: true }
        } catch { return { success: false, error: 'Network error' } }
    }

    const logout = () => { setUser(null); removeToken() }

    const updateProfile = async (updates) => {
        if (!user) return { success: false, error: 'Not logged in' }
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify(updates)
            })
            const data = await res.json()
            if (!res.ok) return { success: false, error: data.error }
            setUser(data.user)
            return { success: true }
        } catch { return { success: false, error: 'Network error' } }
    }

    const getUserOrders = async () => {
        if (!user) return []
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user._id}/orders`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })
            return res.ok ? await res.json() : []
        } catch { return [] }
    }

    return (
        <UserContext.Provider value={{ user, loading, isLoggedIn: !!user, register, login, logout, updateProfile, getUserOrders, token: getToken() }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (!context) throw new Error('useUser must be used within UserProvider')
    return context
}

