// Admin API helper - automatically includes auth token with all requests
import API_BASE_URL from './api'

const getToken = () => localStorage.getItem('decorabake_admin_token')

const adminHeaders = (extra = {}) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    ...extra
})

export const adminApi = {
    get: async (endpoint) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        })
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('decorabake_admin_token')
            localStorage.removeItem('decorabake_admin')
            window.location.href = '/admin/login'
            throw new Error('Session expired')
        }
        return res.json()
    },
    post: async (endpoint, data) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify(data)
        })
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('decorabake_admin_token')
            localStorage.removeItem('decorabake_admin')
            window.location.href = '/admin/login'
            throw new Error('Session expired')
        }
        return res.json()
    },
    put: async (endpoint, data) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify(data)
        })
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('decorabake_admin_token')
            localStorage.removeItem('decorabake_admin')
            window.location.href = '/admin/login'
            throw new Error('Session expired')
        }
        return res.json()
    },
    delete: async (endpoint) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        })
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('decorabake_admin_token')
            localStorage.removeItem('decorabake_admin')
            window.location.href = '/admin/login'
            throw new Error('Session expired')
        }
        return res.json()
    },
    upload: async (endpoint, formData) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData
        })
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('decorabake_admin_token')
            localStorage.removeItem('decorabake_admin')
            window.location.href = '/admin/login'
            throw new Error('Session expired')
        }
        return res.json()
    }
}

export default adminApi
