import { Component } from 'react'
import { Link } from 'react-router-dom'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo })
        // Here you could log to an error reporting service like Sentry
        console.error('Error caught by boundary:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            const styles = {
                page: {
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa',
                    padding: '20px'
                },
                container: {
                    textAlign: 'center',
                    maxWidth: '500px'
                },
                icon: {
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 30px',
                    background: '#FFEBEE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '50px'
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
                    border: 'none',
                    cursor: 'pointer'
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
                    cursor: 'pointer'
                }
            }

            return (
                <div style={styles.page}>
                    <div style={styles.container}>
                        <div style={styles.icon}>
                            ⚠️
                        </div>
                        <h1 style={styles.title}>Something went wrong</h1>
                        <p style={styles.description}>
                            We're sorry, but something unexpected happened.
                            Please try again or go back to the homepage.
                        </p>
                        <div style={styles.buttons}>
                            <button style={styles.btnPrimary} onClick={this.handleRetry}>
                                Try Again
                            </button>
                            <Link to="/" style={styles.btnSecondary}>
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
