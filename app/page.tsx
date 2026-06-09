'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  Activity, 
  Trash2, 
  Moon, 
  LogOut, 
  CloudRain, 
  Flame, 
  Droplet, 
  Mic,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HabitOasis from './components/HabitOasis';
import IndustrialWaste from './components/IndustrialWaste';
import UploadModal from './components/UploadModal';
import ActionGrid from './components/ActionGrid';
import TelemetryPanel, { TelemetryData } from './components/TelemetryPanel';

// Physics-based rolling odometer digit
function Odometer({ value }: { value: number }) {
  const digits = value.toFixed(1).split('');
  return (
    <span className="inline-flex overflow-hidden h-8 items-center text-2xl font-extrabold text-zinc-100 font-mono">
      {digits.map((digit, i) => {
        if (digit === '.') {
          return <span key={i} className="px-0.5">.</span>;
        }
        const parsedDigit = parseInt(digit);
        if (isNaN(parsedDigit)) {
          return <span key={i}>{digit}</span>;
        }
        return (
          <span key={i} className="relative h-8 w-[14px] overflow-hidden inline-block text-center">
            <motion.span
              className="absolute left-0 right-0 flex flex-col"
              initial={{ y: 0 }}
              animate={{ y: -parsedDigit * 32 }}
              transition={{ type: "spring", stiffness: 90, damping: 14 }}
              style={{ height: '320px', lineHeight: '32px' }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span key={num} className="h-8 block text-center select-none">{num}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [habitState, setHabitState] = useState<any>({ habitStrength: 5, history: [] });
  const [metrics, setMetrics] = useState<any>({ totalEmissions: 0, categoryEmissions: {} });
  const [loading, setLoading] = useState(true);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    lastLatencyMs: null,
    totalPromptTokens: 0,
    totalOutputTokens: 0,
    flashCallsCount: 0,
    proCallsCount: 0,
    totalRequestsCount: 0
  });

  // Load session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cf_token');
    const savedUser = localStorage.getItem('cf_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else {
      setLoading(false);
    }

    // Load telemetry
    const savedTelemetry = localStorage.getItem('cf_telemetry');
    if (savedTelemetry) {
      try {
        setTelemetry(JSON.parse(savedTelemetry));
      } catch (err) {
        console.error('Failed to parse telemetry', err);
      }
    }
  }, []);

  // Fetch history when token changes
  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setHabitState(data.habitState || { habitStrength: 5, history: [] });
        setMetrics(data.metrics || { totalEmissions: 0, categoryEmissions: {} });
      } else {
        // Token expired/invalid
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!usernameInput.trim()) return;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          action: isRegistering ? 'register' : 'login'
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('cf_token', data.token);
        localStorage.setItem('cf_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setAuthError('Server connection issue');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    localStorage.removeItem('cf_telemetry');
    setToken(null);
    setUser(null);
    setLogs([]);
    setHabitState({ habitStrength: 5, history: [] });
    setTelemetry({
      lastLatencyMs: null,
      totalPromptTokens: 0,
      totalOutputTokens: 0,
      flashCallsCount: 0,
      proCallsCount: 0,
      totalRequestsCount: 0
    });
  };

  const handleSimulateOmission = async () => {
    if (!token) return;
    setStatusMessage('Simulating omission (missed tracking cycle)...');
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'omission' })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`MDP transition complete! Reward: ${data.mdp.reward} points. Habit Strength: ${data.mdp.currentStrength}/10`);
        fetchHistory();
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setStatusMessage('Simulate request failed');
    }
  };

  const handleUploadSuccess = (result: any, latencyMs: number) => {
    const points = result.mdp?.reward > 0 ? `+${result.mdp.reward}` : result.mdp?.reward;
    setStatusMessage(
      `AI Extraction complete! Extracted ${result.co2EmissionsKg} kg CO2 emission. MDP Reward: ${points} points.`
    );

    setTelemetry(prev => {
      const isPro = result.modelUsed === 'gemini-2.5-pro';
      const updated = {
        lastLatencyMs: latencyMs,
        totalPromptTokens: prev.totalPromptTokens + (result.tokenUsage?.promptTokens || 0),
        totalOutputTokens: prev.totalOutputTokens + (result.tokenUsage?.candidatesTokens || 0),
        flashCallsCount: prev.flashCallsCount + (isPro ? 0 : 1),
        proCallsCount: prev.proCallsCount + (isPro ? 1 : 0),
        totalRequestsCount: prev.totalRequestsCount + 1
      };
      localStorage.setItem('cf_telemetry', JSON.stringify(updated));
      return updated;
    });

    fetchHistory();
  };

  const handleActionLogged = (result: any, latencyMs: number) => {
    setTelemetry(prev => {
      const updated = {
        ...prev,
        lastLatencyMs: latencyMs,
        totalRequestsCount: prev.totalRequestsCount + 1
      };
      localStorage.setItem('cf_telemetry', JSON.stringify(updated));
      return updated;
    });
    fetchHistory();
  };

  // Determine current active theme
  const habitStrength = habitState.habitStrength ?? 5;
  const isOasis = habitStrength >= 5;
  const themeClass = isOasis ? 'theme-oasis' : 'theme-industrial';

  if (loading && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Synchronizing...</span>
        </div>
      </div>
    );
  }

  // Auth Screen if not logged in
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans relative">
        <div className="absolute inset-0 cyber-grid-oasis opacity-10" />
        
        <motion.div 
          className="w-full max-w-md glass-panel border border-zinc-800 bg-zinc-900/60 p-8 rounded-2xl relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-center text-zinc-100 tracking-tight">Carbon-Flow</h2>
          <p className="text-xs text-center text-zinc-500 mt-1 mb-8">Autonomous Sustainability Gamification Platform</p>

          {authError && (
            <div className="mb-4 px-3 py-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Agent Username</label>
              <input 
                type="text" 
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Enter pilot username"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500/60 text-zinc-100 text-sm focus:outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 rounded-lg text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              {isRegistering ? 'Register Carbon Agent' : 'Authorize Credentials'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              {isRegistering ? 'Already registered? Log in' : 'First time? Initialize new profile'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative pb-16 ${themeClass}`}>
      {/* Background and grid pattern */}
      <div className="absolute inset-0 bg-transition duration-1000" style={{ background: 'var(--background)' }} />
      <div className={`absolute inset-0 bg-transition duration-1000 ${isOasis ? 'cyber-grid-oasis' : 'cyber-grid-ind'}`} />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/20 bg-zinc-950/30 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-widest text-zinc-100 uppercase">Carbon-Flow</h1>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Pilot Node: {user.username}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Node</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Habit Core display (12 cols mobile, 5 cols lg) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-4 rounded-2xl flex flex-col gap-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Decarbonization Engine</span>
            </h2>
            
            {isOasis ? (
              <HabitOasis strength={habitStrength} />
            ) : (
              <IndustrialWaste strength={habitStrength} />
            )}

            {/* Quick Status Message Bar */}
            {statusMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2.5 rounded-lg text-[10px] font-mono border ${
                  isOasis ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-orange-950/20 border-orange-500/20 text-orange-400'
                }`}
              >
                &gt; {statusMessage}
              </motion.div>
            )}
          </div>

          <TelemetryPanel telemetry={telemetry} />
        </div>

        {/* Right Column: Actions and Metrics (12 cols mobile, 7 cols lg) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Action Row */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Command Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Process Upload */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className="group p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/5 hover:bg-emerald-950/15 hover:border-emerald-400 transition-all duration-300 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-1">Upload Bill/Memo</h4>
                  <p className="text-[10px] text-zinc-400">Ingest via Gemini multimodal pipeline</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-400 text-zinc-950 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" />
                </div>
              </button>

              {/* Simulate Omission */}
              <button
                onClick={handleSimulateOmission}
                className="group p-4 rounded-xl border border-orange-500/20 bg-orange-950/5 hover:bg-orange-950/15 hover:border-orange-400 transition-all duration-300 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-1">Simulate Omission</h4>
                  <p className="text-[10px] text-zinc-400">Trigger MDP state decay & UI glitch</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-zinc-950 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          <ActionGrid
            currentHabitStrength={habitStrength}
            token={token}
            onActionLogged={handleActionLogged}
            statusMessageSetter={setStatusMessage}
          />

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            {/* Total Emissions card */}
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Total CO2 Logged</span>
              <div className="mt-2 flex items-baseline">
                <Odometer value={metrics.totalEmissions || 0} />
                <span className="text-[10px] font-bold text-zinc-400 ml-1">kg</span>
              </div>
            </div>

            {/* Habit Strength card */}
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Habit Level</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-2xl font-extrabold ${isOasis ? 'text-emerald-400' : 'text-orange-500'}`}>
                  {habitStrength}
                </span>
                <span className="text-[10px] text-zinc-500">/ 10</span>
              </div>
            </div>

            {/* Ingest Counts card */}
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Log Count</span>
              <div className="mt-2">
                <span className="text-2xl font-extrabold text-zinc-100">{metrics.logCount || 0}</span>
                <span className="text-[10px] font-bold text-zinc-500 ml-1">entries</span>
              </div>
            </div>
          </div>

          {/* Sector Breakdowns */}
          <div className="glass-panel p-4 rounded-xl">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Emissions by Utility Sector</span>
            <div className="space-y-3">
              {Object.entries({
                electricity: { label: 'Electricity', icon: Sparkles, color: 'text-yellow-400' },
                gas: { label: 'Natural Gas', icon: Flame, color: 'text-orange-400' },
                water: { label: 'Water Resources', icon: Droplet, color: 'text-cyan-400' },
                voice_log: { label: 'Voice Actions', icon: Mic, color: 'text-emerald-400' }
              }).map(([key, details]) => {
                const amount = metrics.categoryEmissions?.[key] || 0;
                const percent = metrics.totalEmissions > 0 ? (amount / metrics.totalEmissions) * 100 : 0;
                const Icon = details.icon;

                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Icon className={`w-3.5 h-3.5 ${details.color}`} />
                      <span>{details.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="font-bold text-zinc-200 w-12 text-right">{amount.toFixed(1)} kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* History Log Table */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 mt-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Ingestion Registry Log</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2.5 font-bold uppercase tracking-wider">Date</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Type</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Details / Utility</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Usage</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider">Region</th>
                  <th className="py-2.5 font-bold uppercase tracking-wider text-right">CO₂ Equivalent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono">
                      &gt; No active records detected in registry.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                      <td className="py-3 font-mono">{new Date(log.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'electricity' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/10' :
                          log.type === 'gas' ? 'bg-orange-950/40 text-orange-400 border border-orange-500/10' :
                          log.type === 'water' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10' :
                          'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 max-w-[200px] truncate">
                        {log.billDetails?.utilityCompany || 'N/A'}
                      </td>
                      <td className="py-3 font-mono">
                        {log.billDetails?.consumption?.toFixed(1) || '0'} {log.billDetails?.units || ''}
                      </td>
                      <td className="py-3 uppercase font-mono">{log.billDetails?.state || 'US'}</td>
                      <td className="py-3 text-right font-bold text-zinc-100">{log.co2EmissionsKg?.toFixed(2)} kg</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Upload Modal Portal */}
      <AnimatePresence>
        {isUploadOpen && (
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            token={token}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
