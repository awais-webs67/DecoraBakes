import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import API_BASE_URL from '../config/api'

function Blog() {
    const { slug } = useParams()
    const [posts, setPosts] = useState([])
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({})
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        setLoading(true)
        if (slug) {
            // Single blog post
            Promise.all([
                fetch(`${API_BASE_URL}/api/pages/${slug}`).then(r => r.json()).catch(() => null),
                fetch(`${API_BASE_URL}/api/blog`).then(r => r.json()).catch(() => []),
                fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
            ]).then(([pageData, blogData, settingsData]) => {
                if (pageData && !pageData.error) setPost(pageData)
                setPosts(Array.isArray(blogData) ? blogData : [])
                setSettings(settingsData || {})
                setLoading(false)
            })
        } else {
            // Blog listing
            Promise.all([
                fetch(`${API_BASE_URL}/api/blog`).then(r => r.json()).catch(() => []),
                fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
            ]).then(([blogData, settingsData]) => {
                setPosts(Array.isArray(blogData) ? blogData : [])
                setSettings(settingsData || {})
                setLoading(false)
            })
        }
    }, [slug])

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #6B2346', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // Single blog post view
    if (slug && post) {
        const recentPosts = posts.filter(p => p.slug !== slug).slice(0, 4)

        return (
            <div style={{ minHeight: '100vh', background: '#fafafa' }}>
                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '80px 20px 60px' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', marginBottom: '24px' }}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                            Back to Blog
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: '600' }}>
                                {new Date(post.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h1 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '28px' : '42px', fontWeight: '700', color: '#ffffff', lineHeight: '1.3', marginBottom: '20px' }}>{post.title}</h1>
                        {post.excerpt && (
                            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7' }}>{post.excerpt}</p>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? '1fr' : '1fr 300px', gap: '40px' }}>
                        {/* Article */}
                        <article style={{ background: '#fff', borderRadius: '24px', padding: '50px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                            {post.featuredImage && (
                                <img
                                    src={post.featuredImage.startsWith('/uploads') ? `${API_BASE_URL}${post.featuredImage}` : post.featuredImage}
                                    alt={post.title}
                                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '30px' }}
                                />
                            )}
                            <div style={{ fontSize: '17px', lineHeight: '2', color: '#444' }} dangerouslySetInnerHTML={{ __html: post.content }} />

                            {/* Share */}
                            <div style={{ borderTop: '1px solid #eee', marginTop: '40px', paddingTop: '30px' }}>
                                <p style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Share this article:</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', background: '#3b5998', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
                                    </a>
                                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', background: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M18.205 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.044 19.77h1.833L7.045 4.126H5.078Z" /></svg>
                                    </a>
                                    <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', background: '#E60023', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2Z" /></svg>
                                    </a>
                                </div>
                            </div>
                        </article>

                        {/* Sidebar */}
                        <aside>
                            {/* About */}
                            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#222' }}>About {settings.siteName || 'DecoraBake'}</h3>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
                                    Australia's premier destination for cake decorating supplies. Tips, tutorials, and inspiration for bakers of all levels.
                                </p>
                            </div>

                            {/* Recent Posts */}
                            {recentPosts.length > 0 && (
                                <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#222' }}>Recent Posts</h3>
                                    {recentPosts.map(p => (
                                        <Link key={p._id} to={`/blog/${p.slug}`} style={{ display: 'block', textDecoration: 'none', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '6px', lineHeight: '1.4' }}>{p.title}</h4>
                                            <span style={{ fontSize: '12px', color: '#888' }}>{new Date(p.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        )
    }

    // Blog listing
    const filteredPosts = searchTerm
        ? posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : posts

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', padding: '100px 20px 80px', textAlign: 'center' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: '50px', marginBottom: '20px' }}>
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500', letterSpacing: '1px' }}>OUR BLOG</span>
                    </div>
                    <h1 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '32px' : '48px', fontWeight: '700', color: '#ffffff', marginBottom: '20px' }}>Baking Tips & Inspiration</h1>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7' }}>
                        Tutorials, tips, and tricks from our team of baking experts
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1100px', margin: '-40px auto 0', padding: '0 20px 80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? '1fr' : '1fr 300px', gap: '30px' }}>
                    {/* Posts */}
                    <div>
                        {filteredPosts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                {filteredPosts.map((p, i) => (
                                    <Link key={p._id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                                        <article style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', display: i === 0 ? 'block' : 'flex' }}>
                                            <div style={{ width: i === 0 ? '100%' : '200px', height: i === 0 ? '280px' : '150px', background: 'linear-gradient(135deg, #FCE8ED 0%, #fff5f7 100%)', flexShrink: 0 }}>
                                                {p.featuredImage ? (
                                                    <img src={p.featuredImage.startsWith('/uploads') ? `${API_BASE_URL}${p.featuredImage}` : p.featuredImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' }}>📝</div>
                                                )}
                                            </div>
                                            <div style={{ padding: i === 0 ? '30px' : '24px', flex: 1 }}>
                                                <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    {new Date(p.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                <h2 style={{ fontSize: i === 0 ? '26px' : '18px', fontWeight: '700', color: '#222', marginTop: '10px', marginBottom: '12px', lineHeight: '1.4' }}>{p.title}</h2>
                                                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.7', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {p.excerpt || p.content?.replace(/<[^>]*>/g, '').substring(0, 150)}
                                                </p>
                                                <div style={{ marginTop: '16px', color: '#6B2346', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    Read More
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div style={{ background: '#fff', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#FCE8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', fontSize: '50px' }}>✍️</div>
                                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px', color: '#222' }}>Coming Soon!</h2>
                                <p style={{ fontSize: '16px', color: '#666', maxWidth: '400px', margin: '0 auto 30px', lineHeight: '1.7' }}>
                                    We're working on some amazing baking tips, tutorials, and inspiration. Check back soon!
                                </p>
                                <Link to="/products" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', color: '#fff', borderRadius: '50px', textDecoration: 'none', fontWeight: '600' }}>
                                    Browse Products
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside>
                        {/* Search */}
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#222' }}>Search</h3>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px 12px 44px', border: '2px solid #eee', borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="#999" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                            </div>
                        </div>

                        {/* About */}
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#222' }}>About Our Blog</h3>
                            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
                                Welcome to the {settings.siteName || 'DecoraBake'} blog! Here you'll find baking tips, tutorials, product guides, and inspiration for your next masterpiece.
                            </p>
                        </div>

                        {/* Categories */}
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#222' }}>Categories</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Tutorials', 'Tips & Tricks', 'Product Guides', 'Inspiration', 'Recipes'].map(cat => (
                                    <span key={cat} style={{ padding: '8px 14px', background: '#f5f5f5', borderRadius: '50px', fontSize: '13px', color: '#555' }}>{cat}</span>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', borderRadius: '20px', padding: '30px', color: '#fff' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#ffffff' }}>Subscribe</h3>
                            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px', color: '#ffffff' }}>Get the latest tips delivered to your inbox</p>
                            <input type="email" placeholder="Your email" style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: '10px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }} />
                            <button style={{ width: '100%', padding: '12px', background: '#fff', color: '#6B2346', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Subscribe</button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Blog
