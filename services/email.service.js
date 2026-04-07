import nodeMailer from 'nodemailer';
import config from '../configs/config.js';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_USER } = config;

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: GOOGLE_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('Error setting up email transporter:', error);
    } else {
        console.log('Email transporter is ready to send messages');
    }
});

export const sendEmail = async (to, subject, text, html) => {
    const info = {
        from: GOOGLE_USER,
        to,
        subject,
        text,
        html
    };

    try {
        const info = await transporter.sendMail(info);
        console.log('Email sent successfully:', info.messageId);
        console.log('Preview URL:', nodeMailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};