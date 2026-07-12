import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Layers, ArrowRight, Loader2, Info } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    // Client-side validations
    if (!name || !email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      // Auto redirect to dashboard on successful login/signup
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
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
          <p className="text-slate-400 text-sm">Create an account to start tracking resources</p>
        </div>

        {/* Form Card */}
        <div className="glass p-8 rounded-2xl border border-white/5 shadow-2xl relative">
          
          <h2 className="font-display text-2xl font-bold text-white mb-6">Create Account</h2>

          {/* Error Display */}
          {(validationError || error) && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-white/5 hover:border-white/10 focus:border-brand-primary/50 focus:bg-dark-900/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
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

            {/* Notice about role assignment */}
            <div className="flex gap-2 p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10 text-slate-400 text-[10px] leading-normal items-start">
              <Info size={14} className="text-brand-secondary shrink-0 mt-0.5" />
              <span>
                To maintain regulatory compliance, newly registered accounts are automatically assigned the <strong>Employee</strong> role. Request administrative upgrades from your IT Coordinator.
              </span>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-secondary hover:underline font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
