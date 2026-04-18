'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '@/app/context/ToastContext';

export default function SetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sqlRequired, setSqlRequired] = useState(false);
  const [sqlToRun, setSqlToRun] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl, supabaseKey, adminUsername, adminPassword })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.sqlRequired) {
           setSqlRequired(true);
           setSqlToRun(data.sql);
           showToast(data.message || 'SQL setup required to complete.', 'info');
        } else {
           showToast('Setup Complete! Logging into admin...', 'success');
           setLoading(false);
           document.cookie = `adminSecure=true; path=/; max-age=3600; SameSite=Strict`;
           router.push('/admin');
        }
      } else {
        throw new Error(data.error || 'Failed to setup');
      }
    } catch (e) {
      showToast('Network error during setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">First Run Setup</h1>
        <p className="text-gray-400 text-sm mb-6">Initialize your Supabase connection and create an admin account to get started.</p>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Supabase URL</label>
            <input required type="url" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-indigo-500" placeholder="https://xyz.supabase.co" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Supabase Service Key / Anon Key</label>
            <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-indigo-500" placeholder="eyJhb..." />
          </div>
          <div className="pt-4 border-t border-white/10">
            <label className="block text-sm text-gray-400 mb-1">Admin Username</label>
            <input required type="text" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Admin Password</label>
            <input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-indigo-500" />
          </div>

          {!sqlRequired ? (
            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold mt-4 disabled:opacity-50 transition-colors">
              {loading ? 'Initializing...' : 'Complete Setup'}
            </button>
          ) : (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
              <h3 className="text-yellow-400 font-bold mb-2">Supabase SQL Editor - Data Configuration Required:</h3>
              <p className="text-gray-300 text-sm mb-3">Copy the SQL code below, paste it into the &quot;SQL Editor&quot; tab in your Supabase Dashboard, and click RUN to create the data table for your website.</p>
              <textarea
                readOnly
                className="w-full h-40 bg-black text-green-400 p-3 rounded font-mono text-sm border-white/10 border"
                value={sqlToRun}
              />
              <button 
                type="button"
                onClick={() => {
                  showToast('Copied! Please come back here and click complete after running it.', 'info');
                  navigator.clipboard.writeText(sqlToRun);
               }} 
                className="mt-2 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-white font-mono"
              >
                  Copy & Wait for Database
              </button>
              <button 
                type="button"
                onClick={() => {
                   setSqlRequired(false);
                   document.cookie = `adminSecure=true; path=/; max-age=3600; SameSite=Strict`;
                   router.push('/admin');
                }}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-white font-bold"
              >
                  SQL execution complete - Enter Admin!
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}