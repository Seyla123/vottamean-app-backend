# Vottamean Web App Convention Guide

## Table of Contents
1. [Project Structure](#project-structure)
2. [API Naming Conventions](#api-naming-conventions)
3. [Controller Standards](#controller-standards)
4. [Model Standards](#model-standards)
5. [Middleware Standards](#middleware-standards)
6. [Service Layer](#service-layer)
7. [Error Handling](#error-handling)
8. [Version Control](#version-control)
9. [Testing Standards](#testing-standards)

## 1. Project Structure

### 1.1 Root Directory
- **server.js**: Entry point for the server.
- **app.js**: Main Express application setup.
- **/config**: Contains configuration files.
  - **db.config.js**: Database configuration.
  - **env.config.js**: Environment-specific configurations.
- **/controllers**: Directory for controllers.
  - **authController.js**: Handles authentication operations.
  - **userController.js**: Handles user-related operations.
  - **classController.js**: Handles class-related operations.
- **/models**: Directory for Sequelize models.
  - **User.js**: Defines the User model.
  - **Class.js**: Defines the Class model.
  - **Subject.js**: Defines the Subject model.
- **/routes**: Directory for API routes.
  - **authRoutes.js**: Authentication routes.
  - **userRoutes.js**: User management routes.
  - **classRoutes.js**: Class management routes.
- **/services**: Directory for service logic.
  - **authService.js**: Handles business logic for authentication.
  - **userService.js**: Handles user-related logic.
  - **classService.js**: Handles class-related logic.
- **/middlewares**: Directory for custom middleware.
  - **authMiddleware.js**: Middleware for user authentication.
  - **errorMiddleware.js**: Global error handler.
- **/utils**: Utility functions.
  - **logger.js**: Custom logger setup.
  - **responseFormatter.js**: Standard response formatter.
- **/docs**: API documentation files.
- **package.json**: Project metadata and dependencies.
- **README.md**: Project documentation.
- **.env**: Environment configuration file.
- **.gitignore**: Files and folders to be ignored in version control.

## 2. API Naming Conventions

- **GET** `/api/v1/users`: Fetch all users.
- **GET** `/api/v1/users/:id`: Fetch a user by ID.
- **POST** `/api/v1/users`: Create a new user.
- **PUT** `/api/v1/users/:id`: Update a user by ID.
- **DELETE** `/api/v1/users/:id`: Delete a user by ID.

## 3. Controller Standards
- Controllers should only handle request validation, responses, and call service methods.
- Always use `async/await` for async operations.
- All endpoints should be grouped by the controller name (e.g., `userController.js`).

## 4. Model Standards
- Define all models using Sequelize.
- Models should have clear relationships defined (`hasOne`, `hasMany`, `belongsTo`, etc.).
- Use camelCase for attribute names.
- Each model file should export its schema as default.

## 5. Middleware Standards
- Keep middleware modular by creating separate files for each custom middleware.
- Use `authMiddleware.js` for authentication checks.
- All middleware should be placed in `/middlewares` directory.

## 6. Service Layer
- Business logic should be kept in service files under `/services`.
- Each service should have a single responsibility, related to its domain (e.g., `authService.js` handles authentication).
- Services should only interact with controllers and models.

## 7. Error Handling
- Use centralized error handling using an `errorMiddleware.js` file.
- Create a custom error class to differentiate between operational and programming errors.
- Respond with standard error codes and messages.

## 8. Version Control
- Use the **feature-branch** strategy for development.
- Main branches:
  - **main**: Stable release.
  - **develop**: Latest development changes.
- Branch naming convention: `feature/<feature-name>`, `bugfix/<bug-name>`, `hotfix/<hotfix-name>`.

## 9. Testing Standards
- Use **Jest** for unit testing and **Supertest** for API testing.
- Write unit tests for controllers, services, and models.
- Ensure a minimum of 80% test coverage.
- Test files should be named as `*.test.js` and kept in a `__tests__` folder.

---

This `README.md` file serves as a comprehensive guideline for the project structure and coding standards for your server backend project. Follow these conventions to maintain consistency and clarity throughout the project.
