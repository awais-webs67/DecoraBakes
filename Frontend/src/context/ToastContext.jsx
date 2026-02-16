import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}

function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null

    const styles = {
        container: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '380px'
        },
        toast: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            animation: 'slideInRight 0.3s ease',
            cursor: 'pointer'
        },
        success: { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' },
        error: { background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A' },
        warning: { background: '#FFF3E0', color: '#E65100', border: '1px solid #FFCC80' },
        info: { background: '#E3F2FD', color: '#1565C0', border: '1px solid #90CAF9' },
        icon: { flexShrink: 0, width: '20px', height: '20px' },
        message: { flex: 1, fontSize: '14px', fontWeight: '500', lineHeight: '1.4' }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <svg viewBox="0 0 24 24" fill="currentColor" style={styles.icon}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            case 'error':
                return <svg viewBox="0 0 24 24" fill="currentColor" style={styles.icon}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
            case 'warning':
                return <svg viewBox="0 0 24 24" fill="currentColor" style={styles.icon}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
            default:
                return <svg viewBox="0 0 24 24" fill="currentColor" style={styles.icon}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
        }
    }

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
            <div style={styles.container}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{ ...styles.toast, ...styles[toast.type] }}
                        onClick={() => removeToast(toast.id)}
                    >
                        {getIcon(toast.type)}
                        <span style={styles.message}>{toast.message}</span>
                    </div>
                ))}
            </div>
        </>
    )
}
