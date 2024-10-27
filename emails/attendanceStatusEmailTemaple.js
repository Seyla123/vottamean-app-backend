exports.attendanceStatusEmailTemplate = (data, status) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Notification</title>
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
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }

    .email-header {
      background-color: #2c3e50;
      padding: 40px;
      text-align: center;
      color: #ffffff;
    }

    .email-header h1 {
      font-size: 26px;
      margin: 0;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .email-body {
      padding: 40px;
      background-color: #f7f9fb;
    }

    .email-body h2 {
      font-size: 22px;
      color: #34495e;
      margin-bottom: 15px;
    }

    .email-body p {
      font-size: 16px;
      color: #7f8c8d;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .email-body .highlight {
      font-weight: 700;
      color: #2c3e50;
    }

    .email-details {
      background-color: #ffffff;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .email-details h3 {
      font-size: 18px;
      margin-bottom: 10px;
      color: #2c3e50;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .email-details table {
      width: 100%;
      border-collapse: collapse;
    }

    .email-details th, .email-details td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #ecf0f1;
    }

    .email-details th {
      color: #7f8c8d;
      text-transform: uppercase;
      font-size: 14px;
    }

    .email-details td {
      font-size: 16px;
      color: #34495e;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .status-present {
      background-color: #27ae60;
      color: #ffffff;
    }

    .status-late {
      background-color: #f39c12;
      color: #ffffff;
    }

    .status-absent {
      background-color: #c0392b;
      color: #ffffff;
    }

    .status-permission {
      background-color: #2980b9;
      color: #ffffff;
    }

    .email-footer {
      padding: 30px;
      text-align: center;
      font-size: 14px;
      background-color: #ecf0f1;
      color: #7f8c8d;
    }

    .email-footer p {
      margin: 0;
    }

    .email-footer a {
      color: #2980b9;
      text-decoration: none;
    }
  </style>
</head>

<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Attendance Alert</h1>
      </div>

      <div class="email-body">
        <h2>Hello ${data.guardianName},</h2>
        <p>We are writing to inform you that your child, <span class="highlight">${
          data.studentName
        }</span>, has been marked for today's session as follows:</p>

        <div class="email-details">
          <h3>Session Details</h3>
          <table>
            <tr>
              <th>Status</th>
              <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
            </tr>
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
              <th>Time</th>
              <td>${data.studyTime}</td>
            </tr>
          </table>
        </div>

        <p>If you have any questions or need further clarification, feel free to reach out to us.</p>
        <p>Best regards,<br>${data.schoolName}</p>
      </div>

      <div class="email-footer">
        <p>&copy; ${new Date().getFullYear()} ${
  data.schoolName
}. All Rights Reserved.</p>
        <p><a href="#">Contact Us</a> | <a href="#">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;
