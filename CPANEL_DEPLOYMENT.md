# cPanel Shared Hosting Deployment Guide

This guide covers deploying SwiftNet to cPanel shared hosting with MySQL database on cocobase.cc.

## Prerequisites

- cPanel shared hosting account
- MySQL database on cocobase.cc
- SSH access to cPanel (recommended)
- Bun or Node.js installed on the server

## Database Configuration

### 1. Create MySQL Database on cocobase.cc

1. Log in to cPanel
2. Go to **MySQL Database Wizard**
3. Create a new database (e.g., `swiftnet_db`)
4. Create a new database user with strong password
5. Grant all privileges to the user for the database
6. Note down:
   - Database name: `username_swiftnet_db`
   - Database user: `username_swiftnet_user`
   - Database password
   - Database host: `localhost` or `cocobase.cc`

### 2. Configure DATABASE_URL

Set your environment variable with the MySQL connection string:

```env
DATABASE_URL="mysql://username_swiftnet_user:password@localhost/username_swiftnet_db"
```

If your database is on a remote host (cocobase.cc):

```env
DATABASE_URL="mysql://username_swiftnet_user:password@cocobase.cc/username_swiftnet_db"
```

## Deployment Options

### Option 1: Static Export (Recommended for cPanel)

Since cPanel shared hosting doesn't natively support Next.js server-side features, we'll use static export:

#### 1. Update next.config.js

Add static export configuration:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

#### 2. Build the Application

```bash
bun install
bun run build
```

This creates a `out/` directory with static HTML/CSS/JS files.

#### 3. Upload to cPanel

1. Compress the `out/` directory: `zip -r swiftnet.zip out/`
2. Upload to cPanel File Manager
3. Extract to `public_html/` or a subdirectory

#### 4. Configure .htaccess

Create `.htaccess` in the public directory:

```apache
RewriteEngine On
RewriteBase /

# Handle Next.js static files
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### Option 2: Node.js Application (If Available)

If your cPanel supports Node.js applications:

#### 1. Enable Node.js in cPanel

1. Go to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - Node.js version: 20 or higher
   - Application mode: Production
   - Application root: `swiftnet`
   - Application URL: Select domain
   - Application startup file: `package.json`

#### 2. Upload Files

1. Upload all project files to the application root
2. Set correct permissions (755 for directories, 644 for files)

#### 3. Install Dependencies

```bash
cd ~/swiftnet
bun install
```

#### 4. Set Environment Variables

In cPanel Node.js setup, add environment variables:

```
DATABASE_URL="mysql://user:pass@localhost/db"
JWT_SECRET="your-jwt-secret"
SETTINGS_ENCRYPTION_KEY="your-encryption-key"
ADMIN_PASSWORD_HASH="bcrypt-hash"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://yourdomain.com"
```

#### 5. Build and Start

```bash
bun run build
```

cPanel will automatically start the application.

## API Routes with Static Export

Since static export doesn't support API routes, you have two options:

### Option A: Use External API Server

1. Deploy the API separately (VPS, Render, Railway)
2. Update `NEXT_PUBLIC_API_URL` to point to external API
3. Static site handles frontend, external API handles backend

### Option B: Use PHP as API Proxy

Create PHP proxy scripts for API endpoints:

```php
<?php
// api/proxy.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Handle your API logic here using PDO for MySQL
// This is a simplified example
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';

// Route to appropriate handler based on path
// Implement your business logic in PHP
?>
```

## Email Configuration

For cPanel shared hosting, use the server's SMTP:

```env
emailEnabled=true
emailHost=localhost
emailPort=587
emailUser=your-email@yourdomain.com
emailPassword=your-email-password
emailFrom=noreply@yourdomain.com
emailFromName=SwiftNet
```

Or use external SMTP (Gmail, SendGrid, etc.):

```env
emailEnabled=true
emailHost=smtp.gmail.com
emailPort=587
emailUser=your-email@gmail.com
emailPassword=your-app-password
emailFrom=noreply@yourdomain.com
emailFromName=SwiftNet
```

## MikroTik Router Configuration

Since the application is now on shared hosting, ensure:

1. Your cPanel server can reach the MikroTik router (API port 8728/8729)
2. Firewall allows outbound connections from cPanel
3. Use the router's public IP if on different networks

## Webhook Configuration

For payment webhooks to work:

1. Ensure your domain has SSL (Let's Encrypt on cPanel)
2. Webhook URLs: `https://yourdomain.com/api/webhook/paystack`
3. If using static export, webhooks won't work - use external API server

## Troubleshooting

### Database Connection Issues

- Verify database credentials in cPanel
- Check if database user has proper permissions
- Test connection from cPanel terminal: `mysql -h localhost -u user -p db`

### 404 Errors on Static Export

- Ensure `.htaccess` is properly configured
- Check that `index.html` exists in the root
- Verify mod_rewrite is enabled on cPanel

### API Routes Not Working

- Static export doesn't support API routes
- Use external API server or PHP proxy
- Update `NEXT_PUBLIC_API_URL` accordingly

### Email Not Sending

- Check cPanel email logs
- Verify SMTP credentials
- Ensure port 587 is not blocked by firewall
- Try using cPanel's local SMTP (localhost)

## Security Recommendations

1. **SSL Certificate**: Enable free Let's Encrypt SSL in cPanel
2. **Environment Variables**: Never commit `.env文件`
3. **Database**: Use strong passwords and restrict access
4. **File Permissions**: Set correct permissions (755/644)
5. **Backups**: Enable cPanel automated backups

## Performance Optimization

1. Enable cPanel caching (LiteSpeed or Apache mod_cache)
2. Use Cloudflare CDN for static assets
3. Optimize images before upload
4. Enable Gzip compression in `.htaccess`

## Maintenance

1. Regular database backups via cPanel
2. Monitor disk usage in cPanel
3. Update dependencies regularly
4. Check error logs in cPanel
