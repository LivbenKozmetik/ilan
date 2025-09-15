# İlan Platform - Admin Panel

A comprehensive listing platform with a professional admin panel built with Node.js, Express, PostgreSQL, React, and TypeScript.

## Features

### Backend
- **Authentication & Authorization**: JWT-based auth with refresh tokens and role-based access control
- **Role Management**: Three-tier hierarchy (user, manager, admin) with appropriate permissions
- **Audit Logging**: Comprehensive logging of all admin actions for accountability
- **File Upload**: Secure file upload with local storage and S3 support
- **API Security**: Rate limiting, CORS, helmet security headers
- **Database**: PostgreSQL with proper migrations and seeding

### Admin Frontend
- **Modern Stack**: React 18 + TypeScript + Vite + Material-UI
- **Authentication**: Secure login with automatic token refresh
- **Responsive Design**: Mobile-friendly layout with sidebar navigation
- **Internationalization**: Support for English and Turkish languages
- **Theme Support**: Light/dark mode toggle
- **User Management**: View, search, and modify user roles (admin only)
- **Listing Management**: CRUD operations with bulk actions and CSV export
- **Audit Logs**: View system activity with filtering options

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ilan
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

3. **Install backend dependencies**
   ```bash
   npm install
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb ilan_db
   
   # Run migrations (creates tables and seeds admin user)
   npm run migrate
   ```

5. **Start the backend server**
   ```bash
   npm run dev  # or npm start
   ```
   Backend will be available at http://localhost:4000

6. **Install and start frontend**
   ```bash
   cd admin-frontend
   npm install
   npm run dev
   ```
   Frontend will be available at http://localhost:3000

### Demo Login
- **Email**: admin@livben.com
- **Password**: admin123

## Docker Setup

For a complete containerized setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

## Project Structure

```
├── server.js              # Main backend server
├── db.js                  # Database connection
├── migrations/            # Database migrations
│   └── init.sql          # Initial schema and seeds
├── tests/                 # Backend tests
├── admin-frontend/        # React admin interface
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (auth, theme)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   └── locales/       # Translation files
│   └── dist/             # Built frontend assets
└── uploads/              # File upload directory
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/listings` - List public listings
- `GET /api/listings/:id` - Get single listing

### Protected Endpoints
- `POST /api/listings` - Create listing (authenticated users)
- `POST /api/upload` - Upload files (authenticated users)

### Admin Endpoints (Manager+ Role Required)
- `GET /api/admin/users` - List users with search and pagination
- `GET /api/admin/audit` - View audit logs
- `PUT /api/admin/listings/:id` - Update any listing
- `DELETE /api/admin/listings/:id` - Delete any listing
- `POST /api/admin/listings/bulk-delete` - Bulk delete listings
- `GET /api/admin/listings/export` - Export listings data

### Admin Endpoints (Admin Role Required)
- `PATCH /api/admin/users/:id/role` - Change user role

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/ilan_db

# JWT Secrets (generate strong secrets for production!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
REFRESH_SECRET=your-super-secret-refresh-key-different-from-jwt

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional: AWS S3 for file storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-central-1
S3_BUCKET=your-s3-bucket-name
```

## Security Features

- **JWT Access Tokens**: Short-lived (15 minutes) for API requests
- **Refresh Tokens**: Long-lived (7 days) stored as httpOnly cookies
- **Role-Based Access Control**: Three-tier permission system
- **Rate Limiting**: Protects against brute force attacks
- **CORS Configuration**: Restricts cross-origin requests
- **Security Headers**: Helmet.js for common security headers
- **Input Validation**: Joi schemas for request validation
- **Password Hashing**: bcrypt for secure password storage
- **Audit Logging**: Track all admin actions with IP and user agent

## File Storage

### Local Storage (Default)
Files are stored in the `uploads/` directory. Suitable for development and small deployments.

### AWS S3 Storage
Configure AWS credentials in environment variables to use S3:
- Automatic presigned URL generation for direct browser uploads
- Public read access for uploaded files
- Configurable bucket and region

## Database Schema

### Users Table
- id, email, password_hash, name, role, created_at, updated_at
- Roles: 'user', 'manager', 'admin'

### Listings Table  
- id, title, description, price, category, location, images[], owner_id, created_at, updated_at

### Refresh Tokens Table
- id, token, user_id, expires_at, created_at

### Audit Logs Table
- id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at

## Development

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests (when implemented)
cd admin-frontend
npm test
```

### Linting
```bash
# Backend (uses existing Node.js best practices)
npm run lint  # if configured

# Frontend
cd admin-frontend
npm run lint
```

### Building for Production
```bash
# Frontend build
cd admin-frontend
npm run build

# Use with your preferred deployment method
```

## Deployment

### Manual Deployment
1. Build the frontend: `cd admin-frontend && npm run build`
2. Set production environment variables
3. Ensure PostgreSQL is accessible
4. Run migrations: `npm run migrate`
5. Start the backend: `npm start`
6. Serve frontend build files with nginx/apache

### Docker Deployment
```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Notes
- **Development**: Uses local storage, relaxed CORS
- **Production**: Enable secure cookies, restrict CORS, use HTTPS
- **Database**: Consider connection pooling for high traffic
- **Files**: Use S3 or similar object storage for scalability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is proprietary software for LivbenKozmetik.

## Support

For support, please contact the development team or create an issue in the repository.