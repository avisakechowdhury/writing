import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // For development, use Gmail SMTP
  if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // For production, use the configured service
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email verification OTP
export const sendEmailVerificationOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your WriteAnon Account',
      html: `
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
            <p>© 2024 WriteAnon. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email verification OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email verification OTP:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your WriteAnon Password',
      html: `
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
            <p>© 2024 WriteAnon. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
