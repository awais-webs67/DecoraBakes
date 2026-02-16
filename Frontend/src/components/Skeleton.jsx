import { useState, useEffect } from 'react'

// Skeleton shimmer animation
const shimmerStyle = `
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
`

// Base skeleton with shimmer effect
function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) {
    return (
        <div style={{
            width,
            height,
            borderRadius,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            ...style
        }} />
    )
}

// Product card skeleton
export function ProductCardSkeleton() {
    return (
        <>
            <style>{shimmerStyle}</style>
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                <Skeleton height="200px" borderRadius="0" />
                <div style={{ padding: '16px' }}>
                    <Skeleton width="60%" height="12px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="90%" height="16px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height="20px" />
                </div>
            </div>
        </>
    )
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8, columns = 4 }) {
    return (
        <>
            <style>{shimmerStyle}</style>
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '24px'
            }}>
                {Array.from({ length: count }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </>
    )
}

// Text line skeleton
export function TextSkeleton({ lines = 3 }) {
    return (
        <>
            <style>{shimmerStyle}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton
                        key={i}
                        width={i === lines - 1 ? '60%' : '100%'}
                        height="14px"
                    />
                ))}
            </div>
        </>
    )
}

// Category card skeleton
export function CategoryCardSkeleton() {
    return (
        <>
            <style>{shimmerStyle}</style>
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                <Skeleton height="160px" borderRadius="0" />
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Skeleton width="70%" height="18px" style={{ margin: '0 auto' }} />
                </div>
            </div>
        </>
    )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }) {
    return (
        <>
            <style>{shimmerStyle}</style>
            <tr>
                {Array.from({ length: columns }).map((_, i) => (
                    <td key={i} style={{ padding: '16px' }}>
                        <Skeleton width={i === 0 ? '40px' : '80%'} height="16px" />
                    </td>
                ))}
            </tr>
        </>
    )
}

// Full page loading skeleton
export function PageSkeleton() {
    return (
        <>
            <style>{shimmerStyle}</style>
            <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <Skeleton width="200px" height="32px" style={{ marginBottom: '24px' }} />
                <Skeleton width="400px" height="18px" style={{ marginBottom: '40px' }} />
                <ProductGridSkeleton count={8} columns={4} />
            </div>
        </>
    )
}

// Inline loading spinner
export function LoadingSpinner({ size = 24, color = '#6B2346' }) {
    return (
        <>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <div style={{
                display: 'inline-block',
                width: size,
                height: size,
                border: `3px solid ${color}20`,
                borderTop: `3px solid ${color}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
        </>
    )
}

// Default export
export default Skeleton
