const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587
        auth: {
            user: 'xcybeamer@gmail.com',
            pass: 'mssa snti nkfx fomu'
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
    });
}

// Generate email verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
    try {
        const transporter = createTransporter();

        // Verification URL
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&userId=${user._id}`;

        // Email content
        const mailOptions = {
            from: `"XCY BEAMER" <xcybeamer@gmail.com>`,
            to: user.email,
            subject: 'Verify Your Email - XCY BEAMER',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">XCY BEAMER</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9f9f9;">
                        <h2 style="color: #333;">Welcome to XCY BEAMER!</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Hi ${user.username},<br><br>
                            Thank you for registering with XCY BEAMER. To complete your registration and access all features, please verify your email address by clicking the button below:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 12px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #666; line-height: 1.6;">
                            Or copy and paste this link into your browser:<br>
                            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                        </p>
                        <p style="color: #666; line-height: 1.6;">
                            This verification link will expire in 24 hours.<br><br>
                            If you didn't create an account with XCY BEAMER, please ignore this email.
                        </p>
                    </div>
                    <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} XCY BEAMER. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
    try {
        const transporter = createTransporter();

        // Reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&userId=${user._id}`;

        // Email content
        const mailOptions = {
            from: `"XCY BEAMER" <xcybeamer@gmail.com>`,
            to: user.email,
            subject: 'Reset Your Password - XCY BEAMER',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">XCY BEAMER</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9f9f9;">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Hi ${user.username},<br><br>
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 12px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #666; line-height: 1.6;">
                            Or copy and paste this link into your browser:<br>
                            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                        </p>
                        <p style="color: #666; line-height: 1.6;">
                            This password reset link will expire in 1 hour.<br><br>
                            If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                        </p>
                    </div>
                    <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} XCY BEAMER. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

// Send welcome email (after verification)
const sendWelcomeEmail = async (user) => {
    try {
        const transporter = createTransporter();

        // Email content
        const mailOptions = {
            from: `"XCY BEAMER" <xcybeamer@gmail.com>`,
            to: user.email,
            subject: 'Welcome to XCY BEAMER!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">XCY BEAMER</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9f9f9;">
                        <h2 style="color: #333;">Welcome Aboard!</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Hi ${user.username},<br><br>
                            Congratulations! Your email has been successfully verified and your account is now fully activated.
                        </p>
                        <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
                            <p style="color: #2e7d32; margin: 0;">
                                <strong>Your account is now ready to use!</strong><br>
                                You can now access all features of XCY BEAMER.
                            </p>
                        </div>
                        <p style="color: #666; line-height: 1.6;">
                            Here's what you can do next:
                        </p>
                        <ul style="color: #666; line-height: 1.6;">
                            <li>Browse our products and make purchases</li>
                            <li>Access your client dashboard</li>
                            <li>View installation guides</li>
                            <li>Enable two-factor authentication for extra security</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/client" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 12px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Go to Client Dashboard
                            </a>
                        </div>
                        <p style="color: #666; line-height: 1.6;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.
                        </p>
                    </div>
                    <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} XCY BEAMER. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

module.exports = {
    generateVerificationToken,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};