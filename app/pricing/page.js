'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Check, Clock, Wifi, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      // Fallback plans if API fails
      setPlans([
        { id: '1', name: '1 Hour Plan', price: 100, duration: 3600, mikrotikProfile: '1h-profile' },
        { id: '2', name: '1 Day Plan', price: 500, duration: 86400, mikrotikProfile: '1d-profile' },
        { id: '3', name: '1 Week Plan', price: 2000, duration: 604800, mikrotikProfile: '1w-profile' }
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  const features = [
    'Unlimited Data Usage',
    'High-Speed Internet Access',
    'Secure Connection',
    '24/7 Technical Support',
    'Automatic Session Management',
    'Multiple Device Support'
  ];

  return (
    <div className="min-h-screen bg-[#05070c]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05070c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SWIFT<span className="text-cyan-400">NET</span></span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">About</Link>
              <Link href="/pricing" className="text-white font-medium">Pricing</Link>
              <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/portal" className="text-sm text-gray-400 hover:text-white transition-colors">Portal</Link>
              <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-blue-500 transition-all">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Pricing</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include high-speed internet access with no hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id}
                  className={`relative bg-slate-900/40 backdrop-blur-xl border rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                    index === 1 
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                      : 'border-white/5 hover:border-blue-500/30'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold text-white">₦{plan.price}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">per connection</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span>Duration: {formatDuration(plan.duration)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Wifi className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span>High-speed WiFi access</span>
                    </div>
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-300">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link 
                    href="/portal"
                    className={`block w-full py-4 text-center font-bold rounded-xl transition-all duration-300 ${
                      index === 1
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-purple-500'
                        : 'bg-slate-800 text-white hover:bg-slate-700 border border-white/10'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose SwiftNet?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Experience the difference with our premium WiFi hotspot service</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">High-speed internet with minimal latency</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Reliable Connection</h3>
              <p className="text-gray-400 text-sm">99.9% uptime guarantee</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Flexible Plans</h3>
              <p className="text-gray-400 text-sm">Choose from hourly to monthly plans</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-400 text-sm">Your data is always protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">How do I connect to the WiFi?</h3>
              <p className="text-gray-400 text-sm">Simply connect to our WiFi network and open your browser. You'll be redirected to our captive portal where you can choose a plan and make payment.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400 text-sm">We accept payments via Paystack and Squad, supporting card payments, bank transfers, and USSD.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">Can I use multiple devices?</h3>
              <p className="text-gray-400 text-sm">Each plan is per device. For multiple devices, you'll need to purchase separate plans for each device.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">What happens when my plan expires?</h3>
              <p className="text-gray-400 text-sm">You'll be automatically disconnected when your plan expires. You can purchase a new plan to continue using the service.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Connected?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied users enjoying high-speed internet access with SwiftNet.
            </p>
            <Link 
              href="/portal"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-500 transition-all duration-300 gap-2"
            >
              Connect Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">SWIFT<span className="text-cyan-400">NET</span></span>
              </div>
              <p className="text-gray-400 text-sm">Professional WiFi hotspot billing and management solution.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">About</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</Link></li>
                <li><Link href="/portal" className="text-gray-400 hover:text-white text-sm transition-colors">Captive Portal</Link></li>
                <li><Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">© 2024 SwiftNet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
