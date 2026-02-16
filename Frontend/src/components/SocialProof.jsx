import { useState, useEffect } from 'react'

/**
 * Social proof "Recently Purchased" notification
 * Shows simulated purchase notifications to create urgency
 */
function SocialProof() {
    const [notification, setNotification] = useState(null)
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    const names = [
        'Sarah from Sydney', 'Emma from Melbourne', 'Olivia from Brisbane',
        'Ava from Perth', 'Charlotte from Adelaide', 'Mia from Gold Coast',
        'Amelia from Canberra', 'Harper from Hobart', 'Ella from Darwin',
        'Isabella from Newcastle', 'Sophia from Wollongong', 'Grace from Geelong',
        'Lily from Cairns', 'Chloe from Townsville', 'Zoe from Toowoomba'
    ]

    const products = [
        'Fondant Rolling Set', 'Rainbow Sprinkle Mix', 'Piping Tip Collection',
        'Edible Gold Leaf', 'Cake Turntable Pro', 'Silicone Mould Set',
        'Food Colouring Gel Pack', 'Cake Leveler', 'Flower Nail Kit',
        'Ganache Drip Bottle', 'Buttercream Smoother', 'Wafer Paper Sheets'
    ]

    const timesAgo = ['2 minutes ago', '5 minutes ago', '8 minutes ago', '12 minutes ago', '15 minutes ago', '23 minutes ago', '35 minutes ago', '1 hour ago']

    useEffect(() => {
        if (dismissed) return

        const showNotification = () => {
            const name = names[Math.floor(Math.random() * names.length)]
            const product = products[Math.floor(Math.random() * products.length)]
            const time = timesAgo[Math.floor(Math.random() * timesAgo.length)]

            setNotification({ name, product, time })
            setVisible(true)

            // Auto-hide after 5 seconds
            setTimeout(() => {
                setVisible(false)
            }, 5000)
        }

        // First notification after 20 seconds
        const firstTimer = setTimeout(showNotification, 20000)

        // Then every 30-60 seconds
        const interval = setInterval(() => {
            if (!dismissed) showNotification()
        }, 30000 + Math.random() * 30000)

        return () => {
            clearTimeout(firstTimer)
            clearInterval(interval)
        }
    }, [dismissed])

    if (!notification || dismissed) return null

    const isMobile = window.innerWidth < 768

    return (
        <>
            <div style={{
                position: 'fixed',
                bottom: isMobile ? '80px' : '24px',
                left: isMobile ? '12px' : '24px',
                maxWidth: isMobile ? 'calc(100% - 24px)' : '340px',
                background: '#fff',
                borderRadius: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                padding: '16px',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transform: visible ? 'translateY(0)' : 'translateY(120%)',
                opacity: visible ? 1 : 0,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #f0f0f0'
            }}>
                {/* Shopping bag icon */}
                <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FCE8ED, #f5d5de)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#6B2346">
                        <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 14H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v10z" />
                    </svg>
                </div>

                <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#222', fontWeight: '600', lineHeight: '1.4' }}>
                        {notification.name}
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#555', lineHeight: '1.3' }}>
                        purchased <strong style={{ color: '#6B2346' }}>{notification.product}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>
                        {notification.time} • ✓ Verified Purchase
                    </p>
                </div>

                <button
                    onClick={() => setDismissed(true)}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0', fontSize: '16px', lineHeight: 1 }}
                >
                    ✕
                </button>
            </div>
        </>
    )
}

export default SocialProof
