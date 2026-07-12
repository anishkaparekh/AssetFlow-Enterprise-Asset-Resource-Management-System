import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Layers, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    // Basic client validation
    if (!email || !password) {
      setValidationError('Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      const userData = await login(email, password);
      
      let targetPath = '/dashboard';
      if (userData?.role === 'Admin') {
        targetPath = '/admin/dashboard';
      } else if (userData?.role === 'Asset Manager') {
        targetPath = '/manager/dashboard';
      } else if (userData?.role === 'Department Head') {
        targetPath = '/department/dashboard';
      }
      
      const destination = location.state?.from?.pathname || targetPath;
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px] top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-secondary/10 blur-[100px] bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/20">
              <Layers size={20} />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              Asset<span className="text-brand-secondary">Flow</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm">Sign in to manage your enterprise resource database</p>
        </div>

        {/* Form Card */}
        <div className="glass p-8 rounded-2xl border border-white/5 shadow-2xl relative">
          
          <h2 className="font-display text-2xl font-bold text-white mb-6">Welcome Back</h2>

          {/* Error Display */}
          {(validationError || error) && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Demo Credentials Box */}
          <div className="mb-6 p-4 rounded-xl bg-white/2 border border-white/5 text-xs text-slate-400 leading-normal space-y-3">
            <div className="font-semibold text-white uppercase tracking-wider text-[10px]">Demo Accounts</div>
            <div className="flex justify-between items-center bg-dark-900 p-2.5 rounded-lg border border-white/5">
              <div>
                <div className="text-[10px] text-brand-secondary font-bold font-mono">ADMINISTRATOR</div>
                <div className="text-slate-300">admin@assetflow.com</div>
                <div className="text-[10px] text-slate-500 font-mono">Password: Admin@123</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@assetflow.com');
                  setPassword('Admin@123');
                }}
                className="px-2.5 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 hover:border-brand-primary/30 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer"
              >
                Autofill
              </button>
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              Employee: Register a new account
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-white/5 hover:border-white/10 focus:border-brand-primary/50 focus:bg-dark-900/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <a href="#" className="text-xs text-brand-secondary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-white/5 hover:border-white/10 focus:border-brand-primary/50 focus:bg-dark-900/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing you in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-secondary hover:underline font-medium">
            Sign up for free
          </Link>
        </p>

      </div>
    </div>
  );
}
