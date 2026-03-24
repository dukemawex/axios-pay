// this is frontend/src/App.tsx file

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Wallet, Building2, TrendingUp, CheckCircle2, AlertCircle, Loader2, LogOut, User as UserIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('axios_token'));
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (token) {
      setView('dashboard');
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('axios_token');
    setToken(null);
    setUser(null);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-zinc-800 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowRightLeft className="text-black w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Axios Pay</span>
          </div>
          {token ? (
            <button onClick={handleLogout} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <div className="text-zinc-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Live Server
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {view === 'login' && <AuthForm type="login" setToken={setToken} setView={setView} setUser={setUser} />}
        {view === 'register' && <AuthForm type="register" setToken={setToken} setView={setView} setUser={setUser} />}
        {view === 'dashboard' && <Dashboard token={token!} />}
      </main>
    </div>
  );
}

function AuthForm({ type, setToken, setView, setUser }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
    const payload = type === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('axios_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-10 shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-emerald-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-2">{type === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
      <p className="text-zinc-400 text-center text-sm mb-8">{type === 'login' ? 'Securely access your wallets.' : 'Start moving money across borders.'}</p>
      
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'register' && (
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500" />
        )}
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500" />
        
        <button disabled={loading} className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition-colors flex items-center justify-center">
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (type === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500">
        {type === 'login' ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setView(type === 'login' ? 'register' : 'login')} className="text-emerald-400 hover:text-emerald-300 font-medium">
          {type === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ token }: { token: string }) {
  const [balances, setBalances] = useState({ NGN: 0, UGX: 0 });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [fundAmount, setFundAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const fetchBalances = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallet/balances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const newBalances = { NGN: 0, UGX: 0 };
        data.wallets.forEach((w: any) => {
          if (w.currency === 'NGN') newBalances.NGN = parseFloat(w.balance);
          if (w.currency === 'UGX') newBalances.UGX = parseFloat(w.balance);
        });
        setBalances(newBalances);
      }
    } catch (err) {
      console.error("Failed to fetch balances", err);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [token]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const executeTransaction = async (endpoint: string, payload: any, onSuccessAction: () => void) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('axios_token');
        window.location.reload();
        return;
      }
      
      if (data.success) {
        showNotification('success', data.message);
        onSuccessAction();
        fetchBalances();
      } else throw new Error(data.message);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {notification && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {notification.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="text-emerald-400" />
              <h2 className="text-lg font-medium text-zinc-300">Local Wallet (NGN)</h2>
            </div>
            <div className="text-4xl font-bold tracking-tight">₦{balances.NGN.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="text-cyan-400" />
              <h2 className="text-lg font-medium text-zinc-300">Destination (UGX)</h2>
            </div>
            <div className="text-4xl font-bold tracking-tight">USh {balances.UGX.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-zinc-500 w-5 h-5" />
              <span className="text-zinc-400 text-sm">Current Rate</span>
            </div>
            <span className="text-emerald-400 font-mono text-sm">1 NGN = 2.45 UGX</span>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-semibold mb-2">1. Fund Wallet</h3>
            <p className="text-zinc-400 text-sm mb-6">Deposit NGN via Interswitch.</p>
            <form onSubmit={(e) => { e.preventDefault(); executeTransaction('/wallet/fund', { amount: parseFloat(fundAmount), currency: 'NGN' }, () => setFundAmount('')); }} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₦</span>
                <input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="100,000" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-mono text-lg" />
              </div>
              <button disabled={loading} className="w-full bg-white text-black font-semibold rounded-xl py-4 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Deposit via Interswitch'}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
            <h3 className="text-xl font-semibold mb-2">2. Instant FX Swap</h3>
            <p className="text-zinc-400 text-sm mb-6">Convert NGN to UGX instantly.</p>
            <form onSubmit={(e) => { e.preventDefault(); executeTransaction('/wallet/swap', { amount: parseFloat(swapAmount), fromCurrency: 'NGN', toCurrency: 'UGX' }, () => setSwapAmount('')); }} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₦</span>
                <input type="number" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} placeholder="Amount to swap" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-mono text-lg" />
              </div>
              <button disabled={loading} className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-4 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><ArrowRightLeft className="w-5 h-5" /> Execute Swap</>}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">3. Disburse to Local Bank</h3>
                <p className="text-zinc-400 text-sm">Send UGX directly to a Ugandan bank account.</p>
              </div>
              <Building2 className="text-zinc-500 w-8 h-8" />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); executeTransaction('/wallet/withdraw', { amount: parseFloat(withdrawAmount), currency: 'UGX', bankCode: '044', accountNumber: '0000000000' }, () => setWithdrawAmount('')); }} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">USh</span>
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount to send" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500 transition-all font-mono" />
              </div>
              <button disabled={loading} className="w-full md:w-auto bg-zinc-800 text-white font-medium rounded-xl px-8 py-4 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Process Payout'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

