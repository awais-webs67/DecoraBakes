import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './context/ToastContext'
import { WishlistProvider } from './context/WishlistContext'

// Components
import Header from './components/Header'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'
import CookieConsent from './components/CookieConsent'
import ErrorBoundary from './components/ErrorBoundary'
import Analytics from './components/Analytics'
import EmailPopup from './components/EmailPopup'
import SocialProof from './components/SocialProof'

// Customer Pages
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Category from './pages/Category'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import Account from './pages/Account'
import Contact from './pages/Contact'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Blog from './pages/Blog'
import NotFound from './pages/NotFound'
import Wishlist from './pages/Wishlist'

// Admin Pages
import AdminLayout from './admin/AdminLayout'
import Login from './admin/Login'
import Dashboard from './admin/Dashboard'
import AdminProducts from './admin/Products'
import Categories from './admin/Categories'
import Orders from './admin/Orders'
import Customers from './admin/Customers'
import Slider from './admin/Slider'
import Sections from './admin/Sections'
import AdminPages from './admin/Pages'
import Testimonials from './admin/Testimonials'
import PromoCodes from './admin/PromoCodes'
import Refunds from './admin/Refunds'
import SupportChats from './admin/SupportChats'
import Reports from './admin/Reports'
import Settings from './admin/Settings'
import Diagnostics from './admin/Diagnostics'

// Customer Layout with Header, Footer, and ChatBot
function CustomerLayout() {
    return (
        <div className="customer-layout">
            <Analytics gaId={import.meta.env.VITE_GA_ID} fbPixelId={import.meta.env.VITE_FB_PIXEL_ID} gadsId={import.meta.env.VITE_GADS_ID} />
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
            <ChatBot />
            <CookieConsent />
            <EmailPopup />
            <SocialProof />
        </div>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <UserProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <ToastProvider>
                                    <Routes>
                                        {/* Customer Routes */}
                                        <Route element={<CustomerLayout />}>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/products" element={<Products />} />
                                            <Route path="/product/:id" element={<ProductDetail />} />
                                            <Route path="/category/:slug" element={<Category />} />
                                            <Route path="/cart" element={<Cart />} />
                                            <Route path="/checkout" element={<Checkout />} />
                                            <Route path="/checkout/success" element={<CheckoutSuccess />} />
                                            <Route path="/account" element={<Account />} />
                                            <Route path="/wishlist" element={<Wishlist />} />
                                            <Route path="/contact" element={<Contact />} />
                                            <Route path="/about" element={<About />} />
                                            <Route path="/privacy" element={<Privacy />} />
                                            <Route path="/blog" element={<Blog />} />
                                            <Route path="/blog/:slug" element={<Blog />} />
                                        </Route>

                                        {/* Admin Routes */}
                                        <Route path="/admin/login" element={<Login />} />
                                        <Route path="/admin" element={<AdminLayout />}>
                                            <Route index element={<Dashboard />} />
                                            <Route path="products" element={<AdminProducts />} />
                                            <Route path="categories" element={<Categories />} />
                                            <Route path="orders" element={<Orders />} />
                                            <Route path="customers" element={<Customers />} />
                                            <Route path="slider" element={<Slider />} />
                                            <Route path="sections" element={<Sections />} />
                                            <Route path="pages" element={<AdminPages />} />
                                            <Route path="testimonials" element={<Testimonials />} />
                                            <Route path="promo-codes" element={<PromoCodes />} />
                                            <Route path="refunds" element={<Refunds />} />
                                            <Route path="support" element={<SupportChats />} />
                                            <Route path="reports" element={<Reports />} />
                                            <Route path="settings" element={<Settings />} />
                                            <Route path="diagnostics" element={<Diagnostics />} />
                                        </Route>

                                        {/* 404 Not Found */}
                                        <Route path="*" element={<NotFound />} />
                                    </Routes>
                                </ToastProvider>
                            </WishlistProvider>
                        </CartProvider>
                    </UserProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
