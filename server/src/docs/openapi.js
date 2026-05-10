export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'CouponSphere API',
    version: '1.0.0',
    description: 'Dynamic coupon distribution, fraud prevention, and analytics APIs.'
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/auth/login': { post: { summary: 'Login and receive JWT tokens' } },
    '/coupons': {
      get: { summary: 'List coupons' },
      post: { summary: 'Create coupon' }
    },
    '/coupons/{id}/claim': { post: { summary: 'Claim coupon with fraud scoring' } },
    '/coupons/{id}/redeem': { post: { summary: 'Redeem a claimed coupon' } },
    '/analytics/overview': { get: { summary: 'Organization analytics summary' } },
    '/fraud/logs': { get: { summary: 'Fraud event logs' } }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  }
};

