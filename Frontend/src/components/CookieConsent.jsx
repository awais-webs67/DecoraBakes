import { useState, useEffect } from 'react'

function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent')
        if (!consent) {
            // Delay showing banner for better UX
            const timer = setTimeout(() => setShowBanner(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted')
        setShowBanner(false)
    }

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined')
        setShowBanner(false)
    }

    if (!showBanner) return null

    const styles = {
        overlay: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: '20px',
            pointerEvents: 'none'
        },
        banner: {
            maxWidth: '600px',
            margin: '0 auto',
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            pointerEvents: 'auto',
            animation: 'slideUp 0.5s ease'
        },
        icon: {
            fontSize: '28px',
            marginBottom: '4px'
        },
        title: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#222',
            marginBottom: '4px'
        },
        text: {
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.6'
        },
        link: {
            color: '#6B2346',
            textDecoration: 'underline',
            cursor: 'pointer'
        },
        buttons: {
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
        },
        btnAccept: {
            flex: 1,
            padding: '12px 24px',
            background: '#6B2346',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            minWidth: '120px'
        },
        btnDecline: {
            padding: '12px 24px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
        }
    }

    return (
        <>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
            <div style={styles.overlay}>
                <div style={styles.banner}>
                    <div>
                        <div style={styles.icon}>🍪</div>
                        <div style={styles.title}>We use cookies</div>
                        <p style={styles.text}>
                            We use cookies to enhance your experience, analyze traffic, and personalize content.
                            By clicking "Accept", you consent to our use of cookies.
                            Read our <a href="/privacy" style={styles.link}>Privacy Policy</a> for more info.
                        </p>
                    </div>
                    <div style={styles.buttons}>
                        <button style={styles.btnDecline} onClick={handleDecline}>
                            Decline
                        </button>
                        <button style={styles.btnAccept} onClick={handleAccept}>
                            Accept All Cookies
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CookieConsent
