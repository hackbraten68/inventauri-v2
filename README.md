# ♉ Inventauri v2 – Modern Inventory Management

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-FF5D01?style=flat&logo=astro&logoColor=white)](https://astro.build/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

## 🚀 Features

- **Multi-tenant Architecture** - Support for multiple shops with isolated data
- **Modern Tech Stack** - Built with Astro, Supabase, and Prisma
- **Role-Based Access Control** - Owner, Manager, and Staff roles with granular permissions
- **Real-time Inventory** - Track stock levels across multiple locations
- **Point of Sale** - Process sales with an intuitive interface
- **Comprehensive Reporting** - Sales, inventory, and performance insights
- **API-First Design** - Full-featured REST API for integration

## 🛠 Tech Stack

- **Frontend**: Astro + React + TypeScript
- **UI Components**: Shadcn UI + Tailwind CSS
- **Backend**: Node.js with Astro API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **Containerization**: Docker + Docker Compose
- **Testing**: Vitest + Supertest

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/inventauri-v2.git
   cd inventauri-v2
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your configuration.

3. **Start the development environment**
   ```bash
   # Start all services
   docker compose up -d
   
   # Install dependencies
   npm install
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start the development server
   npm run dev
   ```

4. **Access the application**
   - Web Interface: http://localhost:4321
   - API Documentation: http://localhost:4321/api-docs
   - Database Admin: http://localhost:8080 (pgAdmin)

## 📚 Documentation

- [Quickstart Guide](./specs/001-inventauri-v2-is/quickstart.md) - Get started with Inventauri
- [Admin Guide](./specs/001-inventauri-v2-is/admin-guide.md) - Detailed administration instructions
- [API Reference](./docs/API.md) - Complete API documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🏗 Project Structure

```
├── .github/              # GitHub Actions workflows
├── prisma/               # Database schema and migrations
│   ├── migrations/       # Versioned SQL migrations
│   ├── schema.prisma     # Prisma schema definition
│   └── seed.ts           # Database seeding script
│
├── public/               # Static assets
│   └── images/           # Image assets
│
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── inventory/    # Inventory management
│   │   ├── pos/          # Point of Sale components
│   │   └── ui/           # UI primitives (Shadcn)
│   │
│   ├── lib/              # Application logic
│   │   ├── api/          # API client and utilities
│   │   ├── auth/         # Authentication utilities
│   │   ├── data/         # Data access layer
│   │   └── services/     # Business logic services
│   │
│   ├── pages/            # Application routes
│   │   ├── api/          # API endpoints
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── inventory/    # Inventory management
│   │   ├── pos/          # Point of Sale
│   │   └── ...           # Other pages
│   │
│   ├── styles/           # Global styles
│   └── types/            # TypeScript type definitions
│
├── tests/                # Test suites
│   ├── contracts/        # Contract tests
│   ├── integration/      # Integration tests
│   └── unit/             # Unit tests
│
├── .env.example          # Example environment variables
├── docker-compose.yml    # Docker Compose configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🗃 Data Model

### Core Entities

- **Shop** - Represents a tenant in the multi-tenant system
- **User** - System users with role-based access
- **Product** - Product master data
- **ProductVariant** - Variants of products (size, color, etc.)
- **Warehouse** - Physical or virtual inventory locations
- **Inventory** - Stock levels for variants in warehouses
- **Transaction** - Records of inventory movements
- **Order** - Customer orders and sales

### Multi-tenancy

- All tenant-scoped tables include a `shop_id` column
- Row-level security enforces data isolation
- Users are associated with a single shop by default

## 🔐 Authentication & Authorization

- **Authentication**: Email/password with Supabase Auth
- **Roles**:
  - **Owner**: Full access to all shop features
  - **Manager**: Inventory and sales management
  - **Staff**: Basic POS operations

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - For signing JWT tokens
- `NODE_ENV` - Environment (development/production)

## 🚀 Deployment

### Production

```bash
# Build the application
docker compose -f docker-compose.prod.yml build

# Start the stack
docker compose -f docker-compose.prod.yml up -d
```

### Development

```bash
# Start development services
docker compose up -d

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Astro](https://astro.build/) for the amazing web framework
- [Supabase](https://supabase.com/) for authentication and database
- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Prisma](https://www.prisma.io/) for type-safe database access

## 🛠 Development

### Available Scripts

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run contract tests
npm run test:contracts

# Run linter
npm run lint

# Run type checker
npm run type-check
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Reset database (development)
npm run db:reset

# Seed database with test data
npm run db:seed
```

## 🌟 Features in Development

- [x] Multi-tenant architecture
- [x] Role-based access control
- [x] Product variant management
- [x] Real-time inventory tracking
- [ ] Offline mode with sync
- [ ] Advanced reporting
- [ ] Barcode scanning
- [ ] Supplier management

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate session

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `GET /api/inventory` - Current stock levels
- `POST /api/inventory/inbound` - Add stock
- `POST /api/inventory/adjust` - Adjust inventory
- `GET /api/inventory/history` - Transaction history

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/refund` - Process refund

## 🤝 Community & Support

- [GitHub Issues](https://github.com/your-username/inventauri-v2/issues) - Report bugs and request features
- [Discord](https://discord.gg/your-invite) - Join our community
- [Twitter](https://twitter.com/your-handle) - Follow for updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Astro](https://astro.build/) for the amazing web framework
- [Supabase](https://supabase.com/) for authentication and database
- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Prisma](https://www.prisma.io/) for type-safe database access

---

Made with ❤️ by [Your Name] | [Website](https://your-website.com) | [Twitter](https://twitter.com/your-handle)