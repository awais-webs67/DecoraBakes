import { Link } from 'react-router-dom'

function NotFound() {
    const styles = {
        page: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
            padding: '20px'
        },
        container: {
            textAlign: 'center',
            maxWidth: '500px'
        },
        errorCode: {
            fontSize: '150px',
            fontWeight: '800',
            color: '#6B2346',
            lineHeight: '1',
            marginBottom: '20px',
            fontFamily: "'Playfair Display', serif"
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#222',
            marginBottom: '16px',
            fontFamily: "'Playfair Display', serif"
        },
        description: {
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.7',
            marginBottom: '32px'
        },
        buttons: {
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
        },
        btnPrimary: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            background: '#6B2346',
            color: '#fff',
            borderRadius: '50px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.3s'
        },
        btnSecondary: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            background: 'transparent',
            color: '#6B2346',
            border: '2px solid #6B2346',
            borderRadius: '50px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.3s'
        },
        illustration: {
            width: '200px',
            height: '200px',
            margin: '0 auto 30px',
            background: '#FCE8ED',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px'
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.illustration}>
                    🎂
                </div>
                <div style={styles.errorCode}>404</div>
                <h1 style={styles.title}>Page Not Found</h1>
                <p style={styles.description}>
                    Oops! The page you're looking for seems to have crumbled away.
                    Let's get you back to our delicious cake decorating supplies!
                </p>
                <div style={styles.buttons}>
                    <Link to="/" style={styles.btnPrimary}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                        Go Home
                    </Link>
                    <Link to="/products" style={styles.btnSecondary}>
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default NotFound
