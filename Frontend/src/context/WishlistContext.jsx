import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const WishlistContext = createContext()

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (!context) throw new Error('useWishlist must be used within WishlistProvider')
    return context
}

export function WishlistProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('decorabake_wishlist')
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('decorabake_wishlist', JSON.stringify(items))
    }, [items])

    const addToWishlist = useCallback((product) => {
        const id = product.id || product._id
        setItems(prev => {
            if (prev.find(item => (item.id || item._id) === id)) return prev
            return [...prev, {
                id,
                _id: id,
                name: product.name,
                price: product.price,
                salePrice: product.salePrice,
                image: product.image || product.images?.[0],
                images: product.images,
                slug: product.slug,
                category: product.category,
                categorySlug: product.categorySlug,
                stock: product.stock,
                addedAt: Date.now()
            }]
        })
    }, [])

    const removeFromWishlist = useCallback((productId) => {
        setItems(prev => prev.filter(item => (item.id || item._id) !== productId))
    }, [])

    const isInWishlist = useCallback((productId) => {
        return items.some(item => (item.id || item._id) === productId)
    }, [items])

    const toggleWishlist = useCallback((product) => {
        const id = product.id || product._id
        if (isInWishlist(id)) {
            removeFromWishlist(id)
            return false
        } else {
            addToWishlist(product)
            return true
        }
    }, [isInWishlist, removeFromWishlist, addToWishlist])

    const clearWishlist = useCallback(() => setItems([]), [])

    return (
        <WishlistContext.Provider value={{
            items,
            count: items.length,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            toggleWishlist,
            clearWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    )
}
