# Admin Guide

This guide provides detailed instructions for administrators managing the Inventauri inventory system.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [User Management](#user-management)
3. [Security](#security)
4. [Backup and Recovery](#backup-and-recovery)
5. [Performance Tuning](#performance-tuning)
6. [Troubleshooting](#troubleshooting)
7. [API Documentation](#api-documentation)

## System Architecture

### Components
- **Frontend**: Astro-based web application
- **Backend**: Node.js API server
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **Hosting**: Docker containers

### Data Flow
1. Users interact with the web interface
2. Requests are authenticated and authorized
3. Business logic is processed by the API
4. Data is persisted in the database
5. Responses are returned to the user

## User Management

### Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Owner** | Full system access, user management, shop settings |
| **Manager** | Inventory management, reporting, basic settings |
| **Staff** | Process sales, view inventory levels |
| **API Client** | Programmatic access with limited permissions |

### Managing Users

#### Adding Users
1. Navigate to Settings → Users
2. Click "Invite User"
3. Enter the user's email and select role
4. Set permissions if customizing beyond role defaults
5. Click "Send Invitation"

#### Modifying User Access
1. Go to Settings → Users
2. Find the user and click "Edit"
3. Update role or permissions
4. Click "Save Changes"

#### Deactivating Users
1. Go to Settings → Users
2. Find the user and click "Deactivate"
3. Confirm the action

## Security

### Authentication
- Email/password authentication
- Session management
- Password policies
- Account lockout after failed attempts

### Data Protection
- All data encrypted at rest
- HTTPS required for all connections
- Regular security updates
- Audit logging of sensitive actions

### Security Best Practices
1. Use strong, unique passwords
2. Enable 2FA for admin accounts
3. Regularly review user access
4. Keep the system updated
5. Monitor audit logs

## Backup and Recovery

### Automated Backups
- Database backups run daily
- Stored securely for 30 days
- Transaction logs for point-in-time recovery

### Manual Backup
```bash
# Create database dump
docker exec -t inventauri-db pg_dumpall -c -U postgres > dump_`date +%d-%m-%Y_%H_%M_%S`.sql

# Backup configuration files
cp -r config/ config_backup_`date +%d-%m-%Y`/
```

### Restoring from Backup
1. Stop the application
2. Restore the database:
   ```bash
   cat your_backup_file.sql | docker exec -i inventauri-db psql -U postgres
   ```
3. Restore configuration files if needed
4. Restart the application

## Performance Tuning

### Database Optimization
- Regular VACUUM and ANALYZE
- Proper indexing strategy
- Query optimization

### Caching
- Enable Redis for session storage
- Implement response caching for frequent queries
- Cache invalidation strategy

### Monitoring
- System resource usage
- Query performance
- Error rates and response times

## Troubleshooting

### Common Issues

#### Can't Connect to Database
1. Check if the database container is running
2. Verify database credentials in `.env`
3. Check database logs: `docker logs inventauri-db`

#### Performance Issues
1. Check system resources
2. Review slow queries in database logs
3. Check for long-running transactions

#### Data Inconsistencies
1. Check transaction logs
2. Review recent changes in audit logs
3. Restore from backup if needed

### Getting Help
1. Check the logs: `docker-compose logs -f`
2. Review the documentation
3. Contact support with:
   - Error messages
   - Steps to reproduce
   - Screenshots if applicable

## API Documentation

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

### Key Endpoints

#### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Inventory
- `GET /api/inventory` - Current inventory levels
- `POST /api/inventory/inbound` - Add stock
- `POST /api/inventory/adjust` - Adjust inventory
- `GET /api/inventory/history` - Transaction history

#### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/refund` - Process refund

### Rate Limiting
- 1000 requests per hour per IP address
- 100 requests per minute per user
- Headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

### Error Responses
```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## Support
For additional assistance, please contact:
- Email: support@inventauri.example.com
- Phone: +1 (555) 123-4567
- Support Portal: https://support.inventauri.example.com

## Changelog

### v2.0.0 (Current)
- Multi-tenant architecture
- Role-based access control
- Enhanced reporting
- Improved performance

### v1.0.0
- Initial release
- Basic inventory management
- Simple reporting
- Single-tenant architecture
