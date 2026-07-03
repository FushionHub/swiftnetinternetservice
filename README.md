# SwiftNet WiFi Hotspot Billing System (v3)

A professional, single-tenant WiFi captive portal and billing platform with full SaaS website capabilities. One brand, one owner, one MikroTik router, unlimited subscribers.

## 🚀 Features

### Core WiFi Hotspot Billing
- **Captive Portal**: Modern 3D glassmorphism UI with animated backgrounds for WiFi login
- **Payment Integration**: Support for Paystack and Squad payment gateways
- **MikroTik Integration**: Automatic hotspot user creation and management via RouterOS API
- **Subscription Management**: Automatic expiry handling and session tracking
- **Security**: Encrypted credentials storage, JWT-based admin authentication, webhook signature verification

### SaaS Website Features
- **Home Page**: Professional landing page with hero section, features, and CTAs
- **About Us Page**: Company information, mission, values, and team
- **Pricing Page**: Dynamic pricing plans fetched from admin configuration
- **Blog System**: Full CMS for creating and managing blog posts
- **Contact Page**: Contact form with message management in admin dashboard
- **Admin CMS**: Manage blog posts, page content, and contact messages
- **Responsive Design**: Mobile-first design with glassmorphism UI

## 🛠 Tech Stack

- **Frontend/Backend**: Next.js 16 (App Router, full-stack), React 19
- **Styling**: Tailwind CSS 4
- **Database**: MySQL with Prisma ORM
- **Payments**: Paystack & Squad APIs
- **Router Integration**: MikroTik RouterOS API (TCP port 8728 or SSL port 8729)
- **Authentication**: JWT for admin sessions
- **Encryption**: AES for sensitive credential storage

---

## 📋 Prerequisites

- **Bun** (or Node.js v24+)
- **MySQL** database (e.g., MySQL Server, MariaDB, or cloud-hosted)
- **MikroTik Router** running RouterOS with Hotspot configured
- Paystack and/or Squad payment gateway accounts

---

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install dependencies
bun install
# or
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# Security
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
SETTINGS_ENCRYPTION_KEY="32-character-long-encryption-key-for-credentials"

# Admin (default password: admin123)
ADMIN_PASSWORD_HASH="$2a$10$i29p4CgJ1wQO2iM3h8rY/.t6mFw0E2G90Xb6/QoYx3l1yK602U3mO"

# Application
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
bun prisma generate

# Push schema to database (creates tables)
bun prisma db push

# Optionally seed initial data
bun prisma db seed
```

### 4. Run Development Server

```bash
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🌐 Application Structure

### Pages

- **`/`** - Home landing page with hero, features, and CTAs
- **`/about`** - About us page with company info and team
- **`/pricing`** - Pricing page with dynamic plans
- **`/blog`** - Blog listing page
- **`/blog/[slug]`** - Individual blog post page
- **`/contact`** - Contact page with form
- **`/portal`** - Captive portal for WiFi users (Next.js version)
- **`/admin`** - Admin login page
- **`/admin/dashboard`** - Admin management dashboard

### API Routes

#### Public Endpoints
- `POST /api/subscriber/signup` - Create new subscriber account
- `POST /api/subscriber/login` - Login returning subscriber
- `GET /api/subscriber/status?identifier=...` - Check subscription status
- `GET /api/admin/plans` - Get available plans (public)
- `POST /api/pay/initiate` - Initialize payment
- `POST /api/pay/verify` - Verify payment status
- `POST /api/webhook/paystack` - Paystack webhook handler
- `POST /api/webhook/squad` - Squad webhook handler
- `GET /api/cms/blog?published=true` - Get published blog posts
- `GET /api/cms/blog/[slug]` - Get single blog post
- `GET /api/cms/pages/[pageKey]` - Get page content
- `POST /api/contact` - Submit contact form

#### Admin Endpoints (JWT Protected)
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/plans` - List all plans
- `POST /api/admin/plans` - Create new plan
- `PATCH /api/admin/plans` - Update plan
- `DELETE /api/admin/plans?id=...` - Delete plan
- `GET /api/admin/subscribers` - List all subscribers
- `PATCH /api/admin/subscribers` - Manage subscriber (disconnect/extend)
- `GET /api/admin/router-settings` - Get router configuration
- `PATCH /api/admin/router-settings` - Update router settings
- `GET /api/admin/payment-settings` - Get payment configuration
- `PATCH /api/admin/payment-settings` - Update payment settings
- `GET /api/cms/blog` - List all blog posts (admin)
- `POST /api/cms/blog` - Create blog post
- `PATCH /api/cms/blog/[slug]` - Update blog post
- `DELETE /api/cms/blog/[slug]` - Delete blog post
- `GET /api/cms/pages` - List all page content
- `POST /api/cms/pages` - Create/update page content
- `GET /api/admin/contact` - List contact messages
- `PATCH /api/admin/contact` - Update contact message status
- `DELETE /api/admin/contact?id=...` - Delete contact message

### Services

- **`services/paymentService.js`** - Unified payment gateway adapter
- **`services/mikrotikService.js`** - MikroTik RouterOS API client
- **`services/subscriberService.js`** - Subscriber management logic
- **`services/encryption.js`** - Credential encryption utilities

---

## 📱 Captive Portal Deployment

### Option 1: Next.js Portal (Recommended)

The `/portal` route provides a React-based captive portal that works directly with your Next.js backend.

### Option 2: Standalone HTML for MikroTik Router

For direct deployment on MikroTik routers:

1. **Configure Backend URL**
   - Open `public/captive_portal.html`
   - Set the `BACKEND_URL` variable to your hosted domain:
   ```javascript
   const BACKEND_URL = "https://your-domain.com";
   ```

2. **Deploy to MikroTik**
   - Rename `public/captive_portal.html` to `login.html`
   - Connect to your MikroTik router via WinBox
   - Drag and drop `login.html` into the `flash/hotspot` directory
   - Alternatively, upload via FTP to the hotspot folder

3. **Configure Hotspot Profile**
   - Go to `IP` → `Hotspot` → `Server Profiles`
   - Double-click your active profile
   - Set `HTML Directory` to `hotspot` (or your upload location)
   - Enable `HTTP CHAP` or `HTTP PAP` authentication
   - Set `Login` option to `HTTP CHAP` or `HTTP PAP`

4. **Test the Portal**
   - Connect a device to your hotspot
   - Open a browser - you should see the captive portal
   - Test signup, login, and payment flows

---

## 🔐 MikroTik Router Configuration

### 1. Enable API Access

```mikrotik
# Enable API service
/ip service set api port=8728
/ip service set api-ssl port=8729 certificate=default-cert
```

### 2. Create Hotspot Profiles

Create profiles for each plan duration:

```mikrotik
# Example: 1-hour profile
/ip hotspot user profile add name=1h-profile rate-limit=5M/5M session-timeout=1h

# Example: 1-day profile
/ip hotspot user profile add name=1d-profile rate-limit=5M/5M session-timeout=1d

# Example: 1-week profile
/ip hotspot user profile add name=1w-profile rate-limit=5M/5M session-timeout=1w
```

### 3. Configure Hotspot Server

- Set up your hotspot server with WPA2 or open authentication
- Configure the IP pool for hotspot users
- Set up DNS servers

---

## 💳 Payment Gateway Setup

### Paystack

1. Create an account at [paystack.co](https://paystack.co)
2. Get your Public Key and Secret Key from the dashboard
3. In Admin Dashboard → Settings → Payment Settings:
   - Enable Paystack
   - Enter Public Key (visible to clients)
   - Enter Secret Key (encrypted server-side)
4. Set up webhook URL: `https://your-domain.com/api/webhook/paystack`

### Squad

1. Create an account at [squadco.com](https://squadco.com)
2. Get your Public Key and Secret Key
3. In Admin Dashboard → Settings → Payment Settings:
   - Enable Squad
   - Enter Public Key
   - Enter Secret Key
4. Set up webhook URL: `https://your-domain.com/api/webhook/squad`

---

## 👤 Admin Dashboard

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the default password by setting `ADMIN_PASSWORD_HASH` in `.env` with a bcrypt hash of your chosen password.

Generate a new hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

### Dashboard Features

- **Overview**: Active subscribers, revenue metrics, router status
- **Plans**: Create, edit, delete internet plans with MikroTik profile mapping
- **Subscribers**: View all subscribers, disconnect users, extend subscriptions
- **Settings**: Configure MikroTik connection and payment gateways
- **Blog**: Create, edit, delete blog posts with rich content
- **Pages**: Manage page content for home, about, contact, and pricing pages
- **Contact**: View and manage contact form submissions

---

## 🔄 Subscription Flow

1. **User connects** to WiFi hotspot
2. **Captive portal** loads (captures MAC address)
3. **User signs up** with name and phone/email (creates subscriber account)
4. **User selects plan** and payment method
5. **Payment initiated** via Paystack or Squad
6. **Payment verified** (via webhook or client polling)
7. **Hotspot user created** on MikroTik router automatically
8. **User authenticated** and granted internet access
9. **Session expires** after plan duration (user removed from router)

---

## 🛡️ Security Features

- **JWT Authentication**: Admin sessions protected with JWT tokens
- **Encrypted Credentials**: MikroTik and payment API keys encrypted at rest
- **Webhook Verification**: Payment webhooks verified with HMAC signatures
- **Input Validation**: All endpoints validate input data
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Rate Limiting**: Recommended for production (add middleware)

---

## 🧪 Testing

### Test Payment Gateways

Both Paystack and Squad provide test/sandbox modes:

- **Paystack**: Use test keys and test card numbers from their documentation
- **Squad**: Use sandbox keys for testing

### Test MikroTik Connection

In Admin Dashboard → Settings → Router Settings, click "Test Connection" to verify router connectivity.

---

## 🚀 Production Deployment

### cPanel Shared Hosting (cocobase.cc)

For deployment on cPanel shared hosting with MySQL database, see [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md) for detailed instructions.

**Quick Start:**
1. Create MySQL database on cocobase.cc via cPanel
2. Configure `DATABASE_URL`: `mysql://user:pass@localhost/db`
3. Build static export: `bun run build`
4. Upload `out/` directory to `public_html/`
5. Configure `.htaccess` for routing

### Standard VPS/Cloud Deployment

#### Environment Variables

Ensure all production environment variables are set:

```env
DATABASE_URL="mysql://user:pass@host:port/db"
JWT_SECRET="production-secret-key-min-32-chars"
SETTINGS_ENCRYPTION_KEY="32-char-encryption-key"
ADMIN_PASSWORD_HASH="bcrypt-hash-of-admin-password"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

#### Database

- Use a managed MySQL service (PlanetScale, AWS RDS, DigitalOcean)
- Enable SSL connections for production
- Set up automated backups

### Webhooks

- Configure webhook URLs in Paystack and Squad dashboards
- Ensure your server is accessible from the internet
- Use HTTPS for webhook endpoints

### MikroTik Router

- Use API-SSL (port 8729) for encrypted communication
- Restrict API access to specific IP addresses
- Use strong router credentials

---

## 📊 Database Schema

### Models

- **Admin**: Single admin account (owner)
- **Plan**: Internet plans with pricing and MikroTik profile mapping
- **Subscriber**: User accounts with subscription status
- **Transaction**: Payment transaction records
- **Settings**: System configuration (router, payment gateways)
- **BlogPost**: Blog posts with title, slug, content, and publish status
- **PageContent**: CMS content for website pages
- **ContactMessage**: Contact form submissions

---

## 🐛 Troubleshooting

### Router Connection Failed

- Verify MikroTik IP and port (8728 for API, 8729 for API-SSL)
- Check firewall allows traffic on API port
- Verify router credentials
- Test with `telnet router-ip 8728`

### Payment Webhook Not Working

- Verify webhook URL is accessible from internet
- Check webhook signature verification
- Review payment gateway dashboard for webhook logs
- Ensure HTTPS is used in production

### Captive Portal Not Loading

- Verify HTML file is in correct hotspot directory
- Check Hotspot Server Profile HTML Directory setting
- Ensure MikroTik variables are being replaced
- Test with JavaScript disabled (fallback form)

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🤝 Support

For issues and questions, refer to the documentation or contact the development team.
