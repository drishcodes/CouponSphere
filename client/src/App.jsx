import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  BadgeDollarSign,
  Bell,
  Bot,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Fingerprint,
  Gift,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Wallet
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { couponCards, chartData, fraudAlerts, regions, stats } from './lib/mockData.js';
import { setActiveView, toggleTheme } from './store/store.js';
import { useRealtime } from './hooks/useRealtime.js';
import { checkBackend, generateBackendCoupon, runBackendFraudCheck, fetchBackendCoupons, claimBackendCoupon, loginUser, registerUser, logoutUser, fetchAnalytics, fetchMarketplaceListings, listCouponForSale, buyMarketplaceCoupon, fetchEarnings, fetchMyCoupons, deleteBackendCoupon, fetchUsers, fetchCustomerEarnings, exportAdminReport } from './lib/backendDemo.js';

const nav = [
  ['overview', LayoutDashboard, 'Overview'],
  ['campaigns', Gift, 'Campaigns'],
  ['fraud', ShieldAlert, 'Fraud Center'],
  ['analytics', ChartNoAxesCombined, 'Analytics'],
  ['generator', QrCode, 'Generator'],
  ['users', Users, 'Users'],
  ['wallet', Wallet, 'Wallet'],
  ['settings', Settings, 'Settings']
];

export default function App() {
  const dispatch = useDispatch();
  const { theme, activeView } = useSelector((state) => state.ui);
  const events = useRealtime();
  const [role, setRole] = useState(null);
  const [toast, setToast] = useState('Ready: explore coupons, fraud rules, analytics, and wallet flows.');
  const [modal, setModal] = useState(null);
  const [backendState, setBackendState] = useState({ status: 'unknown', message: 'Backend not checked yet.' });
  const [liveCoupons, setLiveCoupons] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [liveUsers, setLiveUsers] = useState([]);
  const [customerEarnings, setCustomerEarnings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, transactions: [] });
  const [myInventory, setMyInventory] = useState([]);

  const actions = useMemo(() => ({
    notify(message) {
      setToast(message);
      window.clearTimeout(window.__couponSphereToast);
      window.__couponSphereToast = window.setTimeout(() => setToast(''), 4500);
      console.log('Notification triggered:', message);
    },
    setSearch(query) {
      setSearchQuery(query);
    },
    openModal(nextModal) {
      setModal(nextModal);
    },
    closeModal() {
      setModal(null);
    },
    async checkBackend() {
      try {
        const health = await checkBackend();
        setBackendState({ status: 'online', message: `${health.service} is online at ${health.timestamp}` });
        this.notify('Backend connected: Express API responded successfully.');
      } catch {
        setBackendState({ status: 'offline', message: 'Backend is offline. Start MongoDB, fraud service, and Express API to use real data.' });
        this.notify('Backend is offline. The UI is currently using demo interactions.');
      }
    },
    async generateBackendCoupon(formData = {}) {
      try {
        const { coupon } = await generateBackendCoupon(formData);
        setBackendState({ status: 'online', message: `Created ${coupon.code} in MongoDB through the Express API.` });
        this.notify(`Real coupon generated: ${coupon.code}`);
        this.fetchCoupons();
      } catch (error) {
        setBackendState({ status: 'offline', message: error.response?.data?.message || error.message || 'Could not generate coupon through backend.' });
        this.notify('Could not reach backend. Start the backend stack first.');
      }
    },
    async runBackendFraudCheck() {
      try {
        const result = await runBackendFraudCheck();
        setBackendState({
          status: 'online',
          message: result.blocked
            ? `Fraud blocked by API: ${result.result.details?.join(', ') || result.result.message}`
            : `Fraud score from API: ${result.result.fraud.riskScore}/100`
        });
        this.notify(result.blocked ? 'Backend fraud engine blocked the claim.' : `Backend fraud score: ${result.result.fraud.riskScore}/100`);
      } catch (error) {
        setBackendState({ status: 'offline', message: error.response?.data?.message || error.message || 'Could not run fraud check through backend.' });
        this.notify('Could not run backend fraud check. Start backend services first.');
      }
    },
    async claimCoupon(coupon) {
      if (coupon._raw?._id) {
        try {
          const result = await claimBackendCoupon(coupon._raw._id);
          this.notify(`Success! Claimed via API. Fraud score: ${result.fraud?.riskScore || 'Low'}/100`);
          
          // Refresh everything to ensure UI state is current
          await this.fetchInventory();
          await this.fetchCoupons();
          await this.fetchMarketplace();
        } catch (error) {
          console.error('Claim error:', error);
          const msg = error.response?.data?.message || 'Blocked by fraud engine';
          this.notify(`API Blocked Claim: ${msg}`);
        }
      } else {
        this.notify(`${coupon.code} claimed. Fraud score: ${coupon.risk}/100. (Mock)`);
      }
    },
    async deleteCoupon(couponId) {
      if (!couponId) return this.notify('Error: Missing Coupon ID');
      console.log('Attempting to delete coupon with ID:', couponId);
      try {
        const idStr = String(couponId);
        await deleteBackendCoupon(idStr);
        this.notify('Coupon deleted successfully.');
        this.fetchCoupons();
      } catch (e) {
        console.error('Delete error:', e);
        const msg = e.response?.data?.message || 'Unauthorized or server error';
        this.notify(`Failed to delete coupon: ${msg}`);
      }
    },
    async fetchCustomerEarnings() {
      try {
        const data = await fetchCustomerEarnings();
        setCustomerEarnings(data);
      } catch (e) {}
    },
    async fetchCoupons() {
      try {
        const isAdmin = role === 'business_admin' || role === 'super_admin';
        const [dbCoupons, dbStats] = await Promise.all([
          fetchBackendCoupons().catch(() => []),
          isAdmin ? fetchAnalytics().catch(() => null) : Promise.resolve(null)
        ]);
        
        const mapped = dbCoupons.map(c => ({
          code: c.code,
          vendor: c.vendor || 'UrbanBite',
          title: c.title,
          description: c.description || 'Verified industry-grade offer.',
          type: c.type,
          value: c.type === 'percentage' ? `${c.value}% OFF` : `$${c.value} OFF`,
          expires: new Date(c.expiresAt).toLocaleDateString(),
          usage: Math.round((c.counters?.claimed || 0) / (c.conditions?.usageLimit || 100) * 100) || 0,
          risk: c.ai?.recommendedDiscount || 15,
          _raw: c
        }));
        
        setLiveCoupons(mapped);
        if (dbStats) setLiveStats(dbStats);
        
        this.fetchInventory();
        this.fetchMarketplace();
        if (isAdmin) {
          this.fetchUsers();
          this.fetchCustomerEarnings();
        }
      } catch (e) {
        console.warn('Sync error:', e);
      }
    },
    async fetchUsers() {
      try {
        const users = await fetchUsers();
        setLiveUsers(users);
      } catch (e) {}
    },
    async exportReport() {
      console.log('Exporting report...');
      try {
        await exportAdminReport();
        this.notify('Report exported successfully!');
      } catch (e) {
        console.error('Export error:', e);
        this.notify('Report export failed.');
      }
    },
    async exportCustomerEarnings() {
      try {
        const data = await fetchCustomerEarnings();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Customer_Earnings_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.notify('Customer earnings exported!');
      } catch (e) {
        this.notify('Export failed.');
      }
    },
    async fetchInventory() {
      try {
        const inventory = await fetchMyCoupons();
        console.log('Fetched Inventory:', inventory);
        setMyInventory(inventory);
      } catch (e) {
        console.warn('Inventory fetch error', e);
      }
    },
    async fetchMarketplace() {
      try {
        const [listings, data] = await Promise.all([
          fetchMarketplaceListings(),
          fetchEarnings()
        ]);
        setMarketplaceListings(listings);
        setEarnings(data);
      } catch (e) {
        console.warn('Marketplace fetch error', e);
      }
    },
    async listForSale(redemptionId, price) {
      try {
        await listCouponForSale(redemptionId, price);
        this.notify(`Coupon listed for $${price}!`);
        this.fetchMarketplace();
        this.fetchCoupons(); // Refresh inventory
      } catch (e) {
        this.notify('Failed to list coupon.');
      }
    },
    async buyCouponFromMarket(listingId) {
      try {
        await buyMarketplaceCoupon(listingId);
        this.notify('Coupon purchased and added to your inventory!');
        this.fetchMarketplace();
        this.fetchCoupons();
      } catch (e) {
        this.notify(e.response?.data?.message || 'Purchase failed.');
      }
    },
    go(view, message) {
      dispatch(setActiveView(view));
      if (message) this.notify(message);
      document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }), [dispatch, role]);

  useEffect(() => {
    if (role) actions.fetchCoupons();
  }, [role]); // Only refetch when role changes (login/logout)

  const sourceCoupons = liveCoupons.length ? liveCoupons : couponCards;
  const displayCoupons = sourceCoupons.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!role) {
    return (
      <div className={theme === 'dark' ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-950'}>
        <LoginScreen 
          onLogin={async (email, password) => { 
            actions.notify('Logging in...');
            try {
              const data = await loginUser(email, password);
              const userRole = data.user.role;
              setRole(userRole);
              actions.notify(`Welcome back, ${data.user.name}!`);
              actions.fetchCoupons();
            } catch (error) {
              actions.notify(`Login failed: ${error.response?.data?.message || 'Invalid credentials'}`);
            }
          }}
          onRegister={async (name, email, password) => {
            actions.notify('Creating account...');
            try {
              const data = await registerUser(name, email, password);
              setRole(data.user.role);
              actions.notify(`Welcome to CouponSphere, ${data.user.name}!`);
              actions.fetchCoupons();
            } catch (error) {
              actions.notify(`Registration failed: ${error.response?.data?.message || 'Error creating account'}`);
            }
          }}
        />
        <Toast message={toast} />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch(e) {}
    setRole(null);
    actions.notify('Logged out successfully.');
  };

  if (role === 'customer') {
    return (
      <div className={theme === 'dark' ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-950'}>
        <UserDashboard 
          coupons={displayCoupons} 
          actions={actions} 
          onLogout={handleLogout} 
          theme={theme} 
          dispatch={dispatch} 
          marketplaceListings={marketplaceListings}
          earnings={earnings}
          myInventory={myInventory}
        />
        <Toast message={toast} />
        <DemoModal modal={modal} actions={actions} />
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-950'}>
      <main className="min-h-screen">
        <Hero dispatch={dispatch} theme={theme} actions={actions} coupons={displayCoupons} />
        <section id="workspace" className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 pb-10 lg:grid-cols-[260px_1fr]">
          <Sidebar activeView={activeView} dispatch={dispatch} onLogout={handleLogout} />
          <section className="space-y-5">
            <DashboardHeader dispatch={dispatch} theme={theme} actions={actions} onLogout={handleLogout} />
            <BackendStatus state={backendState} actions={actions} />
            <StatsGrid liveStats={liveStats} />
            <AnimatePresence mode="wait">
              <motion.div key={activeView} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                {activeView === 'overview' && <Overview events={events} actions={actions} />}
                {activeView === 'campaigns' && <Campaigns actions={actions} coupons={displayCoupons} />}
                {activeView === 'fraud' && <FraudCenter actions={actions} />}
                {activeView === 'analytics' && <Analytics customerEarnings={customerEarnings} actions={actions} />}
                {activeView === 'generator' && <Generator actions={actions} />}
                {activeView === 'users' && <UsersPanel users={liveUsers} />}
                {activeView === 'wallet' && <WalletPanel />}
                {activeView === 'settings' && <SettingsPanel />}
              </motion.div>
            </AnimatePresence>
          </section>
        </section>
        <MarketingSections actions={actions} />
        <Toast message={toast} />
        <DemoModal modal={modal} actions={actions} />
      </main>
    </div>
  );
}

function Hero({ dispatch, theme, actions, coupons }) {
  return (
    <section className="relative overflow-hidden px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <BadgeDollarSign size={21} />
            </div>
            <div>
              <p className="text-lg font-semibold">CouponSphere</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dynamic offer intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => actions.openModal('api')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-800 dark:bg-slate-900">API Docs</button>
            <button onClick={() => dispatch(toggleTheme())} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>

        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_520px] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
              <Sparkles size={16} className="text-brand" /> AI coupon engine with fraud scoring
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-6xl">
              CouponSphere
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A production-ready coupon operating system for creating personalized offers, stopping abuse, and turning campaign data into measurable revenue.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => actions.go('overview', 'Workspace opened. Use the left navigation to manage campaigns, fraud, analytics, and wallets.')} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-glow dark:bg-white dark:text-slate-950">
                Launch workspace <ChevronRight size={17} />
              </button>
              <button onClick={() => actions.notify('Report exported: coupon-performance-demo.csv')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900">
                <Download size={17} /> Export reports
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass rounded-lg p-4 shadow-glow">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <span className="text-sm font-semibold">Live flash control</span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Realtime</span>
            </div>
            <div className="mt-4 space-y-3">
              {(coupons || []).slice(0, 3).map((coupon) => <CouponCard coupon={coupon} key={coupon.code} actions={actions} />)}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Sidebar({ activeView, dispatch, onLogout }) {
  return (
    <aside className="glass sticky top-4 h-fit rounded-lg p-3">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-950 p-3 text-white dark:bg-white dark:text-slate-950">
        <Building2 size={18} />
        <div>
          <p className="text-sm font-semibold">UrbanBite</p>
          <p className="text-xs opacity-70">Enterprise plan</p>
        </div>
      </div>
      <div className="grid gap-1">
        {nav.map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => dispatch(setActiveView(id))}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${activeView === id ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );
}

function DashboardHeader({ dispatch, theme, actions, onLogout }) {
  return (
    <div className="glass flex flex-col justify-between gap-3 rounded-lg p-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Business admin dashboard</p>
        <h2 className="text-2xl font-semibold">Campaign command center</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
          <Search size={16} />
          <input onChange={(event) => actions.setSearch(event.target.value)} className="w-40 bg-transparent text-sm outline-none" placeholder="Search coupons" />
        </div>
        <button onClick={() => actions.openModal('filters')} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Filter"><Filter size={17} /></button>
        <button onClick={() => actions.openModal('notifications')} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Notifications"><Bell size={17} /></button>
        <button onClick={() => actions.exportReport()} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Export Report"><Download size={17} /></button>
        <button onClick={() => dispatch(toggleTheme())} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Theme">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        {onLogout && <button onClick={onLogout} className="rounded-lg bg-red-50 text-red-600 px-3 py-2 text-sm font-semibold dark:bg-red-500/10 dark:text-red-400">Logout</button>}
      </div>
    </div>
  );
}

function StatsGrid({ liveStats }) {
  const displayStats = liveStats ? [
    { label: 'Active Coupons', value: liveStats.activeCoupons, delta: '+12%' },
    { label: 'Total Redemptions', value: liveStats.redemptions, delta: '+25%' },
    { label: 'Fraud Attempts', value: liveStats.fraudAttempts, delta: '-5%' },
    { label: 'Conversion Rate', value: `${liveStats.conversionRate}%`, delta: '+3%' },
  ] : stats;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {displayStats.map((stat, index) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="glass rounded-lg p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-3xl font-semibold">{stat.value}</span>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-600 dark:bg-slate-900">{stat.delta}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BackendStatus({ state, actions }) {
  const styles = state.status === 'online'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
    : state.status === 'offline'
      ? 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-200'
      : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300';
  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold">Backend connection: {state.status}</p>
          <p className="mt-1 text-sm">{state.message}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => actions.checkBackend()} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Check API</button>
          <button onClick={() => actions.generateBackendCoupon()} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Generate via API</button>
          <button onClick={() => actions.runBackendFraudCheck()} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Fraud via API</button>
        </div>
      </div>
    </div>
  );
}

function Overview({ events, actions }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Panel title="Coupon performance" action="Live">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="claims" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="claims" stroke="#2563eb" fill="url(#claims)" strokeWidth={2} />
              <Area type="monotone" dataKey="redemptions" stroke="#10b981" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Realtime activity" action={<Activity size={16} />}>
        <div className="space-y-3">
          {(events.length ? events : [
            { type: 'Coupon claimed', at: new Date().toISOString(), payload: { coupon: 'FLASH35' } },
            { type: 'Fraud alert', at: new Date().toISOString(), payload: { score: 91 } },
            { type: 'Campaign export', at: new Date().toISOString(), payload: { rows: 1800 } }
          ]).map((event, index) => (
            <div key={`${event.type}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold">{event.type}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(event.at).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </Panel>
      <div className="xl:col-span-2 grid gap-3 sm:grid-cols-4">
        <ActionButton label="Create campaign" icon={<Gift size={17} />} onClick={() => actions.go('campaigns', 'Campaign workspace opened.')} />
        <ActionButton label="Run fraud scan" icon={<ShieldAlert size={17} />} onClick={() => actions.go('fraud', 'Fraud scan completed: 3 suspicious accounts found.')} />
        <ActionButton label="Generate coupon" icon={<QrCode size={17} />} onClick={() => actions.go('generator', 'Generator opened with AI recommendations ready.')} />
        <ActionButton label="Export Report" icon={<Download size={17} />} onClick={() => actions.exportReport()} />
      </div>
    </div>
  );
}

function Campaigns({ actions, coupons }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {(coupons || []).map((coupon) => <CouponCard coupon={coupon} key={coupon.code} large actions={actions} showDelete isAdminView />)}
    </div>
  );
}

function FraudCenter({ actions }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="Fraud risk heatmap" action={<ShieldCheck size={16} />}>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 35 }).map((_, index) => {
            const intensity = (index * 17) % 100;
            return <div key={index} className="aspect-square rounded-md" style={{ backgroundColor: `rgba(249, 115, 22, ${0.16 + intensity / 140})` }} />;
          })}
        </div>
      </Panel>
      <Panel title="Suspicious alerts" action="Auto rules">
        <div className="space-y-3">
          {fraudAlerts.map((alert) => (
            <div key={alert.user} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{alert.signal}</p>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">{alert.score}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{alert.user}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm">{alert.action}</p>
                <button onClick={() => actions.notify(`${alert.user} added to demo blacklist.`)} className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Block</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Analytics({ customerEarnings, actions }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Claims vs fraud attempts" action="Weekly">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="redemptions" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="fraud" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Region-wise engagement" action={<Globe2 size={16} />}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={regions} dataKey="value" nameKey="region" innerRadius={70} outerRadius={110} paddingAngle={4}>
                {regions.map((entry, index) => <Cell key={entry.region} fill={['#2563eb', '#10b981', '#f97316', '#64748b', '#14b8a6'][index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      </div>
      <Panel title="Customer Earnings Summary" action={<button onClick={() => actions.exportCustomerEarnings()} className="flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/5 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition"><Download size={14} /> Export Data</button>}>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Total Earned</th>
                <th className="px-4 py-3 text-right">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerEarnings.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="px-4 py-3 font-semibold">{c.userName}</td>
                  <td className="px-4 py-3 text-slate-500">{c.userEmail}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">${c.totalEarned.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{c.transactionCount}</td>
                </tr>
              ))}
              {customerEarnings.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center text-slate-500 italic">No marketplace activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Generator({ actions }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    code: '', 
    description: '', 
    type: 'percentage', 
    value: 20, 
    vendor: '',
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <Panel title="Dynamic coupon generator" action={<Plus size={16} />}>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Website / Brand Name</span>
          <input name="vendor" value={formData.vendor} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" placeholder="e.g. ShopSphere, TechMart" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Coupon Title</span>
          <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" placeholder="e.g. Summer Sale" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Coupon Code</span>
          <input name="code" value={formData.code} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" placeholder="e.g. SUMMER20" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Discount Type</span>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Starts At</span>
          <input type="date" name="startsAt" value={formData.startsAt} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Expires At</span>
          <input type="date" name="expiresAt" value={formData.expiresAt} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" />
        </label>
        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <input name="description" value={formData.description} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" placeholder="Description of the offer" />
        </label>
        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium">Discount Value ({formData.type === 'percentage' ? '%' : '$'})</span>
          <input name="value" type="number" value={formData.value} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950" placeholder="e.g. 20" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => actions.generateBackendCoupon(formData)} className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Generate Coupon</button>
      </div>
    </Panel>
  );
}

function UsersPanel({ users }) {
  const userRows = (users || []).map(u => `${u.name} (${u.email}) - ${u.role}`);
  return <TablePanel title="Dynamic User Management" rows={userRows.length ? userRows : ['No users found.']} icon={<Users size={16} />} />;
}

function WalletPanel() {
  return <TablePanel title="Wallet and rewards" rows={['Cashback balance $48.00', 'Reward points 3,200', 'Referral rewards 18 qualified', 'Loyalty tier Platinum']} icon={<CreditCard size={16} />} />;
}

function SettingsPanel() {
  return <TablePanel title="Enterprise controls" rows={['Feature flags enabled', 'API keys scoped', 'Webhook retries active', 'IP allowlist enforced', 'S3 storage configured']} icon={<KeyRound size={16} />} />;
}

function TablePanel({ title, rows, icon }) {
  return (
    <Panel title={title} action={icon}>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {rows.map((row) => <div key={row} className="flex items-center justify-between py-4 text-sm"><span>{row}</span><ChevronRight size={16} /></div>)}
      </div>
    </Panel>
  );
}

function Panel({ title, action, children }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-950 dark:text-slate-300">{action}</span>
      </div>
      {children}
    </div>
  );
}

function CouponCard({ coupon, large = false, actions, showDelete = false, isAdminView = false }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${large ? 'min-h-64' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">{coupon.type}</span>
        <Fingerprint size={17} className={coupon.risk > 60 ? 'text-orange-500' : 'text-emerald-500'} />
      </div>
      <h4 className="mt-4 text-xl font-semibold">{coupon.title}</h4>
      <p className="mt-1 font-mono text-sm text-slate-500">{coupon.code}</p>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>Usage</span><span>{coupon.usage}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand" style={{ width: `${coupon.usage}%` }} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">Expires</span>
        <span className="font-semibold">{coupon.expires}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {isAdminView ? (
          <>
            <button onClick={() => actions?.openModal(`coupon:${coupon.code}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800">Details</button>
            {coupon._raw?._id && (
              <button onClick={() => { if(window.confirm('Delete this coupon?')) actions?.deleteCoupon(coupon._raw._id) }} className="rounded-xl bg-red-50 text-red-600 px-4 py-2 text-xs font-extrabold uppercase tracking-widest hover:bg-red-100 transition shadow-sm border border-red-200">Delete</button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => actions?.claimCoupon(coupon)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Claim</button>
            <button onClick={() => actions?.openModal(`coupon:${coupon.code}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800">Details</button>
          </>
        )}
      </div>
    </div>
  );
}

function MarketingSections({ actions }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14">
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          [Bot, 'AI Smart Coupon Engine', 'Predict conversion, optimize discount values, and personalize offers from behavioral signals.'],
          [ShieldCheck, 'FraudShield Controls', 'Score redemptions using IP, device, velocity, referral, VPN, and anomaly signals.'],
          [Globe2, 'Cloud Ready Platform', 'Docker, NGINX, Kubernetes, CI/CD, S3-compatible assets, and monitoring-friendly services.']
        ].map(([Icon, title, copy]) => (
          <div key={title} className="glass rounded-lg p-5">
            <Icon className="text-brand" />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {['Starter', 'Growth', 'Enterprise'].map((plan, index) => (
          <div key={plan} className="glass rounded-lg p-5">
            <p className="text-lg font-semibold">{plan}</p>
            <p className="mt-2 text-3xl font-semibold">${[49, 199, 799][index]}<span className="text-sm font-normal text-slate-500">/mo</span></p>
            <button onClick={() => actions.notify(`${plan} plan selected. In production this opens Stripe checkout.`)} className="mt-5 w-full rounded-lg bg-slate-950 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Choose {plan}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionButton({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="glass flex items-center justify-center gap-2 rounded-lg p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-glow">
      {icon} {label}
    </button>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-glow dark:bg-white dark:text-slate-950">
      {message}
    </motion.div>
  );
}

function DemoModal({ modal, actions }) {
  if (!modal) return null;
  const content = getModalContent(modal);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass max-w-lg rounded-lg p-5 shadow-glow">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h3 className="text-xl font-semibold">{content.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{content.body}</p>
          </div>
          <button onClick={actions.closeModal} className="rounded-lg border border-slate-200 px-3 py-1 text-sm dark:border-slate-800">Close</button>
        </div>
        <div className="mt-4 space-y-2">
          {content.items.map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">{item}</div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function getModalContent(modal) {
  if (modal === 'api') {
    return {
      title: 'API documentation',
      body: 'The backend exposes versioned REST APIs and Swagger docs. Locally, run the server and open /api/v1/docs.',
      items: ['POST /auth/login', 'POST /coupons/:id/claim', 'POST /coupons/:id/redeem', 'GET /analytics/overview']
    };
  }
  if (modal === 'filters') {
    return {
      title: 'Smart filters',
      body: 'In production these filters query MongoDB with pagination, text search, status filters, region filters, and campaign segments.',
      items: ['Status: active, paused, expired', 'Type: flash, referral, cashback', 'Risk: low, medium, high', 'Region: city or country']
    };
  }
  if (modal === 'notifications') {
    return {
      title: 'Notifications',
      body: 'Realtime admin notifications come through Socket.io and can also be delivered by email, SMS, push, or in-app messages.',
      items: ['FLASH35 crossed 70% usage', 'Duplicate device blocked', 'Campaign export completed']
    };
  }
  return {
    title: modal.replace('coupon:', 'Coupon '),
    body: 'A coupon moves through create, validate, claim, fraud-score, redeem, analytics, and audit-log steps.',
    items: ['JWT user is verified', 'Coupon rules are checked', 'Fraud score is calculated', 'Redemption and analytics events are stored']
  };
}

function LoginScreen({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      if (name && email && password) onRegister(name, email, password);
    } else {
      if (email && password) onLogin(email, password);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-4 dark:bg-slate-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl dark:bg-slate-950 border dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand text-white shadow-glow">
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CouponSphere</h1>
            <p className="text-sm text-slate-500">{isRegister ? 'Create your custom account' : 'Sign in to your account'}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isRegister && (
            <label className="block space-y-2">
              <span className="text-sm font-medium">Full Name</span>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-900" 
                placeholder="John Doe" 
              />
            </label>
          )}
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-900" 
              placeholder="name@example.com" 
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-900" 
              placeholder="••••••••" 
            />
          </label>
          <button type="submit" className="mt-2 w-full rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand/90 hover:shadow-brand/20">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mb-6">
          <button 
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need a custom account? Register here'}
          </button>
        </div>

        {!isRegister && (
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider text-center">Quick Access Demo</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => { setEmail('admin@urbanbite.dev'); setPassword('Password123!'); }}
                className="rounded-lg border border-slate-200 p-2 text-xs font-medium hover:border-brand hover:text-brand dark:border-slate-800"
              >
                Admin
              </button>
            <button 
              type="button"
              onClick={() => { setEmail('maya@example.com'); setPassword('Password123!'); }}
              className="rounded-lg border border-slate-200 p-2 text-xs font-medium hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-800"
            >
              Maya
            </button>
            <button 
              type="button"
              onClick={() => { setEmail('alex@example.com'); setPassword('Password123!'); }}
              className="rounded-lg border border-slate-200 p-2 text-xs font-medium hover:border-blue-500 hover:text-blue-500 dark:border-slate-800"
            >
              Alex
            </button>
            <button 
              type="button"
              onClick={() => { setEmail('jordan@example.com'); setPassword('Password123!'); }}
              className="rounded-lg border border-slate-200 p-2 text-xs font-medium hover:border-purple-500 hover:text-purple-500 dark:border-slate-800"
            >
              Jordan
            </button>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
}

function UserDashboard({ coupons, actions, onLogout, theme, dispatch, marketplaceListings, earnings, myInventory }) {
  const [activeSubView, setActiveSubView] = useState('browsing');
  const [filter, setFilter] = useState('All');
  
  useEffect(() => {
    actions.fetchMarketplace();
    actions.fetchInventory();
  }, []); // Run once on dashboard mount

  const vendors = ['All', ...new Set(coupons.map(c => c.vendor))];
  const filteredCoupons = filter === 'All' ? coupons : coupons.filter(c => c.vendor === filter);

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 pb-16">
      <header className="sticky top-0 z-10 glass border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="text-brand" />
            <span className="font-bold text-lg">UrbanBite Deals</span>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6 mr-6 border-r border-slate-200 dark:border-slate-800 pr-6">
              {[
                ['browsing', 'Store'],
                ['marketplace', 'Marketplace'],
                ['inventory', 'Inventory'],
                ['wallet', 'Earnings']
              ].map(([id, label]) => (
                <button 
                  key={id} 
                  onClick={() => setActiveSubView(id)}
                  className={`text-sm font-bold transition ${activeSubView === id ? 'text-brand' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <button onClick={() => dispatch(toggleTheme())} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-900" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={onLogout} className="text-sm font-semibold bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-900 dark:text-white">Logout</button>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-5xl px-4 mt-8">
        {activeSubView === 'browsing' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">Available Offers</h2>
                <p className="text-slate-500 dark:text-slate-400">Claim these special discounts on your next order!</p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                {vendors.map(v => (
                  <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${filter === v ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCoupons.map((coupon) => (
                <motion.div key={coupon.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand uppercase">{coupon.vendor}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{coupon.type}</div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-brand transition-colors">{coupon.title}</h3>
                    <p className="font-mono text-sm font-medium bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-center tracking-widest border border-dashed border-slate-200 dark:border-slate-800">{coupon.code}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Valid till: <br /><span className="font-semibold text-slate-700 dark:text-slate-300">{coupon.expires}</span></div>
                    {myInventory.some(r => String(r.couponId?._id || r.couponId) === String(coupon._raw?._id)) ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 border border-emerald-500/20 shadow-sm shadow-emerald-500/10 animate-pulse">Already Claimed</span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">In Inventory</span>
                      </div>
                    ) : (
                      <button onClick={() => actions.claimCoupon(coupon)} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-brand/20 transition hover:-translate-y-0.5 active:translate-y-0">Avail Offer</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeSubView === 'marketplace' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight">Community Marketplace</h2>
              <div className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-500/20">
                <BadgeDollarSign size={18} />
                <span>Total Earnings: ${earnings.total}</span>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {marketplaceListings.map((listing) => (
                <motion.div key={listing._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 border-t-4 border-t-emerald-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">{listing.couponId?.vendor || 'UrbanBite'}</span>
                    <span className="text-lg font-bold text-emerald-600">${listing.price}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{listing.couponId?.title || 'Unknown Coupon'}</h3>
                  <p className="text-xs text-slate-500 mb-4">Sold by: {listing.userId?.name || 'Community Member'}</p>
                  <button onClick={() => actions.buyCouponFromMarket(listing._id)} className="w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Buy Coupon</button>
                </motion.div>
              ))}
              {marketplaceListings.length === 0 && <div className="col-span-full py-20 text-center text-slate-500">No coupons currently listed for sale.</div>}
            </div>
          </div>
        )}

        {activeSubView === 'inventory' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-extrabold tracking-tight">My Coupon Inventory</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myInventory.filter(c => c.status === 'claimed').map((redemption) => (
                <motion.div key={redemption._id} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-xs font-bold text-brand uppercase">{redemption.couponId?.vendor || 'UrbanBite'}</span>
                  <h3 className="text-xl font-bold mt-2 mb-4">{redemption.couponId?.title || 'Personal Coupon'}</h3>
                  <div className="space-y-2">
                    <button onClick={() => {
                      const price = prompt('Enter sale price ($):', '5');
                      if (price) actions.listForSale(redemption._id, parseFloat(price));
                    }} className="w-full rounded-xl bg-brand/10 py-3 text-sm font-bold text-brand hover:bg-brand hover:text-white transition">Sell in Marketplace</button>
                    <button className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-400">Use Now</button>
                  </div>
                </motion.div>
              ))}
              {myInventory.filter(c => c.status === 'claimed').length === 0 && <div className="col-span-full py-20 text-center text-slate-500">You don't have any unused coupons to sell.</div>}
            </div>
          </div>
        )}

        {activeSubView === 'wallet' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-extrabold tracking-tight">My Earnings Dashboard</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="glass rounded-2xl p-6 border-l-4 border-emerald-500">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Money Earned</p>
                <p className="text-4xl font-extrabold mt-2 text-emerald-600">${earnings.total}</p>
              </div>
              <div className="glass rounded-2xl p-6 border-l-4 border-blue-500">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Coupons Sold</p>
                <p className="text-4xl font-extrabold mt-2 text-blue-600">{earnings.transactions.length}</p>
              </div>
            </div>
            <div className="glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Transaction</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {earnings.transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                      <td className="px-6 py-4 text-sm font-medium">{tx.description}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">+${tx.amount}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {earnings.transactions.length === 0 && <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No earnings yet. Start selling coupons to make money!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
