const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const sendApprovalEmail = async (userId, first_name, last_name, email, role) => {
    const approvalEmail = process.env.APPROVAL_EMAIL;
    const approvalLink = `${process.env.BASE_URL}/users/approve/${userId}`;
    const disapprovalLink = `${process.env.BASE_URL}/users/disapprove/${userId}`;

    const emailSubject = `Approval Required for New ${role}`;
    const emailBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #007BFF; color: #fff; padding: 16px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Approval Required</h1>
        </div>
        <div style="padding: 24px;">
            <p>Dear Admin,</p>
            <p>A new user has signed up with the following details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Name:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${first_name} ${last_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Email:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Role:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${role}</td>
                </tr>
            </table>
            <p style="margin: 16px 0;">Please choose an action below:</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${approvalLink}" target="_blank" style="display: inline-block; background-color: #28a745; color: #fff; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px; margin-right: 8px;">Approve ${role}</a>
                <a href="${disapprovalLink}" target="_blank" style="display: inline-block; background-color: #dc3545; color: #fff; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px;">Disapprove ${role}</a>
            </div>
            <p style="margin: 16px 0;">Thank you!</p>
        </div>
        <div style="background-color: #f8f9fa; color: #666; padding: 16px; text-align: center; font-size: 12px; border-top: 1px solid #ddd;">
            <p style="margin: 0;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
`;

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: approvalEmail,
            subject: emailSubject,
            html: emailBody,
        });

        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw new Error('Error sending approval email');
    }
};

module.exports = {
    sendApprovalEmail,
};
