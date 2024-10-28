# HexCode+

## Server-Side Project

## [Convention Guide](https://outgoing-oval-b13.notion.site/Capstones-Convention-Guide-f8214576f0da41758941a1678c8a6e07?pvs=4)

## Table of Contents
1. [Project Overview](#project-overview)
2. [Dependencies](#dependencies)
3. [Project Structure](#project-structure)
4. [API Standards](#api-standards)
5. [Authentication & Authorization](#authentication-and-authorization)
6. [File Handling and Storage](#file-handling-and-storage)
7. [Error Handling and Logging](#error-handling-and-logging)
8. [Testing](#testing)
9. [Version Control](#version-control)
10. [Deployment Conventions](#deployment-conventions)
11. [Naming, Git & Development Workflow](#naming-git-and-development-workflow)

## 1. Project Overview
This is a server-side application built with **Node.js** and **Express**. It provides a backend service for a client-side application, with features like authentication, file storage with AWS S3, email notifications, and payment integration via Stripe.

## 2. Dependencies
Key dependencies for this project include:
- **@aws-sdk/client-s3**: Handles AWS S3 interactions for file storage.
- **bcryptjs**: Password hashing.
- **body-parser**: Parses request bodies.
- **cookie-parser**: Parses cookies for session management.
- **cors**: Enables Cross-Origin Resource Sharing.
- **dotenv**: Manages environment variables.
- **express**: Server framework.
- **jsonwebtoken**: Manages JSON web tokens for authentication.
- **mysql2**: MySQL database driver.
- **nodemailer**: Sends emails.
- **sequelize**: ORM for managing database interactions.
- **stripe**: Processes payments.
- **validator**: Validates and sanitizes input data.

Refer to `package.json` for a complete list of dependencies and their versions.

## 3. Project Structure

### 3.1 Root Directory
- **index.js**: Server entry point.
- **/config**: Environment variables and database configuration.
- **/controllers**: Business logic for each route.
- **/middlewares**: Custom middleware (e.g., authentication).
- **/models**: Sequelize models for database entities.
- **/routes**: API endpoints.
- **/services**: Service layer for third-party API integrations.
- **/utils**: Helper functions (e.g., error handling, file utilities).
- **/logs**: Stores server logs.

## 4. API Standards
- Use REST principles for structuring endpoints.
- HTTP Status Codes:
  - **200 OK** for successful operations.
  - **201 Created** for successful resource creation.
  - **400 Bad Request** for validation errors.
  - **401 Unauthorized** for authentication issues.
  - **500 Internal Server Error** for unhandled exceptions.

## 5. Authentication & Authorization
- **JWT** is used for session management.
- **bcryptjs** hashes passwords before storing them in the database.
- Role-based access control (RBAC) manages permissions:
  - **Admin**: Full access.
  - **User**: Limited access based on permissions.

## 6. File Handling and Storage
- **AWS S3** is used for storing files.
- **Multer**: Handles file uploads.
- **Sharp**: Optimizes and resizes images before uploading to S3.

## 7. Error Handling and Logging
- **Morgan** logs HTTP requests.
- Custom error-handling middleware sends JSON error responses to the client.
- **html-to-text**: Converts HTML to text for logging purposes.

## 8. Testing
- **Jest** and **Supertest** are recommended for unit and integration tests.
- Testing strategy:
  - Unit tests for services and utilities.
  - Integration tests for controllers and routes.

## 9. Version Control
- **Feature-Branch** workflow:
  - **main**: Stable release.
  - **develop**: Ongoing development.
  - Branch naming convention: `feature/<feature-name>`, `bugfix/<bug-name>`, `hotfix/<hotfix-name>`.

## 10. Deployment Conventions

### 10.1 Server-Side Deployment
- **Platform**: Deployed on an AWS EC2 instance with Docker for containerization.
- **Nginx** serves as a reverse proxy to handle traffic.
- **Steps**:
  1. **Set Up EC2**:
      - Create and configure an EC2 instance.
      - SSH into the instance.
      ```bash
      ssh -i your-key.pem ubuntu@your-ec2-instance-ip
      ```
  2. **Environment Configuration**:
      - Use `.env` for sensitive information.
  3. **Docker**:
      - Use Docker to containerize the app.
      ```bash
      docker build -t your-app-name .
      docker run -d -p 80:80 your-app-name
      ```

## 11. Naming, Git & Development Workflow

### 11.1 Naming Conventions
- Use `camelCase` for variables and functions.
- Use `PascalCase` for classes and model names.
- Use `snake_case` for database tables and columns.

### 11.2 Git Conventions
- **Branching Workflow**:
  - Follow a consistent branching model.
  - Use branches for each new feature or bug fix.
  - Branch names should reflect the task (e.g., `feature/add-auth`).

### 11.3 Deployment and CI/CD
- **GitHub Actions** for automated CI/CD pipeline.
- Automated tests and linting before merge.

💡 **Note**: Ensure commit messages are concise and clear.

---

For further details and configuration options, refer to additional documentation within each module directory.
