exports.attendanceStatusEmailTemplate = (data, status) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Notification</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f7;
      margin: 0;
      padding: 0;
      color: #4a4a4a;
    }

    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background-color: #4CAF50;
      padding: 20px;
      text-align: center;
      color: white;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 1px;
    }

    .content {
      padding: 30px;
      line-height: 1.6;
    }

    .content h2 {
      color: #333;
      font-size: 20px;
      margin-bottom: 20px;
    }

    .content p {
      font-size: 16px;
      margin-bottom: 20px;
    }

    .highlight {
      font-weight: bold;
      color: #4CAF50;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .details-table th, .details-table td {
      padding: 15px;
      text-align: left;
      font-size: 16px;
      border-bottom: 1px solid #eee;
    }

    .details-table th {
      background-color: #f4f4f7;
      color: #4CAF50;
      font-weight: bold;
    }

    .status {
      font-size: 14px;
      padding: 10px 15px;
      border-radius: 50px;
      display: inline-block;
      text-transform: uppercase;
      font-weight: bold;
      color: #fff;
    }

    .status-present {
      background-color: #28a745;
    }

    .status-late {
      background-color: #ffc107;
    }

    .status-absent {
      background-color: #dc3545;
    }

    .status-permission {
      background-color: #17a2b8;
    }

    .footer {
      padding: 20px;
      background-color: #f4f4f7;
      text-align: center;
      font-size: 14px;
      color: #666;
    }

    .footer p {
      margin: 0;
    }

    .footer a {
      color: #4CAF50;
      text-decoration: none;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1>Attendance Update</h1>
    </div>

    <div class="content">
      <h2>Dear ${data.guardainName},</h2>
      <p>We are writing to inform you that your child, <span class="highlight">${data.studentName}</span>, has been marked as <span class="status status-${status.toLowerCase()}">${status}</span> for the following session:</p>

      <table class="details-table">
        <tr>
          <th>Class</th>
          <td>${data.className}</td>
        </tr>
        <tr>
          <th>Subject</th>
          <td>${data.subjectName}</td>
        </tr>
        <tr>
          <th>Teacher</th>
          <td>${data.teacherName}</td>
        </tr>
        <tr>
          <th>Date</th>
          <td>${data.sessionDate}</td>
        </tr>
        <tr>
          <th>Study Time</th>
          <td>${data.studyTime}</td>
        </tr>
      </table>

      <p>If you have any questions or need further assistance, please feel free to reach out to us.</p>

      <p>Best regards,<br>${data.schoolName}</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${data.schoolName}. All rights reserved.</p>
      <p><a href="#">Unsubscribe</a> | <a href="#">Contact Us</a></p>
    </div>
  </div>
</body>
</html>
`;
