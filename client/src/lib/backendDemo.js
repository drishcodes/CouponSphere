import { api } from './api.js';

const adminCredentials = {
  email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@urbanbite.dev',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'Password123!',
  deviceId: 'admin-browser'
};

const customerCredentials = {
  email: import.meta.env.VITE_CUSTOMER_EMAIL || 'maya@example.com',
  password: import.meta.env.VITE_CUSTOMER_PASSWORD || 'Password123!',
  deviceId: 'risky-demo-device'
};

async function login(credentials, saveToStorage = true) {
  const { data } = await api.post('/auth/login', credentials);
  if (saveToStorage) {
    localStorage.setItem('couponSphereToken', data.accessToken);
    localStorage.setItem('couponSphereDevice', credentials.deviceId);
  }
  return data;
}

export async function fetchBackendCoupons() {
  const session = await login(adminCredentials, false);
  const { data } = await api.get('/coupons', {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  });
  return data;
}

export async function claimBackendCoupon(couponId) {
  // Use the currently logged-in user's session from localStorage
  const { data } = await api.post(`/coupons/${couponId}/claim`, {
    cartValue: 500,
    region: 'IN-WB',
    deviceId: 'premium-user-browser-001'
  }, {
    headers: {
      'x-device-id': 'premium-user-browser-001',
      'x-demo-ip': '203.0.113.42'
    }
  });
  return data;
}

export async function checkBackend() {
  const { data } = await api.get('/health');
  return data;
}

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', {
    email,
    password,
    deviceId: 'browser-login'
  });
  localStorage.setItem('couponSphereToken', data.accessToken);
  localStorage.setItem('couponSphereDevice', 'browser-login');
  return data;
}

export async function registerUser(name, email, password, role = 'customer') {
  const { data } = await api.post('/auth/register', {
    name,
    email,
    password,
    role
  });
  localStorage.setItem('couponSphereToken', data.accessToken);
  localStorage.setItem('couponSphereDevice', 'browser-register');
  return data;
}

export async function logoutUser() {
  try {
    await api.post('/auth/logout');
  } catch (e) {}
  localStorage.removeItem('couponSphereToken');
  localStorage.removeItem('couponSphereDevice');
}

export async function generateBackendCoupon(formData = {}) {
  const session = await login(adminCredentials, false);
  const code = formData.code || `VIP${Math.floor(1000 + Math.random() * 8999)}`;
  const { data } = await api.post('/coupons', {
    vendor: formData.vendor || 'UrbanBite',
    title: formData.title || 'AI Generated VIP Coupon',
    code,
    description: formData.description || 'Created from the React generator and stored in MongoDB.',
    type: formData.type || 'percentage',
    value: formData.value || 32,
    status: 'active',
    startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : new Date(Date.now() - 60 * 1000).toISOString(),
    expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: {
      minimumOrderValue: formData.minimumOrderValue || 99,
      usageLimit: formData.usageLimit || 500,
      perUserLimit: 1,
      regions: ['IN-WB', 'IN-KA'],
      categories: ['food', 'premium'],
      prerequisites: {
        minLoyaltyPoints: Number(formData.minLoyaltyPoints) || 0,
        minPastRedemptions: Number(formData.minPastRedemptions) || 0,
        accountAgeDays: Number(formData.accountAgeDays) || 0
      }
    },
    ai: {
      segment: 'high_intent',
      predictedConversion: 74,
      recommendedDiscount: formData.value || 32,
      personalizationTags: ['vip', 'cart_abandonment']
    }
  }, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  });
  return { coupon: data, user: session.user };
}

export async function runBackendFraudCheck() {
  const session = await login(customerCredentials, false);
  const coupons = await api.get('/coupons?status=active', {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  });
  const target = coupons.data.find((coupon) => coupon.code.includes('REFER')) || coupons.data[0];
  if (!target) throw new Error('No active coupons found. Run seed data first.');

  try {
    const { data } = await api.post(`/coupons/${target._id}/claim`, {
      cartValue: 500,
      region: 'IN-WB',
      deviceId: 'premium-user-browser-001'
    }, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'x-device-id': 'premium-user-browser-001',
        'x-demo-ip': '203.0.113.42'
      }
    });
    return { blocked: false, coupon: target, result: data };
  } catch (error) {
    if (error.response?.status === 403) {
      return { blocked: true, coupon: target, result: error.response.data };
    }
    throw error;
  }
}

export async function fetchAnalytics() {
  const { data } = await api.get('/analytics/overview');
  return data;
}

export async function fetchMarketplaceListings() {
  const { data } = await api.get('/marketplace/listings');
  return data;
}

export async function listCouponForSale(redemptionId, price) {
  const { data } = await api.post('/marketplace/list', { redemptionId, price });
  return data;
}

export async function buyMarketplaceCoupon(redemptionId) {
  const { data } = await api.post(`/marketplace/buy/${redemptionId}`);
  return data;
}

export async function fetchEarnings() {
  const { data } = await api.get('/marketplace/earnings');
  return data;
}

export async function fetchMyCoupons() {
  const { data } = await api.get('/coupons/my');
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

export async function deleteBackendCoupon(couponId) {
  const { data } = await api.delete(`/coupons/remove/${couponId}`);
  return data;
}

export async function fetchCustomerEarnings() {
  const { data } = await api.get('/analytics/customers-earnings');
  return data;
}

export async function exportAdminReport() {
  const { data } = await api.get('/admin/export');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `CouponSphere_Inventory_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function redeemBackendCoupon(couponId) {
  const { data } = await api.post(`/coupons/${couponId}/redeem`, {
    cartValue: 500,
    orderId: `ORD-${Math.floor(Math.random() * 100000)}`
  });
  return data;
}
