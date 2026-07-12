import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Activity, Cpu, Layers, BarChart3, Database } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-950 bg-mesh overflow-x-hidden relative">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-secondary/10 blur-[130px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '-3s' }}></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/20">
              <Layers size={20} className="animate-pulse" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Asset<span className="text-brand-secondary">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-all rounded-xl hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="px-5 py-2.5 text-sm font-medium bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Glow Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-accent text-xs font-semibold text-brand-secondary mb-8 border border-brand-secondary/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <span className="w-2 h-2 rounded-full bg-brand-secondary animate-ping"></span>
          Hackathon Edition v1.0 Release
        </div>

        {/* Hero Text */}
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-none text-white mb-6">
          Enterprise Asset & <br />
          <span className="bg-gradient-to-r from-brand-primary via-indigo-400 to-brand-secondary bg-clip-text text-transparent">
            Resource Management
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
          Optimize lifecycle tracking, automate department assignments, and gain real-time visibility into resource utilization. Designed to scale with the modern agile enterprise.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 z-10">
          <Link
            to="/signup"
            className="group px-8 py-4 font-semibold bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primary/95 hover:to-indigo-600/95 text-white rounded-xl shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            Start Free Account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 font-semibold glass hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 flex items-center justify-center"
          >
            Schedule a Demo
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-24 z-10">
          <div className="glass p-8 rounded-2xl border border-white/5 hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 text-left group">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
              <Cpu size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Automated Tracking</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track hardware specifications, lease agreements, and warranty status automatically across multiple locations.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-white/5 hover:border-brand-secondary/30 hover:-translate-y-1 transition-all duration-300 text-left group">
            <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Audit Compliance</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate department assignment records, logs, and cost reports instantly for compliance verification.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-white/5 hover:border-brand-accent/30 hover:-translate-y-1 transition-all duration-300 text-left group">
            <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Real-time Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Analyze asset utilization levels, calculate depreciation rates, and optimize your overall hardware spending.
            </p>
          </div>
        </div>

        {/* Dashboard Mockup (Visual Highlight) */}
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl shadow-brand-primary/5 border border-white/10 glass p-3 relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/20 to-dark-950 pointer-events-none z-10"></div>
          
          {/* Top Panel Buttons */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-white/5">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
            </div>
            <div className="h-5 px-6 rounded-md bg-white/5 text-[10px] text-slate-400 flex items-center border border-white/5">
              https://app.assetflow.enterprise/dashboard
            </div>
            <div className="w-4"></div>
          </div>

          {/* Fake Dashboard Content */}
          <div className="bg-dark-950/90 rounded-xl overflow-hidden p-6 grid grid-cols-12 gap-5 text-left text-xs text-slate-300 select-none">
            
            {/* Sidebar */}
            <div className="col-span-3 border-r border-white/5 pr-4 hidden md:block">
              <div className="font-semibold text-slate-400 uppercase tracking-wider mb-4 text-[10px]">Navigation</div>
              <div className="space-y-2">
                <div className="p-2 bg-white/5 rounded-lg text-white font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span> Dashboard
                </div>
                <div className="p-2 hover:bg-white/5 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span> Assets Registry
                </div>
                <div className="p-2 hover:bg-white/5 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span> Department Allocation
                </div>
                <div className="p-2 hover:bg-white/5 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span> Maintenance Logs
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="col-span-12 md:col-span-9 space-y-5">
              {/* Stat Boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400">Total Assets</div>
                  <div className="text-lg font-bold text-white mt-1">1,248</div>
                  <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="text-[7px]">▲</span> +4.5% this month
                  </div>
                </div>
                <div className="glass p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400">Assigned Assets</div>
                  <div className="text-lg font-bold text-white mt-1">942</div>
                  <div className="text-[9px] text-slate-400 mt-1">75.4% Utilization</div>
                </div>
                <div className="glass p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400">Compliance Rate</div>
                  <div className="text-lg font-bold text-white mt-1">99.8%</div>
                  <div className="text-[9px] text-brand-secondary mt-1 flex items-center gap-1">
                    <span className="text-[7px]">●</span> Fully Certified
                  </div>
                </div>
              </div>

              {/* Table / Details */}
              <div className="glass rounded-xl border border-white/5 p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-white">Recent Hardware Allocations</div>
                  <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px]">Live Data</span>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-12 p-2 bg-white/5 rounded-lg items-center text-[10px] font-medium border border-white/5">
                    <div className="col-span-4 text-white">MacBook Pro 16" M3 Max</div>
                    <div className="col-span-3 text-slate-400">Engineering</div>
                    <div className="col-span-3 text-brand-secondary font-mono">192.168.1.45</div>
                    <div className="col-span-2 text-right text-emerald-400">Active</div>
                  </div>
                  <div className="grid grid-cols-12 p-2 rounded-lg items-center text-[10px] hover:bg-white/5 transition-colors">
                    <div className="col-span-4 text-white">Dell XPS 15 9530</div>
                    <div className="col-span-3 text-slate-400">Design</div>
                    <div className="col-span-3 text-brand-secondary font-mono">192.168.1.88</div>
                    <div className="col-span-2 text-right text-emerald-400">Active</div>
                  </div>
                  <div className="grid grid-cols-12 p-2 rounded-lg items-center text-[10px] hover:bg-white/5 transition-colors">
                    <div className="col-span-4 text-white">iPad Pro M2 12.9"</div>
                    <div className="col-span-3 text-slate-400">Product Management</div>
                    <div className="col-span-3 text-brand-secondary font-mono">192.168.2.12</div>
                    <div className="col-span-2 text-right text-yellow-400">In Maintenance</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 relative z-10 glass">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Asset<span className="text-brand-secondary">Flow</span>
            </span>
            <span className="text-slate-500 text-xs">© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
