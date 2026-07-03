'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Zap, Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/cms/blog/${params.slug}`);
      if (!res.ok) {
        throw new Error('Post not found');
      }
      const data = await res.json();
      setPost(data);
    } catch (err) {
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070c] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#05070c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">{error || 'Post not found'}</p>
          <Link href="/blog" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

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
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link href="/blog" className="text-white font-medium">Blog</Link>
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

      {/* Blog Post Content */}
      <article className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-8">
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Post Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>5 min read</span>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div 
              className="text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Share this post</span>
              <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts Section */}
      <section className="py-20 px-4 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Related Posts</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="aspect-video bg-slate-800 rounded-xl mb-4"></div>
              <h3 className="text-lg font-bold text-white mb-2">Getting Started with WiFi Hotspot Management</h3>
              <p className="text-gray-400 text-sm">Learn the basics of setting up and managing your WiFi hotspot.</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="aspect-video bg-slate-800 rounded-xl mb-4"></div>
              <h3 className="text-lg font-bold text-white mb-2">Payment Integration Best Practices</h3>
              <p className="text-gray-400 text-sm">Tips for integrating payment gateways securely.</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="aspect-video bg-slate-800 rounded-xl mb-4"></div>
              <h3 className="text-lg font-bold text-white mb-2">MikroTik Router Configuration Guide</h3>
              <p className="text-gray-400 text-sm">Step-by-step guide to configure your MikroTik router.</p>
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
