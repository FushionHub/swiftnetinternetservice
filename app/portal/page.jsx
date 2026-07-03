'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PortalContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState('signup'); // 'signup' | 'login' | 'pricing'
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PAYSTACK');

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // Router parameters
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [linkLogin, setLinkLogin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [subscriber, setSubscriber] = useState(null);
  const [successState, setSuccessState] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Capture URL params from MikroTik redirect
    const mac = searchParams.get('mac') || '';
    const ip = searchParams.get('ip') || '';
    const link = searchParams.get('link-login') || '';

    setMacAddress(mac);
    setIpAddress(ip);
    setLinkLogin(link);

    // Fetch active plans
    fetch('/api/admin/plans')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlans(data);
          if (data.length > 0) setSelectedPlan(data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
        const fallbackPlans = [
          { id: '1', name: '1 Hour Plan', price: 100, duration: 3600, mikrotikProfile: '1h-profile' },
          { id: '2', name: '1 Day Plan', price: 500, duration: 86400, mikrotikProfile: '1d-profile' },
          { id: '3', name: '1 Week Plan', price: 2000, duration: 604800, mikrotikProfile: '1w-profile' }
        ];
        setPlans(fallbackPlans);
        setSelectedPlan(fallbackPlans[0]);
      });
  }, [searchParams]);

  const formatDuration = (seconds) => {
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      return `${days} Day${days > 1 ? 's' : ''}`;
    }
    const hrs = Math.floor(seconds / 3600);
    if (hrs >= 1) return `${hrs} Hour${hrs > 1 ? 's' : ''}`;
    const mins = Math.floor(seconds / 60);
    return `${mins} Min${mins > 1 ? 's' : ''}`;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    setLoadingMessage('Creating your subscriber account...');

    try {
      const res = await fetch('/api/subscriber/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, email, username, macAddress })
      });
      const data = await res.json();

      if (data.success) {
        setSubscriber(data.subscriber);
        setTab('pricing');
        setLoading(false);
      } else {
        throw new Error(data.error || 'Failed to sign up');
      }
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    setLoadingMessage('Logging in...');

    try {
      const res = await fetch('/api/subscriber/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, macAddress })
      });
      const data = await res.json();

      if (data.success) {
        setSubscriber(data.subscriber);
        if (data.active) {
          authenticateOnRouter(data.subscriber.username);
        } else {
          setTab('pricing');
          setLoading(false);
        }
      } else {
        throw new Error(data.error || 'Failed to login');
      }
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const initiateCheckout = async () => {
    setErrorMsg('');
    setLoading(true);
    setLoadingMessage('Initializing secure checkout...');

    if (!subscriber || !selectedPlan) {
      setErrorMsg('Missing plan or subscriber details');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/pay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          subscriberId: subscriber.id,
          provider: paymentMethod,
          callbackUrl: window.location.href
        })
      });
      const data = await res.json();

      if (data.success) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const authenticateOnRouter = (username) => {
    setLoading(true);
    setLoadingMessage('Authenticating with WiFi Router...');

    const fallbackUsernameInput = document.getElementById('next-fallback-username');
    const fallbackPasswordInput = document.getElementById('next-fallback-password');
    const form = document.getElementById('next-mikrotik-fallback-form');

    if (fallbackUsernameInput && fallbackPasswordInput && form) {
      fallbackUsernameInput.value = username;
      fallbackPasswordInput.value = username;

      if (linkLogin) {
        form.action = linkLogin;
      }

      setLoadingMessage('Connecting to Internet...');
      setTimeout(() => {
        form.submit();
      }, 800);
    } else {
      setSuccessState(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#05070c] relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-lg bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[1px] mb-4">
            <div className="w-full h-full bg-[#0B0F19] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">SWIFT<span className="text-cyan-400">NET</span></h1>
          <p className="text-gray-400 text-sm mt-1">High-Speed Premium Hotspot</p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-lg mb-6 text-center">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">{loadingMessage}</p>
          </div>
        ) : successState ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 text-green-400 rounded-full mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Login Successful</h2>
            <p className="text-gray-300 text-sm mb-4">You are now connected to SwiftNet.</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-400">YOUR USERNAME / PASSWORD</p>
              <p className="text-lg font-bold text-white tracking-widest mt-1">{subscriber?.username}</p>
            </div>
            <p className="text-xs text-gray-400">If you are not automatically redirected, please browse to any website.</p>
          </div>
        ) : tab === 'signup' ? (
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="flex border-b border-white/10 mb-6">
              <button type="button" className="w-1/2 pb-3 font-semibold border-b-2 border-cyan-400 text-white">Sign Up</button>
              <button type="button" onClick={() => setTab('login')} className="w-1/2 pb-3 font-semibold text-gray-400 hover:text-white">Login</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Doe" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08012345678" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. customer@email.com" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username (Optional)</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Leave blank to auto-generate" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:-translate-y-[1px]">
              Next: Select Plan
            </button>
          </form>
        ) : tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex border-b border-white/10 mb-6">
              <button type="button" onClick={() => setTab('signup')} className="w-1/2 pb-3 font-semibold text-gray-400 hover:text-white">Sign Up</button>
              <button type="button" className="w-1/2 pb-3 font-semibold border-b-2 border-cyan-400 text-white">Login</button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone, Email or Username</label>
              <input type="text" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} required placeholder="Enter username, phone, or email" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:-translate-y-[1px]">
              Connect
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white text-center">Choose Internet Plan</h3>
            
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
              {plans.map((plan) => (
                <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`bg-slate-900/60 p-4 rounded-xl cursor-pointer flex justify-between items-center border transition-all ${selectedPlan?.id === plan.id ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-white/5 hover:bg-white/5'}`}>
                  <div>
                    <h4 className="font-bold text-white">{plan.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">Duration: {formatDuration(plan.duration)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-cyan-400">₦{plan.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">Payment Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <div onClick={() => setPaymentMethod('PAYSTACK')} className={`bg-slate-900/60 p-4 rounded-xl cursor-pointer text-center border transition-all ${paymentMethod === 'PAYSTACK' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 hover:bg-white/5'}`}>
                  <p className="font-bold text-white text-sm">Paystack</p>
                  <span className="text-[10px] text-gray-400">Card / Transfer</span>
                </div>
                <div onClick={() => setPaymentMethod('SQUAD')} className={`bg-slate-900/60 p-4 rounded-xl cursor-pointer text-center border transition-all ${paymentMethod === 'SQUAD' ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:bg-white/5'}`}>
                  <p className="font-bold text-white text-sm">Squad</p>
                  <span className="text-[10px] text-gray-400">USSD / Transfer</span>
                </div>
              </div>
            </div>

            <button onClick={initiateCheckout} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:-translate-y-[1px]">
              Pay ₦{selectedPlan?.price} Now
            </button>

            <button onClick={() => setTab('signup')} className="w-full text-center text-xs text-gray-400 hover:text-white mt-2">
              Go Back
            </button>
          </div>
        )}

        {macAddress && (
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
            <span>MAC: {macAddress}</span>
            <span>IP: {ipAddress}</span>
          </div>
        )}
      </div>

      <form id="next-mikrotik-fallback-form" action="" method="post" className="hidden">
        <input type="hidden" name="username" id="next-fallback-username" />
        <input type="hidden" name="password" id="next-fallback-password" />
        <input type="hidden" name="dst" value={searchParams.get('link-orig') || ''} />
        <input type="hidden" name="popup" value="true" />
      </form>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05070c] flex items-center justify-center text-white">Loading Portal...</div>}>
      <PortalContent />
    </Suspense>
  );
}
