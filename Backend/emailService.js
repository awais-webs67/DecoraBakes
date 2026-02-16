import nodemailer from 'nodemailer'

/**
 * Email Service for DecoraBake
 * Handles all transactional emails (order confirmations, welcome emails, etc.)
 */

// Create transporter from settings
export async function createTransporter(settings) {
    if (!settings.emailEnabled || !settings.smtpHost || !settings.smtpUser) {
        return null
    }

    const port = parseInt(settings.smtpPort) || 587
    const host = settings.smtpHost.toLowerCase().trim()

    // Use Gmail service preset for simpler configuration
    if (host === 'smtp.gmail.com') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword
            }
        })
    }

    // Use Outlook/Hotmail service preset
    if (host.includes('office365') || host.includes('outlook') || host.includes('hotmail')) {
        return nodemailer.createTransport({
            service: 'hotmail',
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword
            }
        })
    }

    // For other providers, use manual configuration
    const secure = port === 465

    const transportConfig = {
        host: host,
        port: port,
        secure: secure,
        auth: {
            user: settings.smtpUser,
            pass: settings.smtpPassword
        },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    }

    return nodemailer.createTransport(transportConfig)
}

// Send email helper
async function sendEmail(transporter, settings, to, subject, html) {
    if (!transporter) {
        console.log('Email not configured, skipping:', subject)
        return false
    }

    try {
        await transporter.sendMail({
            from: `"${settings.emailFromName || 'DecoraBake'}" <${settings.emailFrom || settings.smtpUser}>`,
            to,
            subject,
            html
        })
        console.log('Email sent:', subject, 'to', to)
        return true
    } catch (error) {
        console.error('Email error:', error.message)
        return false
    }
}

// Order confirmation email
export async function sendOrderConfirmation(settings, order) {
    if (!settings.sendOrderConfirmation) return false

    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br>
                <span style="color: #666;">Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                $${(item.price * item.quantity).toFixed(2)}
            </td>
        </tr>
    `).join('')

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6B2346; margin: 0;">Thank You for Your Order! 🎂</h1>
        </div>
        
        <p>Hi ${order.customer.firstName || order.customer.name || 'there'},</p>
        
        <p>We've received your order and are getting it ready. Here's a summary of what you ordered:</p>
        
        <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px;"><strong>Order Number:</strong> ${order.orderId}</p>
            <p style="margin: 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background: #6B2346; color: #fff;">
                    <th style="padding: 12px; text-align: left;">Item</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
            <tfoot>
                <tr>
                    <td style="padding: 12px;"><strong>Subtotal</strong></td>
                    <td style="padding: 12px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 12px;"><strong>Shipping</strong></td>
                    <td style="padding: 12px; text-align: right;">${order.shippingCost === 0 ? 'FREE' : '$' + order.shippingCost.toFixed(2)}</td>
                </tr>
                ${order.promoDiscount > 0 ? `
                <tr style="color: #2E7D32;">
                    <td style="padding: 12px;"><strong>Discount</strong></td>
                    <td style="padding: 12px; text-align: right;">-$${order.promoDiscount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="background: #FCE8ED;">
                    <td style="padding: 16px;"><strong style="font-size: 18px;">Total</strong></td>
                    <td style="padding: 16px; text-align: right;"><strong style="font-size: 18px; color: #6B2346;">$${order.total.toFixed(2)} AUD</strong></td>
                </tr>
            </tfoot>
        </table>
        
        <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: #6B2346;">Shipping Address</h3>
            <p style="margin: 0; line-height: 1.6;">
                ${order.customer.firstName} ${order.customer.lastName}<br>
                ${order.shipping.address}<br>
                ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}
            </p>
        </div>
        
        <p>We'll send you another email when your order ships. If you have any questions, reply to this email or contact us at ${settings.contactEmail || 'support@decorabake.com.au'}.</p>
        
        <p>Happy baking! 🎂</p>
        <p><strong>The DecoraBake Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
            ${settings.siteName || 'DecoraBake'}<br>
            ${settings.address || 'Sydney, Australia'}<br>
            ${settings.contactPhone || ''}
        </p>
    </body>
    </html>
    `

    return sendEmail(transporter, settings, order.customer.email, `Order Confirmed: ${order.orderId}`, html)
}

// Welcome email for new registrations
export async function sendWelcomeEmail(settings, user) {
    if (!settings.sendWelcomeEmail) return false

    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to ${settings.siteName || 'DecoraBake'}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6B2346; margin: 0;">Welcome to ${settings.siteName || 'DecoraBake'}! 🎂</h1>
        </div>
        
        <p>Hi ${user.firstName},</p>
        
        <p>Thank you for creating an account with us! We're thrilled to have you join our community of cake decorating enthusiasts.</p>
        
        <div style="background: #FCE8ED; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <h2 style="margin: 0 0 12px; color: #6B2346;">What's Next?</h2>
            <p style="margin: 0;">Start exploring our premium cake decorating supplies and create something amazing!</p>
        </div>
        
        <h3 style="color: #6B2346;">Why shop with us?</h3>
        <ul style="line-height: 1.8;">
            <li>🚚 Free shipping on orders over $${settings.freeShippingThreshold || 149}</li>
            <li>⭐ Premium quality products</li>
            <li>💬 Expert customer support</li>
            <li>🔒 Secure checkout</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" 
               style="display: inline-block; background: #6B2346; color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold;">
                Start Shopping
            </a>
        </div>
        
        <p>If you have any questions, feel free to reach out to us at ${settings.contactEmail || 'support@decorabake.com.au'}.</p>
        
        <p>Happy baking! 🎂</p>
        <p><strong>The ${settings.siteName || 'DecoraBake'} Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
            ${settings.siteName || 'DecoraBake'}<br>
            ${settings.address || 'Sydney, Australia'}
        </p>
    </body>
    </html>
    `

    return sendEmail(transporter, settings, user.email, `Welcome to ${settings.siteName || 'DecoraBake'}! 🎂`, html)
}

// Shipping notification email
export async function sendShippingNotification(settings, order, trackingNumber = '') {
    if (!settings.sendShippingNotification) return false

    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Order Has Shipped!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6B2346; margin: 0;">Your Order is On Its Way! 📦</h1>
        </div>
        
        <p>Hi ${order.customer.firstName || order.customer.name || 'there'},</p>
        
        <p>Great news! Your order <strong>${order.orderId}</strong> has been shipped and is on its way to you.</p>
        
        ${trackingNumber ? `
        <div style="background: #E8F5E9; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #666;">Tracking Number</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #2E7D32;">${trackingNumber}</p>
        </div>
        ` : ''}
        
        <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: #6B2346;">Delivery Address</h3>
            <p style="margin: 0; line-height: 1.6;">
                ${order.customer.firstName} ${order.customer.lastName}<br>
                ${order.shipping.address}<br>
                ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}
            </p>
        </div>
        
        <p>Most orders arrive within 3-5 business days. We'll let you know as soon as it's delivered!</p>
        
        <p>Happy baking! 🎂</p>
        <p><strong>The ${settings.siteName || 'DecoraBake'} Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
            ${settings.siteName || 'DecoraBake'}<br>
            ${settings.address || 'Sydney, Australia'}
        </p>
    </body>
    </html>
    `

    return sendEmail(transporter, settings, order.customer.email, `Your Order Has Shipped - ${order.orderId}`, html)
}

// Test email connection
export async function testEmailConnection(settings) {
    const transporter = await createTransporter(settings)
    if (!transporter) {
        return { success: false, error: 'Email not configured' }
    }

    try {
        await transporter.verify()
        return { success: true, message: 'SMTP connection successful!' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Order Status Update Email
export async function sendOrderStatusEmail(settings, order, status, shippingData = {}) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const customerName = order.customer?.firstName || order.customer?.name || 'there'

    // Status-specific content
    const statusContent = {
        pending: {
            subject: `Order Received - ${order.orderId}`,
            icon: '📋',
            title: 'Order Received!',
            message: `Thank you for your order! We've received it and will begin processing soon.`,
            color: '#E65100'
        },
        processing: {
            subject: `Order Processing - ${order.orderId}`,
            icon: '⚙️',
            title: 'Your Order is Being Prepared!',
            message: `Great news! We're now preparing your order. We'll notify you when it ships.`,
            color: '#1565C0'
        },
        shipped: {
            subject: `Order Shipped! - ${order.orderId}`,
            icon: '📦',
            title: 'Your Order is On Its Way!',
            message: `Exciting news! Your order has been shipped and is on its way to you.`,
            color: '#2E7D32'
        },
        delivered: {
            subject: `Order Delivered - ${order.orderId}`,
            icon: '✅',
            title: 'Order Delivered!',
            message: `Your order has been delivered! We hope you love your items.`,
            color: '#1B5E20'
        },
        cancelled: {
            subject: `Order Cancelled - ${order.orderId}`,
            icon: '❌',
            title: 'Order Cancelled',
            message: `Your order has been cancelled. If you have any questions, please contact us.`,
            color: '#C62828'
        }
    }

    const content = statusContent[status] || statusContent.pending

    // Build tracking section for shipped orders
    let trackingSection = ''
    if (status === 'shipped' && shippingData.trackingNumber) {
        trackingSection = `
        <div style="background: #E8F5E9; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <h3 style="margin: 0 0 16px; color: #2E7D32;">📦 Tracking Information</h3>
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: bold; color: #333;">${shippingData.trackingNumber}</p>
            ${shippingData.deliveryDays ? `<p style="margin: 8px 0; color: #666;">Estimated Delivery: ${shippingData.deliveryDays} Business Days</p>` : ''}
            ${shippingData.trackingUrl ? `
            <a href="${shippingData.trackingUrl}" target="_blank" 
               style="display: inline-block; margin-top: 12px; background: #2E7D32; color: #fff; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold;">
                Track Your Package →
            </a>
            ` : ''}
        </div>
        `
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${content.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 12px;">${content.icon}</div>
                <h1 style="color: ${content.color}; margin: 0; font-size: 24px;">${content.title}</h1>
            </div>
            
            <p>Hi ${customerName},</p>
            <p>${content.message}</p>
            
            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Order Number:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${order.orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Order Date:</td>
                        <td style="padding: 8px 0; text-align: right;">${new Date(order.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Status:</td>
                        <td style="padding: 8px 0; text-align: right;">
                            <span style="background: ${content.color}20; color: ${content.color}; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px;">
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Total:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #6B2346; font-size: 18px;">$${order.total?.toFixed(2)} AUD</td>
                    </tr>
                </table>
            </div>
            
            ${trackingSection}
            
            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #888; text-transform: uppercase;">Shipping Address</h3>
                <p style="margin: 0; line-height: 1.6;">
                    ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}<br>
                    ${order.shipping?.address || ''}<br>
                    ${order.shipping?.city || ''}, ${order.shipping?.state || ''} ${order.shipping?.postcode || ''}
                </p>
            </div>
            
            <p>If you have any questions about your order, simply reply to this email or contact us at ${settings.contactEmail || 'support@decorabake.com.au'}.</p>
            
            <p>Happy baking! 🎂</p>
            <p><strong>The ${settings.siteName || 'DecoraBake'} Team</strong></p>
        </div>
        
        <div style="text-align: center; padding: 20px;">
            <p style="font-size: 12px; color: #999; margin: 0;">
                ${settings.siteName || 'DecoraBake'}<br>
                ${settings.address || 'Sydney, Australia'}
            </p>
        </div>
    </body>
    </html>
    `

    return sendEmail(transporter, settings, order.customer.email, content.subject, html)
}

// Refund Status Email
export async function sendRefundStatusEmail(settings, refund, status) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const customerName = refund.customer?.firstName || 'there'

    const statusContent = {
        pending: {
            subject: `Refund Request Received - ${refund.refundId}`,
            icon: '📋',
            title: 'Refund Request Received',
            message: `We've received your refund request and will review it shortly.`,
            color: '#E65100'
        },
        reviewing: {
            subject: `Refund Under Review - ${refund.refundId}`,
            icon: '🔍',
            title: 'Refund Under Review',
            message: `Our team is currently reviewing your refund request. We'll update you soon.`,
            color: '#1565C0'
        },
        approved: {
            subject: `Refund Approved! - ${refund.refundId}`,
            icon: '✅',
            title: 'Refund Approved!',
            message: `Great news! Your refund request has been approved. We'll process it shortly.`,
            color: '#2E7D32'
        },
        denied: {
            subject: `Refund Request Update - ${refund.refundId}`,
            icon: '❌',
            title: 'Refund Request Denied',
            message: `Unfortunately, we were unable to approve your refund request. Please see below for details.`,
            color: '#C62828'
        },
        processed: {
            subject: `Refund Processed - ${refund.refundId}`,
            icon: '💰',
            title: 'Refund Processed!',
            message: `Your refund of $${refund.amount?.toFixed(2)} AUD has been processed. It may take 3-5 business days to appear in your account.`,
            color: '#1B5E20'
        }
    }

    const content = statusContent[status] || statusContent.pending

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${content.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 12px;">${content.icon}</div>
                <h1 style="color: ${content.color}; margin: 0; font-size: 24px;">${content.title}</h1>
            </div>
            
            <p>Hi ${customerName},</p>
            <p>${content.message}</p>
            
            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Refund ID:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${refund.refundId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Order ID:</td>
                        <td style="padding: 8px 0; text-align: right;">${refund.orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Amount:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #6B2346;">$${refund.amount?.toFixed(2)} AUD</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Status:</td>
                        <td style="padding: 8px 0; text-align: right;">
                            <span style="background: ${content.color}20; color: ${content.color}; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px;">
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <p>If you have any questions, simply reply to this email or contact us at ${settings.contactEmail || 'support@decorabake.com.au'}.</p>
            
            <p><strong>The ${settings.siteName || 'DecoraBake'} Team</strong></p>
        </div>
    </body>
    </html>
    `

    return sendEmail(transporter, settings, refund.customer.email, content.subject, html)
}

// Refund Message Email (when admin sends a message)
export async function sendRefundMessageEmail(settings, refund, message) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const customerName = refund.customer?.firstName || 'there'

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Message About Your Refund</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 12px;">💬</div>
                <h1 style="color: #6B2346; margin: 0; font-size: 24px;">New Message About Your Refund</h1>
            </div>
            
            <p>Hi ${customerName},</p>
            <p>We have a message regarding your refund request (${refund.refundId}):</p>
            
            <div style="background: #FCE8ED; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #6B2346;">
                <p style="margin: 0; font-style: italic; line-height: 1.6;">"${message}"</p>
            </div>
            
            <p>You can view and respond to this message by logging into your account.</p>
            
            <div style="text-align: center; margin: 24px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/account" 
                   style="display: inline-block; background: #6B2346; color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold;">
                    View My Account
                </a>
            </div>
            
            <p>If you have any questions, reply to this email or contact us at ${settings.contactEmail || 'support@decorabake.com.au'}.</p>
            
            <p><strong>The ${settings.siteName || 'DecoraBake'} Team</strong></p>
        </div>
    </body>
    </html>
    `

    return sendEmail(transporter, settings, refund.customer.email, `New Message - Refund ${refund.refundId}`, html)
}

// Admin notification for new order
export async function sendAdminOrderNotification(settings, order) {
    console.log('sendAdminOrderNotification called:', {
        hasSettings: !!settings,
        emailEnabled: settings?.emailEnabled,
        adminEmail: settings?.adminEmail,
        orderId: order?.orderId
    })

    if (!settings?.emailEnabled || !settings?.adminEmail) {
        console.log('Admin notification aborted - missing emailEnabled or adminEmail')
        return false
    }

    const transporter = await createTransporter(settings)
    if (!transporter) {
        console.log('Admin notification aborted - no transporter created')
        return false
    }

    const itemsList = order.items?.map(item =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;">$${item.price?.toFixed(2)}</td></tr>`
    ).join('') || ''

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:2px solid #6B2346;">
        <div style="background:#6B2346;padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">🛒 New Order Received!</h1>
        </div>
        <div style="padding:24px;">
            <h2 style="color:#333;margin:0 0 20px;">Order #${order.orderId}</h2>
            <div style="background:#f8f8f8;padding:16px;border-radius:10px;margin-bottom:20px;">
                <h3 style="margin:0 0 12px;color:#6B2346;">Customer Details</h3>
                <p style="margin:4px 0;"><strong>Name:</strong> ${order.customer?.firstName} ${order.customer?.lastName}</p>
                <p style="margin:4px 0;"><strong>Email:</strong> ${order.customer?.email}</p>
                <p style="margin:4px 0;"><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
            </div>
            <h3 style="color:#333;">Order Items</h3>
            <table style="width:100%;border-collapse:collapse;">
                <tr style="background:#f0f0f0;"><th style="text-align:left;padding:8px;">Product</th><th style="text-align:left;padding:8px;">Qty</th><th style="text-align:left;padding:8px;">Price</th></tr>
                ${itemsList}
            </table>
            <div style="margin-top:20px;padding:16px;background:#E8F5E9;border-radius:10px;">
                <h3 style="margin:0;color:#2E7D32;">Total: $${order.total?.toFixed(2)}</h3>
            </div>
            <p style="margin-top:20px;text-align:center;">
                <a href="${settings.siteUrl || 'http://localhost:5173'}/admin/orders" style="background:#6B2346;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">View Order in Admin</a>
            </p>
        </div>
    </div>
    `

    return sendEmail(transporter, settings, settings.adminEmail, `🛒 New Order #${order.orderId} - $${order.total?.toFixed(2)}`, html)
}

// Admin notification for new refund request
export async function sendAdminRefundNotification(settings, refund) {
    if (!settings?.emailEnabled || !settings?.adminEmail) return false

    const transporter = await createTransporter(settings)
    if (!transporter) return false

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:2px solid #E65100;">
        <div style="background:#E65100;padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">⚠️ New Refund Request</h1>
        </div>
        <div style="padding:24px;">
            <h2 style="color:#333;margin:0 0 20px;">Refund ${refund.refundId}</h2>
            <div style="background:#FFF3E0;padding:16px;border-radius:10px;margin-bottom:20px;">
                <h3 style="margin:0 0 12px;color:#E65100;">Customer Details</h3>
                <p style="margin:4px 0;"><strong>Name:</strong> ${refund.customer?.firstName} ${refund.customer?.lastName}</p>
                <p style="margin:4px 0;"><strong>Email:</strong> ${refund.customer?.email}</p>
            </div>
            <div style="background:#f8f8f8;padding:16px;border-radius:10px;margin-bottom:20px;">
                <p style="margin:4px 0;"><strong>Order ID:</strong> ${refund.orderId}</p>
                <p style="margin:4px 0;"><strong>Amount:</strong> <span style="color:#C62828;font-weight:700;">$${refund.amount?.toFixed(2)}</span></p>
            </div>
            <div style="background:#FFEBEE;padding:16px;border-radius:10px;">
                <h3 style="margin:0 0 8px;color:#C62828;">Reason</h3>
                <p style="margin:0;color:#333;">${refund.reason}</p>
            </div>
            <p style="margin-top:20px;text-align:center;">
                <a href="${settings.siteUrl || 'http://localhost:5173'}/admin/refunds" style="background:#E65100;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Review Refund Request</a>
            </p>
        </div>
    </div>
    `

    return sendEmail(transporter, settings, settings.adminEmail, `⚠️ New Refund Request - ${refund.refundId} - $${refund.amount?.toFixed(2)}`, html)
}
