import React, { useState, useEffect } from 'react';
import { Gamepad2, Mail, MessageSquare, Send, MapPin, Clock, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';

export default function Contact() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (isAuthenticated()) {
      const currentUser = getUser();
      setUser(currentUser);
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        name: currentUser.username,
        email: currentUser.email
      }));
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // Reset form
      setFormData({
        name: user?.username || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      content: "support@xcybeamer.com",
      link: "mailto:support@xcybeamer.com"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Discord",
      content: "Join our community",
      link: "https://discord.gg/4vApxYbaDj"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Support Hours",
      content: "24/7 Available",
      link: null
    }
  ];

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
              <Link to="/status" className="hover:text-blue-400 transition">Status</Link>
              <Link to="/support" className="hover:text-blue-400 transition">Support</Link>
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
            Get In Touch
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, idx) => (
              <div
                key={idx}
                className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-center hover:border-blue-500 transition"
              >
                <div className="text-blue-500 flex justify-center mb-3">
                  {info.icon}
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-gray-400 hover:text-blue-400 transition text-sm"
                  >
                    {info.content}
                  </a>
                ) : (
                  <p className="text-gray-400 text-sm">{info.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6">
                Message sent successfully! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="How can we help?"
                  required
                />
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                  placeholder="Tell us more about your inquiry..."
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    Send Message <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
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