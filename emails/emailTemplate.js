function generateEmailTemplate(firstName, url, subject, unsubscribeUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background-color: #4379F2; padding: 20px 10px; text-align: center;">
            <img src="https://wavetrack-s3-bucket-deploy.s3.us-east-1.amazonaws.com/logo-vottamean.png" alt="WaveTrack Logo" style="width: 60px; height: auto; margin-bottom: 20px;"/>
            <h1 style="color: white; font-size: 28px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${subject}</h1>
        </div>
        <div style="padding: 40px 30px; color: #333;">
            <div style="background-color: #f8fafc; text-align: center; font-size: 14px; color: #666; position: relative;">
                <img src="https://i.pinimg.com/564x/fb/9c/ba/fb9cba7badda493e31abe27c7173c582.jpg" alt="WaveTrack Logo" style="position: absolute; top: 0; left: 0; width: 100%; height: auto;"/>
            </div>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 25px;">Hello <span style="font-weight: bold; color: #4379F2;">${firstName}</span>,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">Thank you for joining Vottamean! We're excited to have you on board. To get started, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
                <a href="${url}" style="display: inline-block; padding: 14px 30px; background-color: #4379F2; color: white; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold;  box-shadow: 0 4px 15px rgba(67, 121, 242, 0.3);">Verify Email</a>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px;">If you didn't create a Vottamean account, no worries! You can safely ignore this email.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #666; position: relative;">
        <img src="https://react-email-demo-5c0l8sni5-resend.vercel.app/static/yelp-footer.png" alt="footer image" style="position: absolute; top: 0; left: 0; width: 100%; height: auto;">
        <p style="margin: 10px 0px;">© ${new Date().getFullYear()} Vottamean. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

module.exports = { generateEmailTemplate };
