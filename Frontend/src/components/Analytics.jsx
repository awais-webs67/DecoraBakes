import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Google Analytics 4 + Facebook Pixel + Google Ads tracking component
 * Set your tracking IDs in the admin Settings panel or .env file
 * 
 * Usage: <Analytics gaId="G-XXXXXXXXXX" fbPixelId="XXXXXXXXXX" gadsId="AW-XXXXXXXXXX" />
 */
function Analytics({ gaId, fbPixelId, gadsId }) {
    const location = useLocation()

    // Initialize GA4
    useEffect(() => {
        if (!gaId) return

        // Load gtag.js
        if (!document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
            const script = document.createElement('script')
            script.async = true
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
            document.head.appendChild(script)

            const inlineScript = document.createElement('script')
            inlineScript.textContent = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: false });
                ${gadsId ? `gtag('config', '${gadsId}');` : ''}
            `
            document.head.appendChild(inlineScript)
        }
    }, [gaId, gadsId])

    // Initialize Facebook Pixel
    useEffect(() => {
        if (!fbPixelId) return

        if (!document.querySelector(`script[data-fb-pixel]`)) {
            const script = document.createElement('script')
            script.setAttribute('data-fb-pixel', 'true')
            script.textContent = `
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
                (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
            `
            document.head.appendChild(script)
        }
    }, [fbPixelId])

    // Track page views on route change
    useEffect(() => {
        if (gaId && window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: location.pathname
            })
        }
        if (fbPixelId && window.fbq) {
            window.fbq('track', 'PageView')
        }
    }, [location, gaId, fbPixelId])

    return null
}

// ─────────────────────────────────────
// E-commerce Event Tracking Helpers
// ─────────────────────────────────────

export function trackAddToCart(product, quantity = 1) {
    if (window.gtag) {
        window.gtag('event', 'add_to_cart', {
            currency: 'AUD',
            value: (product.salePrice || product.price) * quantity,
            items: [{
                item_id: product.id || product._id,
                item_name: product.name,
                price: product.salePrice || product.price,
                quantity
            }]
        })
    }
    if (window.fbq) {
        window.fbq('track', 'AddToCart', {
            content_ids: [product.id || product._id],
            content_name: product.name,
            content_type: 'product',
            value: (product.salePrice || product.price) * quantity,
            currency: 'AUD'
        })
    }
}

export function trackPurchase(order) {
    if (window.gtag) {
        window.gtag('event', 'purchase', {
            transaction_id: order.orderId || order._id,
            value: order.total,
            currency: 'AUD',
            shipping: order.shipping || 0,
            items: order.items?.map(item => ({
                item_id: item.productId || item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        })
    }
    if (window.fbq) {
        window.fbq('track', 'Purchase', {
            value: order.total,
            currency: 'AUD',
            content_ids: order.items?.map(i => i.productId || i.id),
            content_type: 'product',
            num_items: order.items?.length || 1
        })
    }
}

/**
 * Google Ads conversion tracking — fire on purchase
 * conversionId and conversionLabel come from your Google Ads account
 */
export function trackGoogleAdsConversion(order, conversionId, conversionLabel) {
    if (window.gtag && conversionId && conversionLabel) {
        window.gtag('event', 'conversion', {
            send_to: `${conversionId}/${conversionLabel}`,
            value: order.total,
            currency: 'AUD',
            transaction_id: order.orderId || order._id
        })
    }
}

export function trackViewProduct(product) {
    if (window.gtag) {
        window.gtag('event', 'view_item', {
            currency: 'AUD',
            value: product.salePrice || product.price,
            items: [{
                item_id: product.id || product._id,
                item_name: product.name,
                item_category: product.category,
                price: product.salePrice || product.price
            }]
        })
    }
    if (window.fbq) {
        window.fbq('track', 'ViewContent', {
            content_ids: [product.id || product._id],
            content_name: product.name,
            content_type: 'product',
            value: product.salePrice || product.price,
            currency: 'AUD'
        })
    }
}

export function trackBeginCheckout(items, total) {
    if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
            currency: 'AUD',
            value: total,
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                price: item.salePrice || item.price,
                quantity: item.quantity
            }))
        })
    }
    if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
            value: total,
            currency: 'AUD',
            num_items: items.length,
            content_type: 'product'
        })
    }
}

export function trackSearch(query) {
    if (window.gtag) {
        window.gtag('event', 'search', { search_term: query })
    }
    if (window.fbq) {
        window.fbq('track', 'Search', { search_string: query })
    }
}

export function trackViewCategory(categoryName) {
    if (window.gtag) {
        window.gtag('event', 'view_item_list', {
            item_list_name: categoryName
        })
    }
    if (window.fbq) {
        window.fbq('track', 'ViewContent', {
            content_category: categoryName,
            content_type: 'product_group'
        })
    }
}

export function trackWishlistAdd(product) {
    if (window.gtag) {
        window.gtag('event', 'add_to_wishlist', {
            currency: 'AUD',
            value: product.salePrice || product.price,
            items: [{
                item_id: product.id || product._id,
                item_name: product.name,
                price: product.salePrice || product.price
            }]
        })
    }
    if (window.fbq) {
        window.fbq('track', 'AddToWishlist', {
            content_ids: [product.id || product._id],
            content_name: product.name,
            value: product.salePrice || product.price,
            currency: 'AUD'
        })
    }
}

export default Analytics

