import nodemailer from 'nodemailer';

const getTransporter = () => {
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_SECURE } = process.env;

  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: MAIL_SECURE === 'true',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }

  return true;
};

export default sendEmail;
