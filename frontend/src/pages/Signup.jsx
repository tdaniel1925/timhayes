import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    password: '',
    full_name: '',
    plan: 'starter'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signup(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#31543A] to-[#3F8A84] p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6CA8C2] rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#E4B756] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      <div className="glass-card rounded-3xl p-10 w-full max-w-md shadow-2xl relative z-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-[#31543A] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-serif italic text-white">A</span>
            </div>
            <h1 className="text-4xl font-serif text-[#31543A] mb-2">Get Started</h1>
            <p className="text-[#2A2A2A]/60 font-light">
              Create your AudiaPro account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-[#C89A8F] bg-[#C89A8F]/10 border border-[#C89A8F]/30 rounded-xl font-light">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="company_name" className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide block">
                Company Name
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="Acme Corporation"
                value={formData.company_name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#3F8A84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="full_name" className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide block">
                Your Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#3F8A84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide block">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#3F8A84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-medium text-[#2A2A2A] uppercase tracking-wide block">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={loading}
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#3F8A84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-[#2A2A2A]/50 font-light">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-[#31543A] text-white rounded-full font-medium text-base hover:bg-[#2A2A2A] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-[#2A2A2A]/60 font-light">
              Already have an account?{' '}
              <Link to="/login" className="text-[#3F8A84] hover:text-[#31543A] font-medium transition-colors border-b border-[#3F8A84]/30 hover:border-[#31543A]">
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="text-center">
            <p className="text-xs text-[#2A2A2A]/40 font-light">
              By signing up, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
