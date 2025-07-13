// Environment configuration
export const env = {
  // Database Configuration
  database: {
    host: 'localhost',
    port: 5432,
    name: 'anoq_db',
    user: 'anoq_user',
    password: 'anoq_password',
    ssl: false,
    url: 'postgresql://anoq_user:anoq_password@localhost:5432/anoq_db?sslmode=disable'
  },

  // Go Backend Configuration
  backend: {
    url: 'http://localhost:8080',
    apiPrefix: '/api',
    timeout: 30000
  },

  // Kinde Authentication
  kinde: {
    domain: process.env.KINDE_DOMAIN || 'https://anoq.kinde.com',
    clientId: process.env.KINDE_CLIENT_ID || '',
    clientSecret: process.env.KINDE_CLIENT_SECRET || '',
    redirectUri: process.env.KINDE_REDIRECT_URI || 'http://localhost:3000/api/auth/kinde_callback',
    logoutRedirectUri: process.env.KINDE_LOGOUT_REDIRECT_URI || 'http://localhost:3000',
    issuerUrl: process.env.KINDE_ISSUER_URL || 'https://anoq.kinde.com',
    webhookSecret: process.env.KINDE_WEBHOOK_SECRET || 'your_webhook_secret_here'
  },

  // Application Configuration
  app: {
    name: 'AnoQ - Anonymous Form Builder',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10)
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here_change_in_production',
    expiresIn: '24h',
    issuer: 'anoq',
    audience: 'anoq-users'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    formSubmissions: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5 // limit form submissions to 5 per minute per IP
    }
  }
};

export type Environment = typeof env; 