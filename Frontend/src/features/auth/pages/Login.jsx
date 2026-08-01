import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

const Login = () => {
  const { handleLogin } = useAuth();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth || {});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setLocalError('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setLocalError('Please fill out all required fields.');
      return;
    }

    try {
      const user = await handleLogin({
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMsg('Logged in successfully! Redirecting...');

      if (user?.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setLocalError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-[#191c1d] flex items-center justify-center p-4 sm:p-8 font-sans antialiased selection:bg-[#ff851b] selection:text-white">
      
      {/* Main Split Login Card */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 my-auto">
        
        {/* Left Side: Fashion Editorial Panel */}
        <div className="hidden lg:flex lg:col-span-6 relative min-h-[480px] bg-[#000613] overflow-hidden flex-col justify-between p-8 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{
              backgroundImage:
              "url('https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000613] via-[#000613]/50 to-transparent" />

          {/* Top Logo */}
          <div className="relative z-10">
            <span
              onClick={() => navigate('/')}
              className="text-2xl font-extrabold tracking-tight text-white cursor-pointer"
            >
              SNITCH.
            </span>
          </div>

          {/* Bottom Editorial Banner */}
          <div className="relative z-10 space-y-2 max-w-sm">
            <span className="text-[11px] font-bold text-[#ffdcc7] uppercase tracking-wider">
              CURATED ACCESS
            </span>
            <h2 className="text-3xl font-extrabold leading-tight">
              Welcome back to Luxe Market.
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in to manage orders, access seller inventory tools, and explore new apparel drops.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          
          <div className="space-y-1">
            <span
              onClick={() => navigate('/')}
              className="lg:hidden text-xl font-extrabold text-[#000613] cursor-pointer block mb-2"
            >
              SNITCH.
            </span>
            <h1 className="text-2xl font-extrabold text-[#000613] tracking-tight">Sign In</h1>
            <p className="text-xs text-slate-500">Access your account details & orders</p>
          </div>

          {/* Alerts */}
          {localError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {localError}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-600">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-slate-600">Password *</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[11px] text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#000613] hover:bg-[#001f3f] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.04.01 12s.45 3.8 1.26 5.42l4.01-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#964900] font-bold hover:underline"
            >
              Create Account
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
