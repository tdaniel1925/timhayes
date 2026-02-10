import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/superadmin/login`, formData);

      // Store super admin token
      localStorage.setItem('superadmin_token', response.data.access_token);
      localStorage.setItem('superadmin_refresh_token', response.data.refresh_token);
      localStorage.setItem('superadmin_user', JSON.stringify(response.data.super_admin));

      // Redirect to super admin dashboard
      navigate('/superadmin/dashboard');
    } catch (err) {
      console.error('Super admin login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A2A2A] via-[#31543A] to-[#2A2A2A] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#C89A8F] rounded-full mix-blend-multiply filter blur-[100px] opacity-15"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#31543A] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-card rounded-3xl p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#C89A8F] to-[#31543A] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-4xl font-serif text-[#31543A] mb-2">
              Super Admin Portal
            </h2>
            <p className="text-[#2A2A2A]/60 font-light">
              Platform administration access
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-[#C89A8F]/10 border border-[#C89A8F]/30 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-[#C89A8F] mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[#C89A8F] font-light">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide block mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#31543A] transition-colors"
                placeholder="superadmin@audiapro.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide block mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#31543A] transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-[#31543A] to-[#2A2A2A] rounded-full hover:from-[#2A2A2A] hover:to-[#31543A] transform hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Warning */}
          <div className="mt-6 bg-[#E4B756]/10 border border-[#E4B756]/30 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-[#E4B756] mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-[#E4B756] font-light">
                This is a restricted area. All activities are logged and monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Back to App Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white text-sm font-light transition-colors"
          >
            ← Back to AudiaPro
          </button>
        </div>
      </div>
    </div>
  );
}
