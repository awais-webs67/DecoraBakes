import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import fs from 'fs'
import Stripe from 'stripe'
import { User, Product, Category, Order, PromoCode, Testimonial, Slider, Settings, Section, Cart, Review, Page, Refund, SupportChat } from './models.js'
import { sendOrderConfirmation, sendWelcomeEmail, sendShippingNotification, testEmailConnection } from './emailService.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this'
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

// ==================== SECURITY MIDDLEWARE ====================
// Helmet - Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// Compression - GZIP responses
app.use(compression())

// Rate limiting - General API
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: IS_PRODUCTION ? 200 : 1000, message: { error: 'Too many requests, please try again later' } }))

// Stricter rate limit for auth endpoints
app.use('/api/users/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts, please try again later' } }))
app.use('/api/users/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many registration attempts' } }))

// CORS - Use environment variable in production
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174').split(',').map(u => u.trim())
// Also allow common local variants
if (!IS_PRODUCTION) {
    ;['http://127.0.0.1:5173', 'http://127.0.0.1:5174'].forEach(u => { if (!allowedOrigins.includes(u)) allowedOrigins.push(u) })
}
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        if (!IS_PRODUCTION) return callback(null, true) // Allow all only in development
        callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))
// Stripe webhook needs raw body BEFORE json parser
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event
    try {
        event = webhookSecret
            ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
            : JSON.parse(req.body)
    } catch (err) {
        console.error('Stripe webhook error:', err.message)
        return res.status(400).json({ error: 'Webhook signature failed' })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        try {
            // Generate sequential order ID
            const lastOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderId')
            let nextNum = 1
            if (lastOrder?.orderId) {
                const match = lastOrder.orderId.match(/ORD-(\d+)/)
                if (match) nextNum = parseInt(match[1]) + 1
            }
            const orderId = `ORD-${String(nextNum).padStart(4, '0')}`

            // Parse metadata from session
            const metadata = session.metadata || {}
            const items = JSON.parse(metadata.items || '[]')
            const customerData = JSON.parse(metadata.customer || '{}')
            const shippingData = JSON.parse(metadata.shipping || '{}')

            const orderData = {
                orderId,
                customer: {
                    email: session.customer_email || customerData.email,
                    firstName: customerData.firstName,
                    lastName: customerData.lastName,
                    name: `${customerData.firstName} ${customerData.lastName}`,
                    phone: customerData.phone
                },
                shipping: shippingData,
                items,
                subtotal: parseFloat(metadata.subtotal) || 0,
                shippingCost: parseFloat(metadata.shippingCost) || 0,
                promoDiscount: parseFloat(metadata.promoDiscount) || 0,
                promoCode: metadata.promoCode || null,
                total: (session.amount_total || 0) / 100,
                paymentMethod: 'stripe',
                paymentStatus: 'paid',
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent,
                status: 'processing'
            }

            const order = await Order.create(orderData)

            // Decrement stock
            for (const item of items) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -(item.quantity || 1) } })
            }

            // Increment promo usage
            if (metadata.promoCode) {
                await PromoCode.findOneAndUpdate(
                    { code: metadata.promoCode.toUpperCase() },
                    { $inc: { usageCount: 1 } }
                )
            }

            // Send confirmation emails
            const settings = await Settings.findOne()
            try {
                if (settings) await sendOrderConfirmation(settings, order)
            } catch (emailErr) { console.error('Order email error:', emailErr.message) }

            try {
                if (settings?.emailEnabled && settings?.adminEmail) {
                    const { sendAdminOrderNotification } = await import('./emailService.js')
                    await sendAdminOrderNotification(settings, order)
                }
            } catch (emailErr) { if (!IS_PRODUCTION) console.error('Admin notification error:', emailErr.message) }

            console.log(`✅ Stripe order created: ${orderId}`)
        } catch (err) {
            console.error('Stripe webhook order creation error:', err.message)
        }
    }

    res.json({ received: true })
})

// Body parser with size limit
app.use(express.json({ limit: '1mb' }))

// Uploads directory
const uploadsDir = join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// File upload config with type validation
const allowedFileTypes = /jpeg|jpg|png|gif|webp|svg|avif/
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extname(file.originalname).toLowerCase()}`)
})
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = allowedFileTypes.test(extname(file.originalname).toLowerCase())
        const mime = allowedFileTypes.test(file.mimetype)
        if (ext && mime) return cb(null, true)
        cb(new Error('Only image files (jpg, png, gif, webp, svg) are allowed'))
    }
})

// Error handler helper
const apiError = (res, err, status = 500) => {
    if (!IS_PRODUCTION) console.error(err)
    res.status(status).json({ error: IS_PRODUCTION ? 'Server error' : err.message })
}

// ==================== AUTH MIDDLEWARE ====================
// JWT Middleware - verifies token for any logged-in user
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Token required' })
    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        res.status(403).json({ error: 'Invalid token' })
    }
}

// Admin Middleware - verifies token AND admin role
const adminMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Token required' })
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
        req.user = decoded
        next()
    } catch {
        res.status(403).json({ error: 'Invalid token' })
    }
}

const generateToken = (user) => jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected!')
        if (!(await Settings.findOne())) await Settings.create({})
    })
    .catch(err => {
        console.error('❌ MongoDB error:', err.message)
        process.exit(1)
    })

// ==================== USER AUTH ====================
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body
        if (!email || !password || !firstName || !lastName) return res.status(400).json({ error: 'All fields required' })
        if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' })
        if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ error: 'Email already registered' })

        const user = await User.create({ email, password, firstName, lastName, phone })
        const token = generateToken(user)
        const userObj = user.toObject(); delete userObj.password

        // Send welcome email
        try {
            const settings = await Settings.findOne()
            if (settings) await sendWelcomeEmail(settings, user)
        } catch (emailErr) { console.error('Welcome email error:', emailErr.message) }

        res.status(201).json({ success: true, user: userObj, token })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' })

        const token = generateToken(user)
        const userObj = user.toObject(); delete userObj.password
        res.json({ success: true, user: userObj, token })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Not authorized' })
        const { email, password, ...updates } = req.body
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
        res.json({ success: true, user })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/users/:id/orders', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ error: 'User not found' })
        const orders = await Order.find({ 'customer.email': user.email.toLowerCase() }).sort({ createdAt: -1 })
        res.json(orders)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Password update endpoint
app.put('/api/users/:id/password', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Not authorized' })
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' })
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' })

        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ error: 'User not found' })

        const isMatch = await user.comparePassword(currentPassword)
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' })

        user.password = newPassword
        await user.save()
        res.json({ success: true, message: 'Password updated successfully' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CART ENDPOINTS ====================
// Get user's cart
app.get('/api/cart', authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id })
        if (!cart) cart = { items: [] }
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update entire cart (sync from frontend)
app.put('/api/cart', authMiddleware, async (req, res) => {
    try {
        const { items } = req.body
        let cart = await Cart.findOneAndUpdate(
            { userId: req.user.id },
            { userId: req.user.id, items },
            { upsert: true, new: true }
        )
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add item to cart
app.post('/api/cart/add', authMiddleware, async (req, res) => {
    try {
        const { productId, name, price, salePrice, image, quantity = 1 } = req.body
        let cart = await Cart.findOne({ userId: req.user.id })

        if (!cart) {
            cart = await Cart.create({ userId: req.user.id, items: [{ productId, name, price, salePrice, image, quantity }] })
        } else {
            const existingItem = cart.items.find(item => item.productId === productId)
            if (existingItem) {
                existingItem.quantity += quantity
            } else {
                cart.items.push({ productId, name, price, salePrice, image, quantity })
            }
            await cart.save()
        }
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Remove item from cart
app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id })
        if (!cart) return res.status(404).json({ error: 'Cart not found' })

        cart.items = cart.items.filter(item => item.productId !== req.params.productId)
        await cart.save()
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Clear cart
app.delete('/api/cart', authMiddleware, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user.id })
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Helper to convert relative paths to full URLs
const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === '/' || imagePath === '') return '/placeholder.svg'
    if (imagePath.startsWith('http')) return imagePath
    if (imagePath.startsWith('/uploads/')) return `http://localhost:${PORT}${imagePath}`
    if (imagePath.startsWith('/')) return imagePath
    return imagePath
}

// ==================== PRODUCTS ====================
app.get('/api/products', async (req, res) => {
    try {
        const { category, featured, search, limit = 50, sort = 'newest' } = req.query
        let query = { enabled: { $ne: false } }

        // Handle category filter - can be categoryId or slug
        if (category) {
            // First try to find by slug
            const cat = await Category.findOne({ slug: category })
            if (cat) {
                query.categoryId = cat._id.toString()
            } else {
                // Maybe it's already a categoryId
                query.categoryId = category
            }
        }

        if (featured === 'true') query.isFeatured = true
        if (search) query.name = { $regex: search, $options: 'i' }

        // Determine sort order based on sort parameter
        let sortOption = { createdAt: -1 } // default: newest first
        switch (sort) {
            case 'price-low':
                sortOption = { price: 1 }
                break
            case 'price-high':
                sortOption = { price: -1 }
                break
            case 'name':
                sortOption = { name: 1 }
                break
            case 'newest':
            default:
                sortOption = { createdAt: -1 }
        }

        const products = await Product.find(query).limit(parseInt(limit)).sort(sortOption)
        // Map _id to id for frontend compatibility
        const mappedProducts = products.map(p => {
            const obj = p.toObject()
            const firstImage = obj.images?.[0] || obj.image
            return {
                ...obj,
                id: p._id.toString(),
                image: getImageUrl(firstImage),
                images: (obj.images || []).map(img => getImageUrl(img))
            }
        })
        res.json({ products: mappedProducts, total: mappedProducts.length })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/products/:id', async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined') return res.status(400).json({ error: 'Invalid product ID' })
        const product = await Product.findById(req.params.id)
        if (!product) return res.status(404).json({ error: 'Not found' })
        const obj = product.toObject()
        const firstImage = obj.images?.[0] || obj.image
        res.json({
            ...obj,
            id: product._id.toString(),
            image: getImageUrl(firstImage),
            images: (obj.images || []).map(img => getImageUrl(img))
        })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/products', adminMiddleware, async (req, res) => {
    try { res.status(201).json(await Product.create(req.body)) }
    catch (err) { apiError(res, err) }
})

app.put('/api/products/:id', adminMiddleware, async (req, res) => {
    try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/products/:id', adminMiddleware, async (req, res) => {
    try { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
    try {
        const { showOnHome, showInNav } = req.query
        let query = {}
        if (showOnHome === 'true') query.showOnHome = true
        if (showInNav === 'true') query.showInNav = true

        const cats = await Category.find(query).sort({ order: 1 })
        const result = await Promise.all(cats.map(async c => ({
            ...c.toObject(),
            id: c._id,
            image: getImageUrl(c.image),
            productCount: await Product.countDocuments({ categoryId: c._id.toString() })
        })))
        res.json(result)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/categories/:slug', async (req, res) => {
    try {
        const cat = await Category.findOne({ slug: req.params.slug })
        if (!cat) return res.status(404).json({ error: 'Not found' })
        res.json({ ...cat.toObject(), id: cat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/categories', adminMiddleware, async (req, res) => {
    try { const c = await Category.create(req.body); res.status(201).json({ ...c.toObject(), id: c._id }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/categories/:id', adminMiddleware, async (req, res) => {
    try { const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...c.toObject(), id: c._id }) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/categories/:id', adminMiddleware, async (req, res) => {
    try { await Category.findByIdAndDelete(req.params.id); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== ORDERS ====================
app.get('/api/orders', adminMiddleware, async (req, res) => {
    try { res.json((await Order.find().sort({ createdAt: -1 })).map(o => ({ ...o.toObject(), id: o._id }))) }
    catch (err) { apiError(res, err) }
})

app.post('/api/orders', async (req, res) => {
    try {
        // Generate sequential order ID (ORD-0001, ORD-0002, etc.)
        const lastOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderId')
        let nextNum = 1
        if (lastOrder?.orderId) {
            const match = lastOrder.orderId.match(/ORD-(\d+)/)
            if (match) nextNum = parseInt(match[1]) + 1
        }
        const orderId = `ORD-${String(nextNum).padStart(4, '0')}`

        // Normalize customer email to lowercase for consistent matching with user accounts
        const orderData = { ...req.body, orderId }
        if (orderData.customer?.email) {
            orderData.customer.email = orderData.customer.email.toLowerCase()
        }

        const order = await Order.create(orderData)
        for (const item of req.body.items || []) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -(item.quantity || 1) } })
        if (req.body.promoCode) await PromoCode.findOneAndUpdate({ code: req.body.promoCode.toUpperCase() }, { $inc: { usageCount: 1 } })

        // Send order confirmation email to customer
        const settings = await Settings.findOne()
        try {
            if (settings) await sendOrderConfirmation(settings, order)
        } catch (emailErr) { console.error('Order email error:', emailErr.message) }

        // Send admin notification email for new order
        try {
            if (settings?.emailEnabled && settings?.adminEmail) {
                const { sendAdminOrderNotification } = await import('./emailService.js')
                await sendAdminOrderNotification(settings, order)
            }
        } catch (emailErr) { if (!IS_PRODUCTION) console.error('Admin order notification error:', emailErr.message) }

        res.status(201).json({ orderId, order: { ...order.toObject(), id: order._id } })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/orders/:id', adminMiddleware, async (req, res) => {
    try { const o = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...o.toObject(), id: o._id }) }
    catch (err) { apiError(res, err) }
})

// ============ STRIPE CHECKOUT SESSION ============
app.post('/api/stripe/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe payments are not configured. Please add STRIPE_SECRET_KEY to your .env file.' })

    try {
        const { items, customer, shipping, subtotal, shippingCost, promoDiscount, promoCode, total } = req.body
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

        // Build line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'aud',
                product_data: {
                    name: item.name,
                    ...(item.image && { images: [item.image.startsWith('http') ? item.image : `${process.env.BACKEND_URL || 'http://localhost:3001'}${item.image}`] })
                },
                unit_amount: Math.round((item.salePrice && item.salePrice < item.price ? item.salePrice : item.price) * 100)
            },
            quantity: item.quantity || 1
        }))

        // Add shipping as a line item if > 0
        if (shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'aud',
                    product_data: { name: 'Shipping' },
                    unit_amount: Math.round(shippingCost * 100)
                },
                quantity: 1
            })
        }

        // Prepare discount coupon if promo applied
        let discounts = []
        if (promoDiscount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: Math.round(promoDiscount * 100),
                currency: 'aud',
                duration: 'once',
                name: promoCode || 'Discount'
            })
            discounts = [{ coupon: coupon.id }]
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            ...(discounts.length > 0 && { discounts }),
            customer_email: customer?.email,
            success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/checkout`,
            metadata: {
                items: JSON.stringify(items.map(i => ({
                    productId: i.productId || i.id,
                    name: i.name,
                    price: i.salePrice && i.salePrice < i.price ? i.salePrice : i.price,
                    quantity: i.quantity,
                    customShipping: i.customShipping
                }))),
                customer: JSON.stringify(customer),
                shipping: JSON.stringify(shipping),
                subtotal: String(subtotal),
                shippingCost: String(shippingCost),
                promoDiscount: String(promoDiscount || 0),
                promoCode: promoCode || ''
            }
        })

        res.json({ sessionId: session.id, url: session.url })
    } catch (err) {
        console.error('Stripe session error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// Get Stripe session status (for success page)
app.get('/api/stripe/session/:sessionId', async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
        // Find the order created by webhook
        const order = await Order.findOne({ stripeSessionId: session.id })
        res.json({
            status: session.payment_status,
            customerEmail: session.customer_email,
            orderId: order?.orderId,
            amountTotal: session.amount_total ? session.amount_total / 100 : order?.total || 0,
            items: order?.items || JSON.parse(session.metadata?.items || '[]'),
            order: order ? { ...order.toObject(), id: order._id } : null
        })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update order status with email notification
app.put('/api/orders/:id/status', adminMiddleware, async (req, res) => {
    try {
        const { status, sendEmail, trackingNumber, courier, trackingUrl, deliveryDays } = req.body

        const updateData = { status }
        if (trackingNumber) updateData.trackingNumber = trackingNumber
        if (courier) updateData.courier = courier
        if (trackingUrl) updateData.trackingUrl = trackingUrl
        if (deliveryDays) updateData.deliveryDays = deliveryDays

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
        if (!order) return res.status(404).json({ error: 'Order not found' })

        let emailSent = false
        let emailError = null

        if (sendEmail) {
            try {
                const settings = await Settings.findOne()
                if (settings && settings.emailEnabled) {
                    const { sendOrderStatusEmail } = await import('./emailService.js')
                    emailSent = await sendOrderStatusEmail(settings, order, status, { trackingNumber, courier, trackingUrl, deliveryDays })
                }
            } catch (emailErr) {
                emailError = emailErr.message
                console.error('Status email error:', emailErr.message)
            }
        }

        res.json({
            ...order.toObject(),
            id: order._id,
            emailSent,
            emailError
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== CUSTOMERS ====================
app.get('/api/customers', adminMiddleware, async (req, res) => {
    try {
        const customers = await Order.aggregate([
            { $match: { 'customer.email': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: { $toLower: '$customer.email' },
                    name: { $first: { $ifNull: ['$customer.name', { $concat: [{ $ifNull: ['$customer.firstName', ''] }, ' ', { $ifNull: ['$customer.lastName', ''] }] }] } },
                    orders: { $push: '$orderId' },
                    totalSpent: { $sum: { $ifNull: ['$total', 0] } },
                    createdAt: { $min: '$createdAt' }
                }
            },
            { $project: { _id: 0, id: '$_id', email: '$_id', name: 1, orders: 1, totalSpent: 1, createdAt: 1 } },
            { $sort: { createdAt: -1 } }
        ])
        res.json(customers)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== REFUND REQUESTS ====================
// Get all refunds (admin)
app.get('/api/refunds', adminMiddleware, async (req, res) => {
    try {
        const refunds = await Refund.find().sort({ createdAt: -1 })
        res.json(refunds.map(r => ({ ...r.toObject(), id: r._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get refunds for a customer (by email)
app.get('/api/refunds/customer/:email', async (req, res) => {
    try {
        const refunds = await Refund.find({ 'customer.email': req.params.email.toLowerCase() }).sort({ createdAt: -1 })
        res.json(refunds.map(r => ({ ...r.toObject(), id: r._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create refund request (customer)
app.post('/api/refunds', async (req, res) => {
    try {
        const { orderId, reason } = req.body
        const order = await Order.findById(orderId)
        if (!order) return res.status(404).json({ error: 'Order not found' })

        // Check if refund already exists
        const existing = await Refund.findOne({ order: orderId })
        if (existing) return res.status(400).json({ error: 'Refund request already exists for this order' })

        const refundId = `REF-${Date.now()}`
        const refund = await Refund.create({
            refundId,
            order: orderId,
            orderId: order.orderId,
            customer: {
                email: order.customer.email,
                firstName: order.customer.firstName,
                lastName: order.customer.lastName,
                phone: order.customer.phone
            },
            amount: order.total,
            reason,
            status: 'pending',
            messages: [{
                from: 'customer',
                message: reason,
                date: new Date()
            }]
        })

        // Send admin notification for new refund request
        try {
            const settings = await Settings.findOne()
            if (settings?.emailEnabled && settings?.adminEmail) {
                const { sendAdminRefundNotification } = await import('./emailService.js')
                await sendAdminRefundNotification(settings, refund)
            }
        } catch (emailErr) { console.error('Admin refund notification error:', emailErr.message) }

        res.status(201).json({ ...refund.toObject(), id: refund._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update refund status (admin)
app.put('/api/refunds/:id', adminMiddleware, async (req, res) => {
    try {
        const { status, adminNotes, sendEmail } = req.body
        const updateData = { status }
        if (adminNotes) updateData.adminNotes = adminNotes
        if (status === 'processed') updateData.processedAt = new Date()

        const refund = await Refund.findByIdAndUpdate(req.params.id, updateData, { new: true })

        // Send email notification if requested
        if (sendEmail && refund) {
            try {
                const settings = await Settings.findOne()
                if (settings && settings.emailEnabled) {
                    const { sendRefundStatusEmail } = await import('./emailService.js')
                    await sendRefundStatusEmail(settings, refund, status)
                }
            } catch (emailErr) {
                console.error('Refund email error:', emailErr.message)
            }
        }

        res.json({ ...refund.toObject(), id: refund._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add message to refund
app.post('/api/refunds/:id/message', async (req, res) => {
    try {
        const { message, from, sendEmail } = req.body
        const refund = await Refund.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: { from, message, date: new Date() } } },
            { new: true }
        )

        // Send email notification if from admin
        if (sendEmail && from === 'admin' && refund) {
            try {
                const settings = await Settings.findOne()
                if (settings && settings.emailEnabled) {
                    const { sendRefundMessageEmail } = await import('./emailService.js')
                    await sendRefundMessageEmail(settings, refund, message)
                }
            } catch (emailErr) {
                console.error('Refund message email error:', emailErr.message)
            }
        }

        res.json({ ...refund.toObject(), id: refund._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CUSTOMER ORDER ACTIONS ====================
// Cancel order (customer - only if pending or processing)
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })

        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ error: 'Order cannot be cancelled at this stage' })
        }

        order.status = 'cancelled'
        await order.save()

        // Send cancellation email
        try {
            const settings = await Settings.findOne()
            if (settings && settings.emailEnabled) {
                const { sendOrderStatusEmail } = await import('./emailService.js')
                await sendOrderStatusEmail(settings, order, 'cancelled', {})
            }
        } catch (emailErr) {
            console.error('Cancellation email error:', emailErr.message)
        }

        res.json({ ...order.toObject(), id: order._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update order shipping address (customer - only if pending or processing)
app.put('/api/orders/:id/shipping', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })

        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ error: 'Shipping address cannot be changed at this stage' })
        }

        const { address, city, state, postcode } = req.body
        order.shipping = { address, city, state, postcode }
        await order.save()

        res.json({ ...order.toObject(), id: order._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== SUPPORT CHAT ====================
// Get all chats (admin)
app.get('/api/support-chats', async (req, res) => {
    try {
        const chats = await SupportChat.find().sort({ lastMessage: -1 })
        res.json(chats.map(c => ({ ...c.toObject(), id: c._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get chats for a customer
app.get('/api/support-chats/customer/:email', async (req, res) => {
    try {
        const chats = await SupportChat.find({ 'customer.email': req.params.email.toLowerCase() }).sort({ lastMessage: -1 })
        res.json(chats.map(c => ({ ...c.toObject(), id: c._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get single chat
app.get('/api/support-chats/:id', async (req, res) => {
    try {
        const chat = await SupportChat.findById(req.params.id)
        if (!chat) return res.status(404).json({ error: 'Chat not found' })
        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create new chat (customer)
app.post('/api/support-chats', async (req, res) => {
    try {
        const { customer, subject, message } = req.body
        const chatId = `CHAT-${Date.now()}`

        const chat = await SupportChat.create({
            chatId,
            customer: {
                id: customer.id,
                email: customer.email.toLowerCase(),
                firstName: customer.firstName,
                lastName: customer.lastName
            },
            subject: subject || 'Support Request',
            status: 'open',
            unreadAdmin: 1,
            messages: message ? [{
                from: 'customer',
                message,
                messageType: 'text',
                date: new Date()
            }] : [],
            lastMessage: new Date()
        })

        res.status(201).json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Send message to chat
app.post('/api/support-chats/:id/message', async (req, res) => {
    try {
        const { from, message, messageType, attachment } = req.body

        const newMessage = {
            from,
            message,
            messageType: messageType || 'text',
            attachment: attachment || undefined,
            date: new Date(),
            read: false
        }

        const updateData = {
            $push: { messages: newMessage },
            lastMessage: new Date(),
            status: 'active'
        }

        // Update unread counter
        if (from === 'customer') {
            updateData.$inc = { unreadAdmin: 1 }
            updateData.unreadCustomer = 0
        } else {
            updateData.$inc = { unreadCustomer: 1 }
            updateData.unreadAdmin = 0
        }

        const chat = await SupportChat.findByIdAndUpdate(req.params.id, updateData, { new: true })
        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update chat status (admin)
app.put('/api/support-chats/:id', async (req, res) => {
    try {
        const chat = await SupportChat.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Mark messages as read
app.put('/api/support-chats/:id/read', async (req, res) => {
    try {
        const { readBy } = req.body // 'customer' or 'admin'

        const updateData = readBy === 'customer' ? { unreadCustomer: 0 } : { unreadAdmin: 0 }

        // Also mark individual messages as read
        const chat = await SupportChat.findById(req.params.id)
        if (chat) {
            chat.messages.forEach(msg => {
                if (msg.from !== readBy) msg.read = true
            })
            Object.assign(chat, updateData)
            await chat.save()
        }

        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get unread count for customer
app.get('/api/support-chats/unread/:email', async (req, res) => {
    try {
        const chats = await SupportChat.find({ 'customer.email': req.params.email.toLowerCase() })
        const unreadCount = chats.reduce((sum, c) => sum + (c.unreadCustomer || 0), 0)
        res.json({ unreadCount })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get total unread for admin
app.get('/api/support-chats/admin/unread', async (req, res) => {
    try {
        const chats = await SupportChat.find()
        const unreadCount = chats.reduce((sum, c) => sum + (c.unreadAdmin || 0), 0)
        const openChats = chats.filter(c => c.status === 'open' || c.status === 'active').length
        res.json({ unreadCount, openChats })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== PROMO CODES ====================
app.get('/api/promo-codes', adminMiddleware, async (req, res) => {
    try { res.json((await PromoCode.find().sort({ createdAt: -1 })).map(c => ({ ...c.toObject(), id: c._id }))) }
    catch (err) { apiError(res, err) }
})

app.post('/api/promo-codes', adminMiddleware, async (req, res) => {
    try { const c = await PromoCode.create({ ...req.body, code: req.body.code.toUpperCase() }); res.status(201).json({ ...c.toObject(), id: c._id }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/promo-codes/:id', adminMiddleware, async (req, res) => {
    try { const c = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...c.toObject(), id: c._id }) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/promo-codes/:id', adminMiddleware, async (req, res) => {
    try { await PromoCode.findByIdAndDelete(req.params.id); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

app.post('/api/promo-codes/validate', async (req, res) => {
    try {
        const { code, orderTotal } = req.body
        const p = await PromoCode.findOne({ code: code.toUpperCase() })
        if (!p) return res.status(400).json({ valid: false, error: 'Invalid code' })
        if (!p.active) return res.status(400).json({ valid: false, error: 'Not active' })
        if (p.expiryDate && new Date(p.expiryDate) < new Date()) return res.status(400).json({ valid: false, error: 'Expired' })
        if (p.usageLimit > 0 && p.usageCount >= p.usageLimit) return res.status(400).json({ valid: false, error: 'Limit reached' })
        if (p.minOrder && orderTotal < p.minOrder) return res.status(400).json({ valid: false, error: `Min order $${p.minOrder}` })
        res.json({ valid: true, promo: { ...p.toObject(), id: p._id } })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== TESTIMONIALS ====================
app.get('/api/testimonials', async (req, res) => {
    try { res.json((await Testimonial.find({ enabled: { $ne: false } }).sort({ createdAt: -1 })).map(t => ({ ...t.toObject(), id: t._id }))) }
    catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/testimonials', adminMiddleware, async (req, res) => {
    try { const t = await Testimonial.create(req.body); res.status(201).json({ ...t.toObject(), id: t._id }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/testimonials/:id', adminMiddleware, async (req, res) => {
    try { const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...t.toObject(), id: t._id }) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/testimonials/:id', adminMiddleware, async (req, res) => {
    try { await Testimonial.findByIdAndDelete(req.params.id); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== SLIDER ====================
app.get('/api/slider', async (req, res) => {
    try {
        const slides = await Slider.find().sort({ order: 1 })
        res.json(slides.map(s => ({ ...s.toObject(), id: s._id, image: getImageUrl(s.image) })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/slider', adminMiddleware, async (req, res) => {
    try { const s = await Slider.create(req.body); res.status(201).json({ ...s.toObject(), id: s._id, image: getImageUrl(s.image) }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/slider/:id', adminMiddleware, async (req, res) => {
    try { const s = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...s.toObject(), id: s._id, image: getImageUrl(s.image) }) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/slider/:id', adminMiddleware, async (req, res) => {
    try { await Slider.findByIdAndDelete(req.params.id); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== SETTINGS ====================
app.get('/api/settings', async (req, res) => {
    try {
        let s = await Settings.findOne()
        if (!s) s = await Settings.create({})
        const { adminPassword, ...pub } = s.toObject()
        res.json(pub)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/admin/settings', adminMiddleware, async (req, res) => {
    try {
        let s = await Settings.findOne()
        if (!s) s = await Settings.create({})
        res.json(s)
    } catch (err) { apiError(res, err) }
})

app.put('/api/settings', adminMiddleware, async (req, res) => {
    try {
        let s = await Settings.findOne()
        if (!s) s = await Settings.create(req.body)
        else { Object.assign(s, req.body); await s.save() }
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

// ==================== SECTIONS ====================
app.get('/api/sections/:key', async (req, res) => {
    try { const s = await Section.findOne({ key: req.params.key }); res.json(s?.data || []) }
    catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/sections/:key', adminMiddleware, async (req, res) => {
    try { await Section.findOneAndUpdate({ key: req.params.key }, { key: req.params.key, data: req.body }, { upsert: true }); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== ADMIN AUTH ====================
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const s = await Settings.findOne()
        if (username === (s?.adminUsername || 'admin') && password === (s?.adminPassword || 'admin123')) {
            res.json({ admin: { username, role: 'admin' }, token: jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' }) })
        } else res.status(401).json({ message: 'Invalid credentials' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== FILE UPLOAD ====================
app.post('/api/upload', adminMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    res.json({ url: `/uploads/${req.file.filename}` })
})

app.post('/api/upload/multiple', adminMiddleware, upload.array('files', 10), (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'No files' })
    res.json({ urls: req.files.map(f => `/uploads/${f.filename}`) })
})

// ==================== REVIEWS ====================
// Get reviews for a product
app.get('/api/products/:productId/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId, isApproved: true })
            .sort({ createdAt: -1 })
        const avg = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
        res.json({ reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add a review (user)
app.post('/api/products/:productId/reviews', authMiddleware, async (req, res) => {
    try {
        const { rating, title, review } = req.body
        const user = await User.findById(req.user.id)

        // Check if user has purchased and received this product
        const completedOrder = await Order.findOne({
            'customer.email': user.email,
            'items.productId': req.params.productId,
            status: { $in: ['completed', 'delivered'] }
        })

        const newReview = await Review.create({
            productId: req.params.productId,
            userId: req.user.id,
            orderId: completedOrder?._id,
            rating,
            title,
            review,
            reviewerName: `${user.firstName} ${user.lastName}`,
            isVerifiedPurchase: !!completedOrder,
            isAdminReview: false
        })

        res.json(newReview)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add admin review
app.post('/api/admin/products/:productId/reviews', adminMiddleware, async (req, res) => {
    try {
        const { rating, title, review, reviewerName } = req.body
        const newReview = await Review.create({
            productId: req.params.productId,
            rating,
            title,
            review,
            reviewerName: reviewerName || 'Happy Customer',
            isVerifiedPurchase: true,
            isAdminReview: true
        })
        res.json(newReview)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update review
app.put('/api/reviews/:id', adminMiddleware, async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json(review)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Delete review
app.delete('/api/reviews/:id', adminMiddleware, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get all reviews for admin
app.get('/api/admin/reviews', adminMiddleware, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('productId', 'name')
            .sort({ createdAt: -1 })
        res.json(reviews)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Helper to call Gemini API
async function callGemini(apiKey, prompt) {
    try {
        // Using gemini-2.5-flash as specified by user
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            })
        })
        const data = await response.json()
        if (!IS_PRODUCTION) console.log('Gemini response:', JSON.stringify(data).substring(0, 300))
        if (data?.error) {
            console.error('Gemini API error:', data.error.message)
            throw new Error(data.error.message || 'Gemini API error')
        }
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text
        }
        throw new Error('No response from Gemini')
    } catch (err) {
        console.error('callGemini error:', err.message)
        throw err
    }
}

// Helper to call Longcat/OpenAI-compatible API
async function callLongcat(apiKey, prompt) {
    try {
        // Using Longcat API with OpenAI format: https://api.longcat.chat/openai/v1/chat/completions
        const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'LongCat-Flash-Chat',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            })
        })
        const data = await response.json()
        if (!IS_PRODUCTION) console.log('Longcat response:', JSON.stringify(data).substring(0, 300))
        if (data?.error) {
            console.error('Longcat API error:', data.error.message || JSON.stringify(data.error))
            throw new Error(data.error.message || 'Longcat API error')
        }
        if (data?.choices?.[0]?.message?.content) {
            return data.choices[0].message.content
        }
        throw new Error('No response from Longcat')
    } catch (err) {
        console.error('callLongcat error:', err.message)
        throw err
    }
}

// Test chatbot APIs
app.post('/api/chatbot/test', async (req, res) => {
    const { apiType } = req.body // 'gemini' or 'longcat'
    const settings = await Settings.findOne()

    try {
        if (apiType === 'gemini') {
            const apiKey = settings?.geminiApiKey
            if (!apiKey) return res.json({ success: false, error: 'Gemini API key not configured' })
            await callGemini(apiKey, 'Say "API test successful" in one line.')
            return res.json({ success: true, message: 'Gemini API is working!' })
        } else if (apiType === 'longcat') {
            const apiKey = settings?.longcatApiKey
            if (!apiKey) return res.json({ success: false, error: 'Longcat API key not configured' })
            await callLongcat(apiKey, 'Say "API test successful" in one line.')
            return res.json({ success: true, message: 'Longcat API is working!' })
        }
        res.json({ success: false, error: 'Invalid API type' })
    } catch (err) {
        res.json({ success: false, error: err.message })
    }
})

// Test email connection
app.post('/api/email/test', async (req, res) => {
    try {
        const settings = await Settings.findOne()
        if (!settings) return res.json({ success: false, error: 'Settings not found' })

        const result = await testEmailConnection(settings)
        res.json(result)
    } catch (err) {
        res.json({ success: false, error: err.message })
    }
})

app.post('/api/chatbot', async (req, res) => {
    try {
        const { message } = req.body
        const settings = await Settings.findOne()

        // Only disable if explicitly set to false (default is enabled)
        if (settings?.chatbotEnabled === false) {
            return res.json({ response: "Sorry, the chat assistant is currently unavailable. Please contact us directly." })
        }

        const geminiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY
        const longcatKey = settings?.longcatApiKey

        if (!geminiKey && !longcatKey) {
            return res.json({ response: "Chat is not configured. Please contact customer support." })
        }

        // Fetch store info for context
        const categories = await Category.find().limit(5)
        const products = await Product.find({ enabled: true }).limit(10).select('name price category')

        const storeContext = `
You are DecoraBake's friendly AI assistant 🎂 - Australia's premier cake decorating supplies store.

=== STORE INFO ===
📧 Email: ${settings.contactEmail}
📞 Phone: ${settings.contactPhone}
📍 Location: ${settings.address || 'Sydney, Australia'}
🚚 Free Shipping: ${settings.freeShippingEnabled ? `Orders over $${settings.freeShippingThreshold}` : 'Not available'}
📦 Standard Shipping: $${settings.shippingCost}

=== PRODUCTS & CATEGORIES ===
Categories: ${categories.map(c => c.name).join(', ')}
Popular Items: ${products.map(p => `${p.name} ($${p.price})`).join(', ')}

=== YOUR RESPONSE STYLE ===
1. Be warm, friendly and enthusiastic about baking! Use emojis sparingly 🎂
2. Keep responses SHORT (2-4 sentences max) but helpful
3. Use plain text only - NO markdown (**bold**, *italic*, bullets, etc.)
4. Match the customer's language (Urdu, Arabic, etc.)
5. Always offer to help further

=== RESPONSE TEMPLATES ===

For product questions:
"Great choice! [Product/category] is perfect for [use case]. You can find it in our [Category] section. Need help finding anything specific?"

For shipping questions:
"We offer free shipping on orders over $${settings.freeShippingThreshold}! Standard shipping is just $${settings.shippingCost}. Most orders arrive within 3-5 business days."

For order/account issues:
"I'd be happy to help! For order inquiries, please email us at ${settings.contactEmail} or call ${settings.contactPhone}. We typically respond within 24 hours."

For general help:
"Welcome to DecoraBake! 🎂 I can help you find cake decorating supplies, answer shipping questions, or point you to the right products. What would you like to know?"

=== CUSTOMER MESSAGE ===
${message}`

        let botResponse = null

        // Try Gemini first
        if (geminiKey) {
            try {
                botResponse = await callGemini(geminiKey, storeContext)
            } catch (e) { console.log('Gemini failed, trying Longcat...') }
        }

        // Fallback to Longcat
        if (!botResponse && longcatKey) {
            try {
                botResponse = await callLongcat(longcatKey, storeContext)
            } catch (e) { console.log('Longcat also failed:', e.message) }
        }

        if (!botResponse) {
            return res.json({ response: "I'm having trouble connecting right now. Please try again or contact us directly." })
        }

        // Clean up any markdown formatting
        botResponse = botResponse
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/`/g, '')
            .replace(/#{1,6}\s/g, '')
            .trim()

        res.json({ response: botResponse })
    } catch (err) {
        console.error('Chatbot error:', err)
        res.json({ response: "Sorry, I'm having trouble right now. Please try again or contact us directly." })
    }
})

// ==================== SYSTEM DIAGNOSTICS ====================
app.get('/api/diagnostics', adminMiddleware, async (req, res) => {
    try {
        const results = {
            database: { status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' },
            collections: {}
        }

        // Count documents in main collections
        results.collections.users = await User.countDocuments()
        results.collections.products = await Product.countDocuments()
        results.collections.categories = await Category.countDocuments()
        results.collections.orders = await Order.countDocuments()
        results.collections.carts = await Cart.countDocuments()

        // Check settings
        const settings = await Settings.findOne()
        results.settings = {
            exists: !!settings,
            chatbotEnabled: settings?.chatbotEnabled,
            geminiConfigured: !!settings?.geminiApiKey,
            longcatConfigured: !!settings?.longcatApiKey,
            whatsappEnabled: settings?.whatsappEnabled
        }

        res.json({ success: true, ...results })
    } catch (err) {
        res.json({ success: false, error: err.message })
    }
})

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 }))

// ==================== PAGES CMS ====================
// Get all pages (admin)
app.get('/api/admin/pages', adminMiddleware, async (req, res) => {
    try {
        const pages = await Page.find().sort({ createdAt: -1 })
        res.json(pages)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get all blog posts
app.get('/api/blog', async (req, res) => {
    try {
        const posts = await Page.find({ type: 'blog', isPublished: true }).sort({ createdAt: -1 })
        res.json(posts)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get single page by slug
app.get('/api/pages/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug, isPublished: true })
        if (!page) return res.status(404).json({ error: 'Page not found' })
        res.json(page)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create page (admin)
app.post('/api/admin/pages', adminMiddleware, async (req, res) => {
    try {
        const page = new Page(req.body)
        await page.save()
        res.json(page)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update page (admin)
app.put('/api/admin/pages/:id', adminMiddleware, async (req, res) => {
    try {
        const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json(page)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Delete page (admin)
app.delete('/api/admin/pages/:id', adminMiddleware, async (req, res) => {
    try {
        await Page.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ============ SITEMAP.XML ============
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'https://decorabake.com.au'
        const products = await Product.find({ enabled: { $ne: false } }).select('_id updatedAt').lean()
        const categories = await Category.find({ enabled: { $ne: false } }).select('slug updatedAt').lean()
        const pages = await Page.find({ isPublished: true }).select('slug updatedAt').lean()

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

        // Static pages
        const staticPages = ['/', '/products', '/about', '/contact', '/blog', '/privacy']
        staticPages.forEach(page => {
            xml += `  <url><loc>${baseUrl}${page}</loc><changefreq>weekly</changefreq><priority>${page === '/' ? '1.0' : '0.7'}</priority></url>\n`
        })

        // Product pages
        products.forEach(p => {
            xml += `  <url><loc>${baseUrl}/product/${p._id}</loc><lastmod>${p.updatedAt?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
        })

        // Category pages
        categories.forEach(c => {
            xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><lastmod>${c.updatedAt?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
        })

        // CMS pages
        pages.forEach(p => {
            xml += `  <url><loc>${baseUrl}/blog/${p.slug}</loc><lastmod>${p.updatedAt?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`
        })

        xml += `</urlset>`
        res.set('Content-Type', 'application/xml')
        res.send(xml)
    } catch (err) { res.status(500).send('Error generating sitemap') }
})

// ============ PRODUCT SEARCH ============
app.get('/api/search', async (req, res) => {
    try {
        const q = req.query.q?.trim()
        if (!q || q.length < 2) return res.json([])

        const products = await Product.find({
            enabled: { $ne: false },
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ]
        })
            .select('name price salePrice image images category slug _id')
            .limit(20)
            .lean()

        res.json(products)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ============ NEWSLETTER SUBSCRIBE ============
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email is required' })

        // Check if user exists, if not create a newsletter-only record
        let user = await User.findOne({ email: email.toLowerCase() })
        if (user) {
            user.newsletter = true
            await user.save()
        } else {
            // Store in settings as newsletter subscribers
            const settings = await Settings.findOne() || new Settings()
            if (!settings.newsletterSubscribers) settings.newsletterSubscribers = []
            if (!settings.newsletterSubscribers.includes(email.toLowerCase())) {
                settings.newsletterSubscribers.push(email.toLowerCase())
                await settings.save()
            }
        }
        res.json({ success: true, message: 'Subscribed successfully' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Start
app.listen(PORT, () => {
    console.log(`🚀 Backend: http://localhost:${PORT}`)
    console.log(`📡 Frontend: ${process.env.FRONTEND_URL}`)
})
