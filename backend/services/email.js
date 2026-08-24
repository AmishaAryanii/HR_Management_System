const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const resetEmailTemplate = (resetUrl) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <div style="background: #2563eb; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">HRMS</h1>
      <p style="color: #93c5fd; margin: 4px 0 0; font-size: 14px;">Password Reset Request</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 8px;">Reset Your Password</h2>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        You recently requested to reset your password. Click the button below to set a new one.
        This link is valid for 1 hour.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Reset Password
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; line-height: 1.5;">
        If you didn't request this, please ignore this email. Your password will remain unchanged.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Or copy this link: <br />
        <span style="color: #2563eb; word-break: break-all;">${resetUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html, attachments }) => {
  if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
    console.log('\n=== EMAIL (dev mode) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    if (attachments && attachments.length > 0) {
      console.log('Attachments:', attachments.map(a => a.filename + ' (' + (a.content?.length || 0) + ' bytes)').join(', '));
    }
    console.log('========================\n');
    return { messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const mailOptions = {
      from: '"' + (process.env.SMTP_FROM_NAME || 'HRMS') + '" <' + (process.env.SMTP_FROM || process.env.SMTP_USER) + '>',
      to,
      subject,
      html
    };
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return null;
  }
};

module.exports = { sendEmail, resetEmailTemplate };
