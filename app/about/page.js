import Link from 'next/link';
import { Zap, Users, Target, Award } from 'lucide-react';

export default function AboutPage() {
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
              <Link href="/about" className="text-white font-medium">About</Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
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
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">SwiftNet</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Empowering businesses with professional WiFi hotspot billing solutions since 2024. We make internet access management simple, secure, and scalable.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Mission</h2>
              <p className="text-gray-400 text-lg mb-6">
                At SwiftNet, we believe that managing WiFi hotspot access should be seamless for both providers and users. Our mission is to deliver cutting-edge billing solutions that simplify operations, enhance user experience, and drive revenue growth.
              </p>
              <p className="text-gray-400 text-lg mb-6">
                We combine powerful technology with intuitive design to create solutions that work for businesses of all sizes - from small cafes to large enterprise networks.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Customer-First Approach</h3>
                  <p className="text-gray-400 text-sm">Your success is our priority</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-gray-400 text-sm">Active Hotspots</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">50K+</div>
                  <div className="text-gray-400 text-sm">Daily Users</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-gray-400 text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-gray-400 text-sm">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Innovation</h3>
              <p className="text-gray-400">We continuously push boundaries to deliver cutting-edge solutions that stay ahead of industry trends.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Community</h3>
              <p className="text-gray-400">We build solutions that connect people and foster meaningful digital experiences.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Excellence</h3>
              <p className="text-gray-400">We maintain the highest standards in quality, security, and customer satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Team</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Meet the passionate people behind SwiftNet</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">JD</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">John Doe</h3>
              <p className="text-cyan-400 text-sm mb-4">CEO & Founder</p>
              <p className="text-gray-400 text-sm">Visionary leader with 15+ years in telecom and software development.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">JS</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Jane Smith</h3>
              <p className="text-purple-400 text-sm mb-4">CTO</p>
              <p className="text-gray-400 text-sm">Technical architect specializing in scalable infrastructure and security.</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">MJ</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Mike Johnson</h3>
              <p className="text-cyan-400 text-sm mb-4">Head of Product</p>
              <p className="text-gray-400 text-sm">Product strategist focused on user experience and market innovation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Journey</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Be part of the future of WiFi hotspot management. Get started with SwiftNet today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-500 transition-all duration-300">
                Contact Us
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto px-8 py-4 bg-slate-900/60 border border-white/10 text-white font-bold rounded-xl hover:bg-slate-800/60 transition-all duration-300">
                View Pricing
              </Link>
            </div>
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
