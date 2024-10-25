// emailTemplates.js

function generateSupportEmailTemplate(name, email, message) {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request</title>
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
            color: #333;
          }
  
          .email-wrapper {
            width: 100%;
            background-color: #f0f0f0;
            padding: 40px 0;
          }
  
          .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          }
  
          .email-header {
            text-align: center;
            padding: 20px;
            background-color: #2c3e50;
          }
  
          .email-header img {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
          }
  
          .email-body {
            padding: 30px;
            background-color: #f7f9fb;
          }
  
          .email-body h2 {
            font-size: 22px;
            color: #34495e;
            margin-bottom: 15px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
          }
  
          .email-body p {
            font-size: 16px;
            color: #7f8c8d;
            line-height: 1.6;
            margin-bottom: 20px;
          }
  
          .email-details {
            background-color: #ffffff;
            border: 1px solid #ecf0f1;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
  
          .email-details table {
            width: 100%;
            border-collapse: collapse;
          }
  
          .email-details th, .email-details td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
          }
  
          .email-footer {
            padding: 20px;
            text-align: center;
            font-size: 14px;
            background-color: #ecf0f1;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <img src="https://wavetrack-s3-bucket-deploy.s3.us-east-1.amazonaws.com/logo-vottamean.png" alt="Company Logo" onerror="this.onerror=null; this.src=''; this.alt='Company Logo';">
            </div>
  
            <div class="email-body">
              <h2>New Support Request</h2>
              <p>You have received a new support request. Here are the details:</p>
              
              <div class="email-details">
                <table>
                  <tr>
                    <th style="color: #34495e;">Name:</th>
                    <td style="color: #7f8c8d;">${name}</td>
                  </tr>
                  <tr>
                    <th style="color: #34495e;">Email:</th>
                    <td style="color: #7f8c8d;">${email}</td>
                  </tr>
                  <tr>
                    <th style="color: #34495e;">Message:</th>
                    <td style="color: #7f8c8d;">${message}</td>
                  </tr>
                </table>
              </div>
            </div>
  
            <div class="email-footer">
              <p>Please respond to this request promptly to assist the user.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
}

module.exports = { generateSupportEmailTemplate };
