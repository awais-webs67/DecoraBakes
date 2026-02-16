import { useEffect } from 'react'

/**
 * Hook to set page title, meta tags, Open Graph, and structured data for SEO
 * @param {Object} options - SEO options
 * @param {string} options.title - Page title
 * @param {string} options.description - Meta description
 * @param {string} options.image - Open Graph image URL
 * @param {string} options.url - Canonical URL
 * @param {string} options.type - Page type (website, product, article)
 * @param {Object} options.product - Product data for structured data
 * @param {Object} options.breadcrumbs - Breadcrumb data for structured data
 */
export function useSEO({ title, description, image, url, type = 'website', product, breadcrumbs }) {
    useEffect(() => {
        const siteName = 'DecoraBake'
        const defaultDescription = "Australia's premier cake decorating supplies store. Find everything you need to create stunning cakes and desserts."
        const siteUrl = window.location.origin

        // Set page title
        document.title = title ? `${title} | ${siteName}` : siteName

        // Set or update meta description
        setMeta('name', 'description', description || defaultDescription)

        // Set canonical URL
        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.rel = 'canonical'
            document.head.appendChild(canonical)
        }
        canonical.href = url || window.location.href.split('?')[0]

        // Set Open Graph tags
        const ogTags = {
            'og:title': title ? `${title} | ${siteName}` : siteName,
            'og:description': description || defaultDescription,
            'og:type': type === 'product' ? 'product' : type === 'article' ? 'article' : 'website',
            'og:site_name': siteName,
            'og:url': url || window.location.href
        }
        if (image) ogTags['og:image'] = image.startsWith('http') ? image : `${siteUrl}${image}`

        Object.entries(ogTags).forEach(([property, content]) => {
            setMeta('property', property, content)
        })

        // Set Twitter Card tags
        setMeta('name', 'twitter:card', 'summary_large_image')
        setMeta('name', 'twitter:title', ogTags['og:title'])
        setMeta('name', 'twitter:description', ogTags['og:description'])
        if (image) setMeta('name', 'twitter:image', ogTags['og:image'])

        // Remove old structured data
        document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove())

        // Add product structured data (JSON-LD)
        if (product) {
            addJsonLd({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.name,
                description: product.description || defaultDescription,
                image: product.images?.map(img => img.startsWith('http') ? img : `${siteUrl}${img}`) || [],
                sku: product.sku || product.id,
                brand: { '@type': 'Brand', name: siteName },
                offers: {
                    '@type': 'Offer',
                    url: url || window.location.href,
                    priceCurrency: 'AUD',
                    price: product.salePrice || product.price,
                    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    seller: { '@type': 'Organization', name: siteName }
                },
                ...(product.rating && {
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: product.rating,
                        reviewCount: product.reviewCount || 1
                    }
                })
            })
        }

        // Add breadcrumb structured data
        if (breadcrumbs && breadcrumbs.length > 0) {
            addJsonLd({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((crumb, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: crumb.name,
                    item: crumb.url ? `${siteUrl}${crumb.url}` : undefined
                }))
            })
        }

        // Organization structured data on homepage
        if (!product && type === 'website' && (url === '/' || !url)) {
            addJsonLd({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: siteName,
                url: siteUrl,
                logo: `${siteUrl}/logo.png`,
                description: defaultDescription,
                address: { '@type': 'PostalAddress', addressCountry: 'AU', addressLocality: 'Sydney', addressRegion: 'NSW' }
            })
        }

        return () => {
            document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove())
        }
    }, [title, description, image, url, type, product, breadcrumbs])
}

function setMeta(attr, name, content) {
    let tag = document.querySelector(`meta[${attr}="${name}"]`)
    if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, name)
        document.head.appendChild(tag)
    }
    tag.content = content
}

function addJsonLd(data) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-seo-ld', 'true')
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
}

/**
 * Simple function to set just the page title
 */
export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} | DecoraBake` : 'DecoraBake'
    }, [title])
}

export default useSEO
