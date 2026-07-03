'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // overview, plans, subscribers, settings, blog, pages, contact
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSubscribers: 0,
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0,
    router: { status: 'UNKNOWN', message: 'Checking...' },
    recentTransactions: []
  });

  // DB entities
  const [plans, setPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / forms state
  const [planForm, setPlanForm] = useState({ id: '', name: '', price: '', duration: '', mikrotikProfile: '', rateLimit: '5M/5M', sessionTimeout: '' });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [extendHours, setExtendHours] = useState('1');

  // Settings forms
  const [routerForm, setRouterForm] = useState({ routerHost: '', routerPort: 8728, routerUser: '', routerPassword: '' });
  const [paymentForm, setPaymentForm] = useState({ paystackEnabled: false, paystackPublicKey: '', paystackSecretKey: '', squadEnabled: false, squadPublicKey: '', squadSecretKey: '' });
  const [emailForm, setEmailForm] = useState({ emailEnabled: false, emailHost: '', emailPort: 587, emailUser: '', emailPassword: '', emailFrom: '', emailFromName: '' });

  // CMS state
  const [blogPosts, setBlogPosts] = useState([]);
  const [pageContents, setPageContents] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [blogForm, setBlogForm] = useState({ id: '', title: '', slug: '', excerpt: '', content: '', coverImage: '', published: false });
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [pageForm, setPageForm] = useState({ pageKey: '', title: '', content: '', metadata: {} });
  const [showPageModal, setShowPageModal] = useState(false);

  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch('/api/admin/dashboard', { headers });
      if (statsRes.status === 401) {
        router.push('/admin');
        return;
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // Plans
      const plansRes = await fetch('/api/admin/plans', { headers });
      const plansData = await plansRes.json();
      setPlans(plansData);

      // Subscribers
      const subRes = await fetch('/api/admin/subscribers', { headers });
      const subData = await subRes.json();
      setSubscribers(subData);

      // Router Settings
      const routerRes = await fetch('/api/admin/router-settings', { headers });
      const routerData = await routerRes.json();
      setRouterForm({ ...routerData, routerPassword: '' });

      // Payment Settings
      const payRes = await fetch('/api/admin/payment-settings', { headers });
      const payData = await payRes.json();
      setPaymentForm({ ...payData, paystackSecretKey: '', squadSecretKey: '' });

      // Email Settings
      const emailRes = await fetch('/api/admin/email-settings', { headers });
      const emailData = await emailRes.json();
      setEmailForm({ ...emailData, emailPassword: '' });

      // CMS Data
      const blogRes = await fetch('/api/cms/blog', { headers });
      const blogData = await blogRes.json();
      setBlogPosts(Array.isArray(blogData) ? blogData : []);

      const pageRes = await fetch('/api/cms/pages', { headers });
      const pageData = await pageRes.json();
      setPageContents(Array.isArray(pageData) ? pageData : []);

      const contactRes = await fetch('/api/admin/contact', { headers });
      const contactData = await contactRes.json();
      setContactMessages(Array.isArray(contactData) ? contactData : []);

    } catch (e) {
      showNotify('error', 'Failed to retrieve console data');
    } finally {
      setLoading(false);
    }
  };

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  // Plan actions
  const handleSavePlan = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const method = planForm.id ? 'PATCH' : 'POST';

    try {
      const res = await fetch('/api/admin/plans', {
        method,
        headers,
        body: JSON.stringify(planForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', `Plan ${planForm.id ? 'updated' : 'created'} successfully`);
      setShowPlanModal(false);
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Plan deleted successfully');
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  // Subscriber actions
  const handleDisconnect = async (id) => {
    if (!confirm('Disconnect subscriber and end session?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'disconnect', subscriberId: id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Subscriber disconnected successfully');
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const seconds = parseInt(extendHours) * 3600;
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'extend', subscriberId: selectedSub.id, extendSeconds: seconds })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Subscription extended successfully');
      setShowExtendModal(false);
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  // Settings actions
  const handleSaveRouterSettings = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/router-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(routerForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify(
        data.routerStatus === 'ONLINE' ? 'success' : 'warning',
        `Router settings saved. Status: ${data.routerStatus}. ${data.routerMessage}`
      );
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Payment settings saved successfully');
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleSaveEmailSettings = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(emailForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Email settings saved successfully');
      setEmailForm({ ...emailForm, emailPassword: '' });
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  // CMS handlers
  const handleSaveBlogPost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const method = blogForm.id ? 'PATCH' : 'POST';

    try {
      const url = blogForm.id ? `/api/cms/blog/${blogForm.slug}` : '/api/cms/blog';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(blogForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', `Blog post ${blogForm.id ? 'updated' : 'created'} successfully`);
      setShowBlogModal(false);
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleDeleteBlogPost = async (slug) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/cms/blog/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Blog post deleted successfully');
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleSavePageContent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pageForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Page content saved successfully');
      setShowPageModal(false);
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleUpdateContactStatus = async (id, status) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Contact status updated');
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const handleDeleteContactMessage = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/contact?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      showNotify('success', 'Message deleted successfully');
      fetchDashboardData();
    } catch (err) {
      showNotify('error', err.message);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const query = searchQuery.toLowerCase();
    return (
      sub.fullName.toLowerCase().includes(query) ||
      sub.phone.toLowerCase().includes(query) ||
      (sub.email && sub.email.toLowerCase().includes(query)) ||
      sub.username.toLowerCase().includes(query) ||
      (sub.macAddress && sub.macAddress.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070c] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm tracking-wider">Loading console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-wide">SWIFT<span className="text-cyan-400">NET</span> <span className="text-xs text-gray-500 font-normal">ADMIN</span></h1>
        </div>
        <button onClick={handleLogout} className="bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 px-4 py-2 rounded-lg text-sm transition-all">
          Logout
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Notification Toast */}
        {notification.message && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl border shadow-xl flex items-center gap-3 animate-bounce ${
            notification.type === 'success' ? 'bg-green-950/80 border-green-500/40 text-green-200' :
            notification.type === 'warning' ? 'bg-yellow-950/80 border-yellow-500/40 text-yellow-200' :
            'bg-red-950/80 border-red-500/40 text-red-200'
          }`}>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Subscribers</span>
            <span className="text-3xl font-extrabold mt-2 text-white">{stats.activeSubscribers}</span>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Revenue Today</span>
            <span className="text-3xl font-extrabold mt-2 text-cyan-400">₦{stats.revenueToday}</span>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Revenue This Week</span>
            <span className="text-3xl font-extrabold mt-2 text-blue-400">₦{stats.revenueWeek}</span>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Revenue This Month</span>
            <span className="text-3xl font-extrabold mt-2 text-purple-400">₦{stats.revenueMonth}</span>
          </div>
        </section>

        {/* Tabs Bar */}
        <div className="flex border-b border-white/10 gap-6 overflow-x-auto">
          {['overview', 'plans', 'subscribers', 'settings', 'blog', 'pages', 'contact'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <section className="bg-slate-900/20 rounded-2xl border border-white/5 p-8">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-xl">
                <div>
                  <h3 className="font-bold text-white text-lg">MikroTik Router Connection</h3>
                  <p className="text-sm text-gray-400 mt-1">{stats.router.message}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  stats.router.status === 'ONLINE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {stats.router.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white mb-4">Recent Payments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="pb-3">Subscriber</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Provider</th>
                        <th className="pb-3">Reference</th>
                        <th className="pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTransactions.map(tx => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-4">{tx.subscriber.fullName} ({tx.subscriber.username})</td>
                          <td className="py-4">{tx.plan.name}</td>
                          <td className="py-4 font-semibold text-cyan-400">₦{tx.amount}</td>
                          <td className="py-4">{tx.provider}</td>
                          <td className="py-4 text-xs font-mono">{tx.providerRef}</td>
                          <td className="py-4 text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Internet Billing Plans</h3>
                <button onClick={() => {
                  setPlanForm({ id: '', name: '', price: '', duration: '', mikrotikProfile: '', rateLimit: '5M/5M', sessionTimeout: '' });
                  setShowPlanModal(true);
                }} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                  Create Plan
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Duration (Secs)</th>
                      <th className="pb-3">MikroTik Profile</th>
                      <th className="pb-3">Rate Limit</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(plan => (
                      <tr key={plan.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 font-semibold">{plan.name}</td>
                        <td className="py-4 text-cyan-400">₦{plan.price}</td>
                        <td className="py-4">{plan.duration}s</td>
                        <td className="py-4">{plan.mikrotikProfile}</td>
                        <td className="py-4">{plan.rateLimit}</td>
                        <td className="py-4 text-right space-x-3">
                          <button onClick={() => {
                            setPlanForm(plan);
                            setShowPlanModal(true);
                          }} className="text-purple-400 hover:text-purple-300 text-xs">Edit</button>
                          <button onClick={() => handleDeletePlan(plan.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBSCRIBERS TAB */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <input
                  type="text"
                  placeholder="Search subscribers (name, phone, username, MAC)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full md:max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Username</th>
                      <th className="pb-3">MAC Address</th>
                      <th className="pb-3">Expiry Time</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map(sub => {
                      const isExpired = sub.subscriptionExpiry && new Date(sub.subscriptionExpiry) < new Date();
                      return (
                        <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-4 font-semibold">{sub.fullName}</td>
                          <td className="py-4 text-gray-300">{sub.phone}</td>
                          <td className="py-4 font-mono text-xs">{sub.username}</td>
                          <td className="py-4 font-mono text-xs text-gray-400">{sub.macAddress || '-'}</td>
                          <td className="py-4 text-xs text-gray-300">
                            {sub.subscriptionExpiry ? new Date(sub.subscriptionExpiry).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'ACTIVE' && !isExpired ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {sub.status === 'ACTIVE' && !isExpired ? 'ACTIVE' : 'EXPIRED'}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-3">
                            <button onClick={() => {
                              setSelectedSub(sub);
                              setShowExtendModal(true);
                            }} className="text-green-400 hover:text-green-300 text-xs">Extend</button>
                            {sub.status === 'ACTIVE' && (
                              <button onClick={() => handleDisconnect(sub.id)} className="text-red-400 hover:text-red-300 text-xs">Disconnect</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* MikroTik Settings */}
              <form onSubmit={handleSaveRouterSettings} className="space-y-5 bg-white/5 p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-white text-lg border-b border-white/10 pb-2">MikroTik Router Config</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Router Host IP</label>
                  <input
                    type="text"
                    value={routerForm.routerHost}
                    onChange={e => setRouterForm({ ...routerForm, routerHost: e.target.value })}
                    required
                    placeholder="192.168.88.1"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API Port</label>
                  <input
                    type="number"
                    value={routerForm.routerPort}
                    onChange={e => setRouterForm({ ...routerForm, routerPort: parseInt(e.target.value) })}
                    required
                    placeholder="8728"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API Username</label>
                  <input
                    type="text"
                    value={routerForm.routerUser}
                    onChange={e => setRouterForm({ ...routerForm, routerUser: e.target.value })}
                    required
                    placeholder="admin"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API Password</label>
                  <input
                    type="password"
                    value={routerForm.routerPassword}
                    onChange={e => setRouterForm({ ...routerForm, routerPassword: e.target.value })}
                    placeholder="Change password (leave empty to keep current)"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-xl text-sm transition-all">
                  Save & Test Connection
                </button>
              </form>

              {/* Payment Settings */}
              <form onSubmit={handleSavePaymentSettings} className="space-y-5 bg-white/5 p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-white text-lg border-b border-white/10 pb-2">Payment Gateways</h3>
                
                {/* Paystack section */}
                <div className="space-y-3 border-b border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">Paystack Processor</span>
                    <input
                      type="checkbox"
                      checked={paymentForm.paystackEnabled}
                      onChange={e => setPaymentForm({ ...paymentForm, paystackEnabled: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Public Key</label>
                    <input
                      type="text"
                      value={paymentForm.paystackPublicKey}
                      onChange={e => setPaymentForm({ ...paymentForm, paystackPublicKey: e.target.value })}
                      placeholder="pk_test_..."
                      className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={paymentForm.paystackSecretKey}
                      onChange={e => setPaymentForm({ ...paymentForm, paystackSecretKey: e.target.value })}
                      placeholder="Update secret key (leave blank to keep)"
                      className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Squad section */}
                <div className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">Squad Processor</span>
                    <input
                      type="checkbox"
                      checked={paymentForm.squadEnabled}
                      onChange={e => setPaymentForm({ ...paymentForm, squadEnabled: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Public Key</label>
                    <input
                      type="text"
                      value={paymentForm.squadPublicKey}
                      onChange={e => setPaymentForm({ ...paymentForm, squadPublicKey: e.target.value })}
                      placeholder="pk_test_..."
                      className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={paymentForm.squadSecretKey}
                      onChange={e => setPaymentForm({ ...paymentForm, squadSecretKey: e.target.value })}
                      placeholder="Update secret key (leave blank to keep)"
                      className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-xl text-sm transition-all">
                  Save Payment Settings
                </button>
              </form>

              {/* Email Settings Form */}
              <form onSubmit={handleSaveEmailSettings} className="space-y-4 pt-6 border-t border-white/10">
                <h4 className="font-bold text-white text-sm">Email Configuration</h4>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">Enable Email Notifications</span>
                  <input
                    type="checkbox"
                    checked={emailForm.emailEnabled}
                    onChange={e => setEmailForm({ ...emailForm, emailEnabled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={emailForm.emailHost}
                      onChange={e => setEmailForm({ ...emailForm, emailHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Port</label>
                    <input
                      type="number"
                      value={emailForm.emailPort}
                      onChange={e => setEmailForm({ ...emailForm, emailPort: parseInt(e.target.value) })}
                      placeholder="587"
                      className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={emailForm.emailUser}
                    onChange={e => setEmailForm({ ...emailForm, emailUser: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={emailForm.emailPassword}
                    onChange={e => setEmailForm({ ...emailForm, emailPassword: e.target.value })}
                    placeholder="Update password (leave blank to keep)"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">From Email</label>
                  <input
                    type="email"
                    value={emailForm.emailFrom}
                    onChange={e => setEmailForm({ ...emailForm, emailFrom: e.target.value })}
                    placeholder="noreply@swiftnet.com"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">From Name</label>
                  <input
                    type="text"
                    value={emailForm.emailFromName}
                    onChange={e => setEmailForm({ ...emailForm, emailFromName: e.target.value })}
                    placeholder="SwiftNet"
                    className="w-full bg-[#05070c]/50 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 font-bold rounded-xl text-sm transition-all">
                  Save Email Settings
                </button>
              </form>
            </div>
          )}

          {/* BLOG TAB */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Blog Posts</h3>
                <button onClick={() => {
                  setBlogForm({ id: '', title: '', slug: '', excerpt: '', content: '', coverImage: '', published: false });
                  setShowBlogModal(true);
                }} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                  Create Post
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Slug</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogPosts.map(post => (
                      <tr key={post.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 font-semibold">{post.title}</td>
                        <td className="py-4 font-mono text-xs text-gray-400">{post.slug}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            post.published ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {post.published ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 text-right space-x-3">
                          <button onClick={() => {
                            setBlogForm(post);
                            setShowBlogModal(true);
                          }} className="text-purple-400 hover:text-purple-300 text-xs">Edit</button>
                          <button onClick={() => handleDeleteBlogPost(post.slug)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAGES TAB */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Page Content</h3>
                <button onClick={() => {
                  setPageForm({ pageKey: '', title: '', content: '', metadata: {} });
                  setShowPageModal(true);
                }} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                  Add/Edit Page
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="pb-3">Page Key</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageContents.map(page => (
                      <tr key={page.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 font-mono text-xs text-gray-400">{page.pageKey}</td>
                        <td className="py-4 font-semibold">{page.title}</td>
                        <td className="py-4 text-xs text-gray-400">{new Date(page.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="font-bold text-white text-lg">Contact Messages</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Subject</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactMessages.map(msg => (
                      <tr key={msg.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-4 font-semibold">{msg.name}</td>
                        <td className="py-4 text-gray-300">{msg.email}</td>
                        <td className="py-4">{msg.subject}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            msg.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            msg.status === 'READ' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {msg.status}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</td>
                        <td className="py-4 text-right space-x-3">
                          <button onClick={() => handleUpdateContactStatus(msg.id, 'READ')} className="text-yellow-400 hover:text-yellow-300 text-xs">Mark Read</button>
                          <button onClick={() => handleUpdateContactStatus(msg.id, 'REPLIED')} className="text-green-400 hover:text-green-300 text-xs">Mark Replied</button>
                          <button onClick={() => handleDeleteContactMessage(msg.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* PLAN CREATE / EDIT MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-lg">{planForm.id ? 'Edit Plan' : 'Create Plan'}</h3>
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. 1 Day Plan"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Price (₦)</label>
                <input
                  type="number"
                  required
                  value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="500"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Duration (Seconds)</label>
                <input
                  type="number"
                  required
                  value={planForm.duration}
                  onChange={e => setPlanForm({ ...planForm, duration: e.target.value })}
                  placeholder="86400"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">MikroTik Profile Name</label>
                <input
                  type="text"
                  required
                  value={planForm.mikrotikProfile}
                  onChange={e => setPlanForm({ ...planForm, mikrotikProfile: e.target.value })}
                  placeholder="1d-profile"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Rate Limit (Bandwidth)</label>
                <input
                  type="text"
                  value={planForm.rateLimit}
                  onChange={e => setPlanForm({ ...planForm, rateLimit: e.target.value })}
                  placeholder="5M/5M"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowPlanModal(false)} className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-semibold transition-all">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND TIME MODAL */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-lg">Extend Subscription</h3>
            <p className="text-xs text-gray-400">Extend subscription time for {selectedSub?.fullName}</p>
            <form onSubmit={handleExtend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={extendHours}
                  onChange={e => setExtendHours(e.target.value)}
                  placeholder="1"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowExtendModal(false)} className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" className="w-1/2 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-semibold transition-all">
                  Extend Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOG POST CREATE / EDIT MODAL */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl p-6 space-y-4 my-8">
            <h3 className="font-bold text-white text-lg">{blogForm.id ? 'Edit Blog Post' : 'Create Blog Post'}</h3>
            <form onSubmit={handleSaveBlogPost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="Post title"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={blogForm.slug}
                  onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })}
                  placeholder="post-url-slug"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Excerpt</label>
                <textarea
                  value={blogForm.excerpt}
                  onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Brief description for listing"
                  rows={2}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={blogForm.coverImage}
                  onChange={e => setBlogForm({ ...blogForm, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Content (HTML)</label>
                <textarea
                  required
                  value={blogForm.content}
                  onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                  placeholder="<p>Your blog content here...</p>"
                  rows={6}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none resize-none font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={blogForm.published}
                  onChange={e => setBlogForm({ ...blogForm, published: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-white/10"
                />
                <label className="text-sm text-gray-300">Publish immediately</label>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowBlogModal(false)} className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-semibold transition-all">
                  Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAGE CONTENT MODAL */}
      {showPageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl p-6 space-y-4 my-8">
            <h3 className="font-bold text-white text-lg">Edit Page Content</h3>
            <form onSubmit={handleSavePageContent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Page Key</label>
                <select
                  required
                  value={pageForm.pageKey}
                  onChange={e => setPageForm({ ...pageForm, pageKey: e.target.value })}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select a page</option>
                  <option value="home">Home Page</option>
                  <option value="about">About Page</option>
                  <option value="contact">Contact Page</option>
                  <option value="pricing">Pricing Page</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={pageForm.title}
                  onChange={e => setPageForm({ ...pageForm, title: e.target.value })}
                  placeholder="Page title"
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Content (HTML)</label>
                <textarea
                  required
                  value={pageForm.content}
                  onChange={e => setPageForm({ ...pageForm, content: e.target.value })}
                  placeholder="<p>Page content here...</p>"
                  rows={8}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:outline-none resize-none font-mono"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowPageModal(false)} className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-semibold transition-all">
                  Save Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
