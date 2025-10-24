# ♉ Inventauri v2 – Modern Inventory Management

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat\&logo=docker\&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-FF5D01?style=flat\&logo=astro\&logoColor=white)](https://astro.build/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=flat\&logo=supabase\&logoColor=white)](https://supabase.com/)

- [🚀 Quick Start](#-quick-start)  
  - [Prerequisites](#prerequisites)  
  - [Local Development](#local-development)  
- [🛠 Tech Stack](#-tech-stack)  
- [🛠 Development](#-development)  
  - [Available Scripts](#available-scripts)  
  - [Database Management](#database-management)  
- [🚀 Deployment](#-deployment)  
  - [Production](#production)  
  - [Development](#development)  
- [📊 API Endpoints](#-api-endpoints)  

---

## 🚀 Features

* **Multi-tenant Architecture** - Support for multiple shops with isolated data
* **Modern Tech Stack** - Built with Astro, Supabase, and Prisma
* **Role-Based Access Control** - Owner, Manager, and Staff roles with granular permissions
* **Real-time Inventory** - Track stock levels across multiple locations
* **Point of Sale** - Process sales with an intuitive interface
* **Comprehensive Reporting** - Sales, inventory, and performance insights
* **API-First Design** - Full-featured REST API for integration

---

## 🛠 Tech Stack

* **Frontend**: Astro + React + TypeScript
* **UI Components**: Shadcn UI + Tailwind CSS
* **Backend**: Node.js with Astro API Routes
* **Database**: PostgreSQL with Prisma ORM
* **Authentication**: Supabase Auth
* **Containerization**: Docker + Docker Compose
* **Testing**: Vitest + Supertest

---

## 🚀 Quick Start

### Prerequisites

* Docker and Docker Compose
* Node.js 18+
* Git

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
   docker compose up -d
   npm install
   npx prisma migrate dev
   npm run dev
   ```

4. **Access the application**

   * Web Interface: [http://localhost:4321](http://localhost:4321)
   * API Documentation: [http://localhost:4321/api-docs](http://localhost:4321/api-docs)
   * Database Admin: [http://localhost:8080](http://localhost:8080) (pgAdmin)

---

## 📚 Documentation

* [Quickstart Guide](./specs/004-add-admin-settings/quickstart.md)
* [Admin Guide](./specs/001-inventauri-v2-is/admin-guide.md)
* [API Reference](./docs/API.md)
* [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 🏗 Project Structure

```bash
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
│   ├── lib/              # Application logic
│   ├── pages/            # Application routes
│   ├── styles/           # Global styles
│   └── types/            # TypeScript type definitions
│
├── tests/                # Test suites
├── .env.example          # Example environment variables
├── docker-compose.yml    # Docker Compose configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

---

## 🗃 Data Model

### Core Entities

* Shop, User, Product, ProductVariant, Warehouse, Inventory, Transaction, Order

### Multi-tenancy

* `shop_id` column for tenant-scoped tables
* Row-level security for data isolation
* Users linked to a single shop

---

## 🔐 Authentication & Authorization

* **Authentication**: Email/password with Supabase Auth
* **Roles**:

  * Owner: Full access
  * Manager: Inventory and sales
  * Staff: Basic POS

### Environment Variables

* `PUBLIC_SUPABASE_URL`
* `PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY` (erforderlich für Team-Einladungen/Deaktivierungen)
* `DATABASE_URL`
* `NODE_ENV`

---

## 🛠 Development

### Available Scripts

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run test:watch   # Watch mode tests
npm run test:contracts
npm run lint         # Run linter
npm run type-check   # Type checker
```

### Database Management

```bash
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma client
npm run db:reset     # Reset database
npm run db:seed      # Seed database
```

---

## 🚀 Deployment

### Production

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Development

```bash
docker compose up -d
npm run db:migrate
npm run dev
```

---

## 🌟 Features in Development

* [x] Multi-tenant architecture
* [x] Role-based access control
* [x] Product variant management
* [x] Real-time inventory tracking
* [ ] Offline mode with sync
* [ ] Advanced reporting
* [ ] Barcode scanning
* [ ] Supplier management

---

## 📊 API Endpoints

### Authentication

* `POST /api/auth/register`
* `POST /api/auth/login`
* `POST /api/auth/refresh`
* `POST /api/auth/logout`

### Products

* `GET /api/products`
* `POST /api/products`
* `GET /api/products/:id`
* `PUT /api/products/:id`
* `DELETE /api/products/:id`

### Inventory

* `GET /api/inventory`
* `POST /api/inventory/inbound`
* `POST /api/inventory/adjust`
* `GET /api/inventory/history`

### Sales

* `POST /api/sales`
* `GET /api/sales/:id`
* `POST /api/sales/:id/refund`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 🙏 Acknowledgments

* [Astro](https://astro.build/)
* [Supabase](https://supabase.com/)
* [Shadcn UI](https://ui.shadcn.com/)
* [Prisma](https://www.prisma.io/)

---

## 🤝 Community & Support

* [GitHub Issues](https://github.com/your-username/inventauri-v2/issues)
* [Discord](https://discord.gg/your-invite)
* [Twitter](https://twitter.com/your-handle)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [Your Name] | [Website](https://your-website.com) | [Twitter](https://twitter.com/your-handle)
