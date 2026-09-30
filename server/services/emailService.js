import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const isProduction = process.env.NODE_ENV === 'production';

  // For Gmail, use explicit configuration with proper timeout and connection settings
  if (emailService.toLowerCase() === 'gmail') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      // Use Port 465 (SSL) for reliable delivery on cloud hosts like Render
      port: 465, 
      secure: true, // Must be true for port 465
      auth: {
        user: emailUser,
        pass: emailPass
      },
      family: 4,
      logger: !isProduction,
      debug: !isProduction,
      tls: {
        rejectUnauthorized: isProduction
      },
      connectionTimeout: 30000, // 30 seconds (increased for cloud hosts)
      greetingTimeout: 30000,
      socketTimeout: 30000,
      // Pool configuration
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      rateDelta: 1000,
      rateLimit: 5
    });
  }

  // For other services, use service name with improved settings
  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: isProduction
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
  });
};

// Helper function to send email with retry logic
const sendEmailWithRetry = async (transporter, mailOptions, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully (attempt ${attempt}): messageId=${info.messageId}`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt}/${maxRetries} failed:`, error.message, error.code || '');
      
      // Retryable transient errors
      const retryableCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'EAI_AGAIN'];
      if (attempt < maxRetries && retryableCodes.includes(error.code)) {
        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s
        console.log(`Retrying email send in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors or last attempt, throw
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Strip HTML tags to produce a plain-text version of the email body.
 * This improves deliverability and is required by many spam filters.
 */
const htmlToText = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Send email verification OTP
export const sendEmailVerificationOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();
    const isProduction = process.env.NODE_ENV === 'production';

    // Only run SMTP verify in development — in production, just attempt delivery
    if (!isProduction) {
      console.log("Attempting to verify SMTP connection...");
      try {
        await transporter.verify();
        console.log("✅ SMTP Connection Successful!");
      } catch (verifyError) {
        console.error("❌ SMTP Connection Failed during verify:", verifyError);
        return false; // Stop here if we can't connect locally
      }
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">WriteAnon</h1>
          <p style="color: #6B7280; margin: 5px 0;">Your Daily Writing Community</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Verify Your Email Address</h2>
          <p style="color: #6B7280; margin: 0 0 20px 0; line-height: 1.6;">
            Thank you for joining WriteAnon! To complete your registration and start your writing journey, 
            please verify your email address using the code below:
          </p>
          
          <div style="background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #6B7280; margin: 20px 0 0 0; font-size: 14px;">
            This code will expire in 24 hours. If you didn't create an account with WriteAnon, 
            please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} WriteAnon. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `WriteAnon <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your WriteAnon Account',
      html: htmlBody,
      text: htmlToText(htmlBody)
    };

    await sendEmailWithRetry(transporter, mailOptions);
    console.log(`Email verification OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email verification OTP:', error?.message || error, error?.code || '');
    // Don't crash the server, just return false
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    const isProduction = process.env.NODE_ENV === 'production';

    // Only run SMTP verify in development — in production, just attempt delivery.
    // Render and similar cloud hosts can have slow SMTP handshakes that cause
    // verify() to timeout, but sendMail() succeeds because it has longer internal timeouts.
    if (!isProduction) {
      try {
        await transporter.verify();
      } catch (verifyErr) {
        console.error('Password reset: SMTP verify failed:', verifyErr.message);
        return false;
      }
    }

    // Ensure we handle multiple URLs if comma separated, taking the first one
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">WriteAnon</h1>
          <p style="color: #6B7280; margin: 5px 0;">Your Daily Writing Community</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Reset Your Password</h2>
          <p style="color: #6B7280; margin: 0 0 20px 0; line-height: 1.6;">
            We received a request to reset your password for your WriteAnon account. 
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6B7280; margin: 20px 0 0 0; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request a password reset, 
            please ignore this email or contact support if you have concerns.
          </p>
          
          <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} WriteAnon. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `WriteAnon <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your WriteAnon Password',
      html: htmlBody,
      text: htmlToText(htmlBody),
      // Headers that improve deliverability
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'WriteAnon Mailer',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM || process.env.EMAIL_USER}?subject=unsubscribe>`
      }
    };

    await sendEmailWithRetry(transporter, mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error?.message || error, error?.code || '');
    return false;
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};