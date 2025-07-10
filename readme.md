# SnapNet Document Verification System

A mini document verification system with user authentication, document upload, async verification, and admin management.

## 🚀 Quick Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)

### 1. Clone and Setup

```bash
git clone https://github.com/ayoadeoye1/snapnet.git
cd snapnet-test
npm install
```

### 2. Start Services with Docker

```bash
docker-compose up -d
```

### 3. Start the Application

```bash
npm run dev

npm run build
npm start
```

The API will be running at `http://localhost:8000`

### 4. Create Admin Account

1. Open `http://localhost:8000/api/v1/api-docs`
2. Go to Authentication section
3. Use the `/auth/signup` endpoint with `role: "admin"`, ignore for user account

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register user/admin
- `POST /api/v1/auth/login` - Login

### Documents (User)

- `POST /api/v1/documents` - Upload document
- `GET /api/v1/documents` - Get my documents

### Admin

- `GET /api/v1/admin/documents` - View all documents
- `GET /api/v1/admin/users` - View all users

## 🛠 Service URLs

- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api-docs
- **MySQL**: localhost:3306
- **Redis**: localhost:6379
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **Cloudinary**: https://https://console.cloudinary.com/

## 🧪 Testing

```bash
npm test

npm run test:watch
```

## 📁 Project Structure

```
src/
├── application/use-cases/     # Business logic
├── domain/entities/           # Data models
├── infrastructure/           # External services (DB, Redis, Queue)
├── presentation/            # Controllers, routes, middleware
└── workers/                # Background job processors
```

## Default credentials are in the config file.