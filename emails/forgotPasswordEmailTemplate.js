// forgotPasswordTemplate.js
exports.forgotPasswordEmailTemplate = ({ firstName, url, unsubscribeUrl }) => {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to reset your password:</p>
        <a 
          href="${url}" 
          style="
            display: inline-block; 
            padding: 10px 15px; 
            margin: 20px 0; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none;
            border-radius: 5px;
          ">
          Reset Password
        </a>
        <p>If you did not request this, please ignore this email. Your password will remain the same.</p>
        <hr>
        <p style="font-size: 0.8rem;">
          If you no longer wish to receive these emails, you can 
          <a href="${unsubscribeUrl}" style="color: #FF0000;">unsubscribe</a> at any time.
        </p>
      </div>
    `;
};
