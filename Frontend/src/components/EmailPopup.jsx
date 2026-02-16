import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import API_BASE_URL from '../config/api'

/**
 * Email popup that appears after 15 seconds for first-time visitors
 * Offers 10% off first order in exchange for email
 */
function EmailPopup() {
    const [show, setShow] = useState(false)
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [closing, setClosing] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        // Don't show if already dismissed or subscribed
        if (localStorage.getItem('db_email_popup_done')) return

        const timer = setTimeout(() => setShow(true), 15000)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setClosing(true)
        setTimeout(() => {
            setShow(false)
            setClosing(false)
            localStorage.setItem('db_email_popup_done', Date.now())
        }, 300)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return
        try {
            await fetch(`${API_BASE_URL}/api/newsletter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            setSubmitted(true)
            localStorage.setItem('db_email_popup_done', 'subscribed')
            showToast('Welcome! Check your email for your discount code 🎉', 'success')
            setTimeout(handleClose, 3000)
        } catch {
            showToast('Something went wrong. Please try again.', 'error')
        }
    }

    if (!show) return null

    const isMobile = window.innerWidth < 768

    return (
        <div style={{ ...s.overlay, ...(closing ? s.overlayClosing : {}) }} onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div style={{ ...s.modal, ...(closing ? s.modalClosing : {}), ...(isMobile ? s.modalMobile : {}) }}>
                <button onClick={handleClose} style={s.close}>✕</button>

                {!submitted ? (
                    <>
                        <div style={s.badge}>✨ WELCOME OFFER</div>
                        <h2 style={s.title}>Get <span style={s.discount}>10% OFF</span></h2>
                        <p style={s.subtitle}>your first order</p>
                        <p style={s.desc}>Join our community of cake decorators and get exclusive deals, new product alerts, and baking tips.</p>
                        <form onSubmit={handleSubmit} style={s.form}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                style={s.input}
                            />
                            <button type="submit" style={s.btn}>Get My 10% Off</button>
                        </form>
                        <button onClick={handleClose} style={s.noThanks}>No thanks, I'll pay full price</button>
                    </>
                ) : (
                    <div style={s.successContent}>
                        <div style={s.checkCircle}>✓</div>
                        <h2 style={{ ...s.title, marginTop: '16px' }}>You're In!</h2>
                        <p style={s.desc}>Check your email for your exclusive 10% discount code. Happy baking! 🎂</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popupSlideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                @keyframes popupFadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes popupSlideDown { from { transform: translateY(0) scale(1); opacity: 1; } to { transform: translateY(30px) scale(0.95); opacity: 0; } }
            `}</style>
        </div>
    )
}

const s = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'popupFadeIn 0.3s ease', backdropFilter: 'blur(3px)', padding: '20px' },
    overlayClosing: { animation: 'popupFadeOut 0.3s ease forwards' },
    modal: { background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '420px', width: '100%', textAlign: 'center', position: 'relative', animation: 'popupSlideUp 0.4s ease', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' },
    modalClosing: { animation: 'popupSlideDown 0.3s ease forwards' },
    modalMobile: { padding: '36px 24px' },
    close: { position: 'absolute', top: '14px', right: '14px', background: '#f5f5f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' },
    badge: { display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#6B2346', background: '#FCE8ED', padding: '6px 16px', borderRadius: '20px', letterSpacing: '1px', marginBottom: '20px' },
    title: { fontSize: '32px', fontWeight: '700', color: '#222', margin: '0 0 4px', fontFamily: "'Playfair Display', serif", lineHeight: '1.2' },
    discount: { color: '#6B2346' },
    subtitle: { fontSize: '20px', color: '#888', margin: '0 0 16px', fontWeight: '400' },
    desc: { fontSize: '14px', color: '#888', lineHeight: '1.6', marginBottom: '24px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'border 0.2s', textAlign: 'center' },
    btn: { padding: '16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s' },
    noThanks: { background: 'none', border: 'none', color: '#aaa', fontSize: '12px', cursor: 'pointer', marginTop: '16px', textDecoration: 'underline' },
    successContent: { padding: '20px 0' },
    checkCircle: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6B2346, #C64977)', color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }
}

export default EmailPopup
