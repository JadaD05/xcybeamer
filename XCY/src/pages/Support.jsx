import React, { useState, useEffect } from 'react';
import { Gamepad2, Search, HelpCircle, Book, MessageSquare, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';

export default function Support() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const faqs = [
    {
      question: "How do I download and install the software?",
      answer: "After purchasing, you'll receive an email with your download link and license key. Simply download the installer, run it, and enter your license key when prompted. Our software will automatically update itself."
    },
    {
      question: "Is it safe to use? Will I get banned?",
      answer: "We use advanced anti-detection technology and regularly update our software to stay undetected. However, we cannot guarantee 100% safety as game developers continuously update their anti-cheat systems. Use at your own risk."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, cryptocurrency (Bitcoin, Ethereum), and various other payment methods through our secure payment processor."
    },
    {
      question: "Can I use the software on multiple computers?",
      answer: "Each license is tied to one computer at a time. If you need to use it on a different computer, you can reset your HWID through your account dashboard once every 7 days."
    },
    {
      question: "What if the software stops working?",
      answer: "If there's a detection or the software stops working, we typically have an update ready within 24-48 hours. You can check the status page or join our Discord for real-time updates."
    },
    {
      question: "Do you offer refunds?",
      answer: "Due to the nature of our products, we do not offer refunds. However, we provide a trial period for most products. Please read our refund policy carefully before purchasing."
    },
    {
      question: "How do I get support if I have issues?",
      answer: "You can contact us through our ticket system, join our Discord server, or email us directly. Our support team typically responds within 12-24 hours."
    }
  ];

  const quickLinks = [
    {
      icon: <Book className="w-8 h-8" />,
      title: "Installation Guides",
      description: "Detailed guides and tutorials",
      link: "/documents"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Discord Community",
      description: "Join our active community",
      link: "https://discord.gg/R95AHqwm5X"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email Support",
      description: "Get help via email",
      link: "/contact"
    },
    {
      icon: <HelpCircle className="w-8 h-8" />,
      title: "Status Page",
      description: "Check service status",
      link: "#"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-lg shadow-lg">
        <div className="w-full px-8 lg:px-16">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Gamepad2 className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-600 bg-clip-text text-transparent">
                XCY BEAMER
              </span>
            </Link>

            <div className="hidden md:flex space-x-8">
              <Link to="/" className="hover:text-blue-400 transition">Home</Link>
              <Link to="/products" className="hover:text-blue-400 transition">Products</Link>
              <Link to="/support" className="text-blue-400">Support</Link>
              <Link to="/client" className="hover:text-blue-400 transition">Client</Link>
            </div>

            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">Welcome, <span className="font-semibold text-blue-400">{user.username}</span>!</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/signin"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(147, 51, 234, 0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 bg-clip-text text-transparent">
            How Can We Help?
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Find answers to common questions or contact our support team
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.link}
                className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition group"
              >
                <div className="text-blue-500 mb-3 group-hover:scale-110 transition">
                  {link.icon}
                </div>
                <h3 className="text-lg font-bold mb-1">{link.title}</h3>
                <p className="text-sm text-gray-400">{link.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition"
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {openFaq === idx && (
                  <div className="px-6 pb-4 text-gray-300 border-t border-gray-800 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-gray-400">Try different keywords or browse all FAQs</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-gray-300 mb-6">
              Our support team is ready to assist you with any questions
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition"
            >
              Contact Support <Mail className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gamepad2 className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">XCY BEAMER</span>
          </div>
          <p className="text-gray-400 mb-4">Elevating gaming experiences worldwide</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-blue-400 transition">Terms</a>
            <a href="#" className="hover:text-blue-400 transition">Privacy</a>
            <Link to="/contact" className="hover:text-blue-400 transition">Contact</Link>
          </div>
          <p className="text-gray-500 mt-6 text-sm">© 2026 XCY BEAMER. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}