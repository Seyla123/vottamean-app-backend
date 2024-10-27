// forgotPasswordTemplate.js
exports.forgotPasswordEmailTemplate = ({
  firstName,
  resetURL,
  unsubscriberesetURL,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background-color: #4379F2; padding: 20px 10px; text-align: center;">
            <img src="https://wavetrack-s3-bucket-deploy.s3.us-east-1.amazonaws.com/logo-vottamean.png" alt="Vottamean Logo" style="width: 60px; height: auto; margin-bottom: 20px;"/>
            <h1 style="color: white; font-size: 28px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Password Reset Request</h1>
        </div>
        <div style="padding: 40px 30px; color: #333;">
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 25px;">Hello <span style="font-weight: bold; color: #4379F2;">${firstName}</span>,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <a href="${resetURL}" style="display: inline-block; padding: 14px 30px; background-color: #4379F2; color: white; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold;  box-shadow: 0 4px 15px rgba(67, 121, 242, 0.3);">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px;">If you did not request this, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #666; position: relative;">
            <img src="https://react-email-demo-5c0l8sni5-resend.vercel.app/static/yelp-footer.png" alt="footer image" style="position: absolute; top: 0; left: 0; width: 100%; height: auto;">
            <p style="margin: 10px 0px;">© ${new Date().getFullYear()} Vottamean. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};
