// pages/api/send-order-confirmation.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderData } = req.body;

  if (!orderData) {
    return res.status(400).json({ message: 'Order data is required' });
  }

  try {
    // Create email transporter (you'll need to configure this with your email service)
    const transporter = nodemailer.createTransporter({
      // For Gmail (you can change this to your preferred email service)
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your app password
      },
      // Alternative: Use SMTP settings
      // host: 'smtp.your-email-provider.com',
      // port: 587,
      // secure: false,
      // auth: {
      //   user: process.env.EMAIL_USER,
      //   pass: process.env.EMAIL_PASSWORD,
      // },
    });

    // Calculate totals
    const grossTotal = orderData.totalPrice?.centAmount || 0;
    const netTotal = orderData.taxedPrice?.totalNet?.centAmount || Math.round(grossTotal / 1.2);
    const vatAmount = orderData.taxedPrice?.taxPortions?.[0]?.amount?.centAmount || (grossTotal - netTotal);
    const vatRate = orderData.taxedPrice?.taxPortions?.[0]?.rate || 0.2;
    const currency = orderData.totalPrice?.currencyCode || 'GBP';

    // Generate order items HTML
    const orderItemsHTML = orderData.lineItems?.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; vertical-align: top;">
          <strong style="color: #0d2340;">${item.name?.['en-GB'] || item.name?.['en'] || item.name}</strong><br>
          <span style="color: #6b7280; font-size: 14px;">SKU: ${item.variant?.sku || 'N/A'}</span>
        </td>
        <td style="padding: 12px 0; text-align: center; color: #6b7280;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; text-align: right; color: #0d2340; font-weight: 600;">
          ${currency} ${((item.totalPrice?.centAmount || 0) / 100).toFixed(2)}
        </td>
      </tr>
    `).join('') || '';

    // Email HTML template
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Confirmation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #0d2340; padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
            Order Confirmation
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          
          <!-- Success Message -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 60px; height: 60px; background-color: #d7e9f7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d2340" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style="color: #0d2340; margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">
              Thank you for your order!
            </h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">
              We've received your order and will process it shortly.
            </p>
          </div>

          <!-- Order Details -->
          <div style="background-color: #f8fafe; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #0d2340; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Order Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order Number:</td>
                <td style="padding: 8px 0; color: #0d2340; font-weight: 700; text-align: right;">
                  ${orderData.orderNumber || 'N/A'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order Date:</td>
                <td style="padding: 8px 0; color: #0d2340; font-weight: 600; text-align: right;">
                  ${new Date(orderData.createdAt || Date.now()).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Customer Email:</td>
                <td style="padding: 8px 0; color: #0d2340; font-weight: 600; text-align: right;">
                  ${orderData.customerEmail || 'N/A'}
                </td>
              </tr>
            </table>
          </div>

          <!-- Order Items -->
          ${orderItemsHTML ? `
          <div style="margin-bottom: 24px;">
            <h3 style="color: #0d2340; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Order Items
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px 0; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px;">Item</th>
                  <th style="padding: 12px 0; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px;">Qty</th>
                  <th style="padding: 12px 0; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHTML}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Price Summary -->
          <div style="background-color: #f8fafe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #0d2340; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Order Summary
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${orderData.taxedPrice ? `
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Subtotal (net):</td>
                <td style="padding: 6px 0; text-align: right; color: #0d2340; font-weight: 600;">
                  ${currency} ${(netTotal / 100).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">VAT (${(vatRate * 100).toFixed(0)}%):</td>
                <td style="padding: 6px 0; text-align: right; color: #0d2340; font-weight: 600;">
                  ${currency} ${(vatAmount / 100).toFixed(2)}
                </td>
              </tr>
              <tr style="border-top: 1px solid #d7e9f7;">
                <td style="padding: 12px 0 0 0; color: #0d2340; font-weight: 700; font-size: 18px;">Total:</td>
                <td style="padding: 12px 0 0 0; text-align: right; color: #0d2340; font-weight: 700; font-size: 18px;">
                  ${currency} ${(grossTotal / 100).toFixed(2)}
                </td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 12px 0; color: #0d2340; font-weight: 700; font-size: 18px;">Total:</td>
                <td style="padding: 12px 0; text-align: right; color: #0d2340; font-weight: 700; font-size: 18px;">
                  ${currency} ${(grossTotal / 100).toFixed(2)}
                </td>
              </tr>
              `}
            </table>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #f9fafb; border-left: 4px solid #d7e9f7; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #0d2340; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
              What happens next?
            </h3>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>We'll process your order within 1-2 business days</li>
              <li>You'll receive a shipping confirmation email once dispatched</li>
              <li>Estimated delivery: 3-5 business days</li>
              <li>Track your order in your account dashboard</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
              Questions about your order? Contact our support team.
            </p>
            <a href="mailto:support@yourcompany.com" style="color: #0d2340; text-decoration: none; font-weight: 600;">
              support@yourcompany.com
            </a>
          </div>

        </div>
      </div>
    </body>
    </html>
    `;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber || 'Your Order'}`,
      html: emailHTML,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log('Order confirmation email sent successfully to:', orderData.customerEmail);

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      recipient: orderData.customerEmail
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
}

// You'll need to install nodemailer:
// npm install nodemailer