const nodemailer = require('nodemailer');

const sendEmail = async (to, otpCode, type = 'login') => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let subject, text;

  if (type === 'login') {
    subject = 'Your OTP for Logging In';
    text = `
Dear User,

We received a login request for your account. Please use the following OTP to complete your login:

OTP Code: ${otpCode}

This code will expire in 5 minutes.

Thank you,  

    `;
  } else if (type === 'forgot-password') {
    subject = ' Reset Your Password with OTP';
    text = `
Dear User,

We received a request to reset the password for your account. Please use the following OTP to proceed with setting a new password:

OTP Code: ${otpCode}

This code is valid for 5 minutes.
Thank you,
    `;
  }

  await transporter.sendMail({
    from: `"SaaS APP" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;
