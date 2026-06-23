"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';

type Participant = {
  id: string;
  name: string;
  batch: number;
  profession: string | null;
  profession_other: string | null;
  guest_count: number;
  guest_details: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  district: string | null;
  address: string | null;
  notes: string | null;
  special_request: string | null;
  created_at: string;
};

type FormState = {
  name: string;
  batch: string;
  profession: string;
  profession_other: string;
  guest_count: string;
  guest_details: string;
  contact_phone: string;
  contact_email: string;
  district: string;
  address: string;
  notes: string;
  special_request: string;
};

type AdminState = {
  isAdmin: boolean;
  username: string | null;
  role: 'admin' | 'super_admin' | null;
  passwordResetRequired: boolean;
};

type LoginFormState = {
  username: string;
  password: string;
};

type AdminRequestFormState = {
  full_name: string;
  email: string;
  phone: string;
  reason: string;
};

const initialForm: FormState = {
  name: '',
  batch: '',
  profession: '',
  profession_other: '',
  guest_count: '0',
  guest_details: '',
  contact_phone: '',
  contact_email: '',
  district: '',
  address: '',
  notes: '',
  special_request: '',
};

const initialLoginForm: LoginFormState = {
  username: '',
  password: '',
};

const initialAdminRequestForm: AdminRequestFormState = {
  full_name: '',
  email: '',
  phone: '',
  reason: '',
};

const professions = [
  'ডক্টর',
  'ইঞ্জিনিয়ার',
  'ব্যবসায়ী',
  'শিক্ষক',
  'সরকারি চাকুরীজীবি',
  'প্রাইভেট চাকুরীজীবি',
  'ফ্রীল্যান্সার',
  'অভিনয়/সাংস্কৃতিক কর্মী',
  'অন্য',
];

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [adminState, setAdminState] = useState<AdminState>({ isAdmin: false, username: null, role: null, passwordResetRequired: false });
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [requestForm, setRequestForm] = useState<AdminRequestFormState>(initialAdminRequestForm);
  const [authMessage, setAuthMessage] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingLogout, setIsSubmittingLogout] = useState(false);
  const [showAuthPanel, setShowAuthPanel] = useState<'login' | 'request' | null>(null);
  const [managementData, setManagementData] = useState<{ requests: Array<Record<string, unknown>>; admins: Array<Record<string, unknown>> }>({ requests: [], admins: [] });
  const [managementMessage, setManagementMessage] = useState('');
  const [newAdminForm, setNewAdminForm] = useState({ username: '', password: '', role: 'admin' as 'admin' | 'super_admin' });
  const [setPasswordForm, setSetPasswordForm] = useState({ password: '', confirm: '' });
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const loadParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (Array.isArray(data)) {
        setParticipants(data);
      } else {
        console.error('Unexpected participants response:', data);
        setParticipants([]);
      }
    } catch {
      setParticipants([]);
    }
  };

  const loadAdminStatus = async () => {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      setAdminState({ isAdmin: Boolean(data.isAdmin), username: data.username ?? null, role: data.role ?? null, passwordResetRequired: Boolean(data.passwordResetRequired) });

    } catch {
      setAdminState({ isAdmin: false, username: null, role: null, passwordResetRequired: false });
    }
  };

  useEffect(() => {
    void loadParticipants();
    void loadAdminStatus();
  }, []);

  useEffect(() => {
    if (adminState.isAdmin && adminState.role === 'super_admin') {
      void loadManagementData();
    }
  }, [adminState.isAdmin, adminState.role]);

  const filteredParticipants = useMemo(() => {
    const term = search.toLowerCase();
    return participants.filter((item) => {
      const haystack = `${item.name} ${item.batch} ${item.profession || ''} ${item.profession_other || ''} ${item.district || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [participants, search]);

  const totalGuests = participants.reduce((sum, item) => sum + Number(item.guest_count || 0), 0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (editingId && !adminState.isAdmin) {
      setMessage('এডিট করতে অ্যাডমিন লগইন করুন।');
      setIsLoading(false);
      return;
    }

    const payload = {
      ...form,
      batch: Number(form.batch),
      guest_count: Number(form.guest_count),
    };

    try {
      const url = editingId ? `/api/participants/${editingId}` : '/api/participants';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save participant');
      }

      setForm(initialForm);
      setEditingId(null);
      setMessage(editingId ? 'সফলভাবে আপডেট করা হয়েছে।' : 'সফলভাবে রেজিস্ট্রেশন সম্পন্ন হয়েছে।');
      await loadParticipants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'দুঃখিত, তথ্য সংরক্ষণ করা যায়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (participant: Participant) => {
    if (!adminState.isAdmin) {
      setMessage('এডিট করতে অ্যাডমিন লগইন করুন।');
      return;
    }

    setEditingId(participant.id);
    setForm({
      name: participant.name,
      batch: String(participant.batch),
      profession: participant.profession || '',
      profession_other: participant.profession_other || '',
      guest_count: String(participant.guest_count || 0),
      guest_details: participant.guest_details || '',
      contact_phone: participant.contact_phone || '',
      contact_email: participant.contact_email || '',
      district: participant.district || '',
      address: participant.address || '',
      notes: participant.notes || '',
      special_request: participant.special_request || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!adminState.isAdmin) {
      setMessage('ডিলিট করতে অ্যাডমিন লগইন করুন।');
      return;
    }

    const confirmed = window.confirm('আপনি কি নিশ্চিতভাবে মুছতে চান?');
    if (!confirmed) return;

    const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setMessage('তথ্য সফলভাবে মুছে ফেলা হয়েছে।');
      await loadParticipants();
    } else {
      setMessage(data.error || 'ডিলিট করা যায়নি।');
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmittingLogin(true);
    setAuthMessage('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'লগইন হয়নি।');
      }

      setAuthMessage('লগইন সফল হয়েছে।');
      setLoginForm(initialLoginForm);
      await loadAdminStatus();
      setTimeout(() => setShowAuthPanel(null), 800);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'লগইন হয়নি।');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleAdminRequest = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmittingRequest(true);
    setAuthMessage('');

    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'অনুরোধ জমা হয়নি।');
      }

      setAuthMessage('অ্যাডমিন অনুরোধ জমা হয়েছে। আপনি প্রয়োজন হলে ডাটাবেসে অ্যাডমিন তৈরি করবেন।');
      setRequestForm(initialAdminRequestForm);
      setTimeout(() => setShowAuthPanel(null), 1200);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'অনুরোধ জমা হয়নি।');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmittingLogout(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAdminState({ isAdmin: false, username: null, role: null, passwordResetRequired: false });
      setAuthMessage('লগআউট হয়েছে।');
    } finally {
      setIsSubmittingLogout(false);
    }
  };

  const exportExcel = () => {
    window.location.href = '/api/participants/export';
  };

  const loadManagementData = async () => {
    if (!adminState.isAdmin || adminState.role !== 'super_admin') return;

    try {
      const res = await fetch('/api/admin/manage');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setManagementData({ requests: data.requests || [], admins: data.admins || [] });
      }
    } catch {
      setManagementData({ requests: [], admins: [] });
    }
  };

  const handleRequestDecision = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'অপারেশন ব্যর্থ হয়েছে।');
      setManagementMessage('অনুরোধ আপডেট করা হয়েছে।');
      await loadManagementData();
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : 'অপারেশন ব্যর্থ হয়েছে।');
    }
  };

  const handleCreateAdmin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_admin', ...newAdminForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'অ্যাডমিন তৈরি করা যায়নি।');
      setManagementMessage('অ্যাডমিন তৈরি করা হয়েছে।');
      setNewAdminForm({ username: '', password: '', role: 'admin' });
      await loadManagementData();
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : 'অ্যাডমিন তৈরি করা যায়নি।');
    }
  };

  const handleAdminToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_admin', targetId: id, isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'স্ট্যাটাস আপডেট করা যায়নি।');
      setManagementMessage('অ্যাডমিন স্ট্যাটাস আপডেট করা হয়েছে।');
      await loadManagementData();
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : 'স্ট্যাটাস আপডেট করা যায়নি।');
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (!window.confirm('এই অ্যাডমিন মুছে দিতে চান?')) return;
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_admin', targetId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'অ্যাডমিন মুছে ফেলা যায়নি।');
      setManagementMessage('অ্যাডমিন মুছে ফেলা হয়েছে।');
      await loadManagementData();
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : 'অ্যাডমিন মুছে ফেলা যায়নি।');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm('এই অ্যাডমিনের পাসওয়ার্ড রিসেট করতে চান? পরবর্তী লগইনে তাকে নতুন পাসওয়ার্ড সেট করতে হবে।')) return;
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', targetId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'পাসওয়ার্ড রিসেট করা যায়নি।');
      setManagementMessage('পাসওয়ার্ড রিসেট করা হয়েছে।');
      await loadManagementData();
    } catch (error) {
      setManagementMessage(error instanceof Error ? error.message : 'পাসওয়ার্ড রিসেট করা যায়নি।');
    }
  };

  const handleSetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage('');

    if (!setPasswordForm.password || setPasswordForm.password.length < 4) {
      setPasswordMessage('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (setPasswordForm.password !== setPasswordForm.confirm) {
      setPasswordMessage('পাসওয়ার্ড মিলছে না।');
      return;
    }

    setIsSettingPassword(true);
    try {
      const res = await fetch('/api/admin/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: setPasswordForm.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'পাসওয়ার্ড সেট করা যায়নি।');
      setAdminState(prev => ({ ...prev, passwordResetRequired: false }));
      setSetPasswordForm({ password: '', confirm: '' });
      setPasswordMessage('পাসওয়ার্ড সফলভাবে সেট করা হয়েছে।');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'পাসওয়ার্ড সেট করা যায়নি।');
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-6">
              <img src="/kalaia_high_reunion_2026.png" alt="কালাইয়া মাধ্যমিক বিদ্যালয় পুনর্মিলনী ২০২৬" className="h-24 w-24 shrink-0 self-center rounded-2xl border border-slate-700 object-cover" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">কালাইয়া মাধ্যমিক বিদ্যালয়</p>
                <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">প্রাক্তন শিক্ষার্থী পুনর্মিলনী অনুষ্ঠান-২০২৬</h1>
                <p className="mt-3 text-lg font-medium italic text-amber-300/80">একসাথে স্মৃতি, একসাথে ভবিষ্যৎ</p>
                <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
                  এই পৃষ্ঠায় অংশগ্রহণকারীরা নিজেদের তথ্য রেজিস্ট্রেশন করতে পারবেন, এবং রিইউনিয়ন কমিটি সহজে তালিকা অনুসন্ধান, আপডেট ও এক্সেল ডাউনলোড করতে পারবেন।
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setShowAuthPanel('login')} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                অ্যাডমিন লগইন
              </button>
              <button onClick={() => setShowAuthPanel('request')} className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/10">
                অ্যাডমিন হওয়ার অনুরোধ
              </button>
            </div>
          </div>
        </header>

        {adminState.isAdmin ? (
          <section className="rounded-3xl border border-emerald-700/40 bg-emerald-950/20 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">অ্যাডমিন</p>
                <p className="mt-1 text-sm text-emerald-300">লগইন করা আছে — {adminState.username} ({adminState.role === 'super_admin' ? 'Super Admin' : 'Admin'})</p>
              </div>
              <button onClick={handleLogout} disabled={isSubmittingLogout} className="rounded-xl border border-rose-700/50 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-950/30 disabled:opacity-60">
                {isSubmittingLogout ? 'লগআউট হচ্ছে...' : 'লগআউট'}
              </button>
            </div>
          </section>
        ) : null}

        {adminState.isAdmin && adminState.passwordResetRequired ? (
          <section className="rounded-3xl border border-amber-700/50 bg-amber-950/20 p-6 shadow-xl shadow-black/10">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">পাসওয়ার্ড সেটআপ</p>
              <h2 className="mt-2 text-xl font-semibold">আপনার পাসওয়ার্ড সেট করুন</h2>
              <p className="mt-2 text-sm text-slate-400">আপনার অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড সেট করুন। পাসওয়ার্ড সেট করার আগে অন্যান্য ফিচার ব্যবহার করা যাবে না।</p>
              <form onSubmit={handleSetPassword} className="mt-6">
                <div className="space-y-4">
                  <label className="block text-sm text-slate-300">
                    নতুন পাসওয়ার্ড
                    <input type="password" value={setPasswordForm.password} onChange={(e) => setSetPasswordForm({ ...setPasswordForm, password: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" minLength={4} placeholder="কমপক্ষে ৪ অক্ষর" />
                  </label>
                  <label className="block text-sm text-slate-300">
                    পাসওয়ার্ড নিশ্চিত করুন
                    <input type="password" value={setPasswordForm.confirm} onChange={(e) => setSetPasswordForm({ ...setPasswordForm, confirm: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" minLength={4} />
                  </label>
                </div>
                {passwordMessage ? <p className="mt-4 text-sm text-amber-400">{passwordMessage}</p> : null}
                <button type="submit" disabled={isSettingPassword} className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60">
                  {isSettingPassword ? 'সেট করা হচ্ছে...' : 'পাসওয়ার্ড সেট করুন'}
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {showAuthPanel ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowAuthPanel(null); setAuthMessage(''); }}>
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
              {showAuthPanel === 'login' ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">অ্যাডমিন লগইন</h2>
                    <button onClick={() => { setShowAuthPanel(null); setAuthMessage(''); }} className="rounded-xl border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-slate-200">
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleLogin} className="mt-6">
                    <div className="space-y-4">
                      <label className="block text-sm text-slate-300">
                        ইউজারনেম / ইমেইল
                        <input value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        পাসওয়ার্ড
                        <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" placeholder="নতুন অনুমোদিত অ্যাডমিন হলে খালি রাখুন" />
                      </label>
                    </div>
                    <p className="mt-3 text-xs text-amber-400/70">নতুন অনুমোদিত অ্যাডমিন বা পাসওয়ার্ড রিসেট করা অ্যাকাউন্ট: পাসওয়ার্ড খালি রেখে শুধু ইউজারনেম দিয়ে লগইন করুন। পরবর্তী পৃষ্ঠায় আপনি নিজের পাসওয়ার্ড সেট করতে পারবেন।</p>
                    {authMessage ? <p className="mt-4 text-sm text-amber-400">{authMessage}</p> : null}
                    <button type="submit" disabled={isSubmittingLogin} className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60">
                      {isSubmittingLogin ? 'লগইন হচ্ছে...' : 'লগইন'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">অ্যাডমিন হওয়ার অনুরোধ</h2>
                    <button onClick={() => { setShowAuthPanel(null); setAuthMessage(''); }} className="rounded-xl border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-slate-200">
                      ✕
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">আপনি চাইলে অনুরোধ জমা করতে পারেন। ডেভেলপার ডাটাবেসে অ্যাডমিন তৈরি করলে আপনার access দেওয়া হবে।</p>
                  <form onSubmit={handleAdminRequest} className="mt-4">
                    <div className="space-y-3">
                      <label className="block text-sm text-slate-300">
                        পুরো নাম
                        <input value={requestForm.full_name} onChange={(e) => setRequestForm({ ...requestForm, full_name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        ইমেইল
                        <input type="email" value={requestForm.email} onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        ফোন
                        <input value={requestForm.phone} onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        কারণ
                        <textarea value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
                      </label>
                    </div>
                    {authMessage ? <p className="mt-4 text-sm text-amber-400">{authMessage}</p> : null}
                    <button type="submit" disabled={isSubmittingRequest} className="mt-6 w-full rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-60">
                      {isSubmittingRequest ? 'জমা হচ্ছে...' : 'অনুরোধ পাঠান'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">মোট অংশগ্রহণকারী</p>
            <p className="mt-2 text-3xl font-semibold">{participants.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">মোট অতিথি</p>
            <p className="mt-2 text-3xl font-semibold">{totalGuests}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">অনুসন্ধান</p>
            <p className="mt-2 text-3xl font-semibold">{filteredParticipants.length}</p>
          </div>
        </section>

        {adminState.isAdmin && adminState.role === 'super_admin' && !adminState.passwordResetRequired ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">সুপার-অ্যাডমিন প্যানেল</p>
                <h2 className="mt-2 text-xl font-semibold">অ্যাডমিন অনুরোধ ও অ্যাকাউন্ট ব্যবস্থাপনা</h2>
              </div>
            </div>
            {managementMessage ? <p className="mt-4 text-sm text-amber-400">{managementMessage}</p> : null}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="text-lg font-semibold">অ্যাডমিন অনুরোধ</h3>
                <div className="mt-4 space-y-3">
                  {managementData.requests.length === 0 ? (
                    <p className="text-sm text-slate-400">কোন pending request নেই।</p>
                  ) : managementData.requests.map((request) => (
                    <div key={String(request.id)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{String(request.full_name)}</p>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{String(request.status)}</span>
                      </div>
                      <p className="mt-2 text-slate-400">{String(request.email || '—')}</p>
                      <p className="mt-1 text-slate-400">{String(request.reason || '—')}</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleRequestDecision(String(request.id), 'approve')} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs">Approve</button>
                        <button onClick={() => handleRequestDecision(String(request.id), 'reject')} className="rounded-lg bg-rose-700 px-3 py-1 text-xs">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <form onSubmit={handleCreateAdmin} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-lg font-semibold">নতুন অ্যাডমিন তৈরি করুন</h3>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm text-slate-300">
                      ইউজারনেম
                      <input value={newAdminForm.username} onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      পাসওয়ার্ড
                      <input type="password" value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      রোল
                      <select value={newAdminForm.role} onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value as 'admin' | 'super_admin' })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </label>
                  </div>
                  <button className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">তৈরি করুন</button>
                </form>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-lg font-semibold">অ্যাডমিন তালিকা</h3>
                  <div className="mt-4 space-y-3">
                    {managementData.admins.length === 0 ? (
                      <p className="text-sm text-slate-400">কোন অ্যাডমিন নেই।</p>
                    ) : managementData.admins.map((admin) => (
                      <div key={String(admin.id)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{String(admin.username)}</p>
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{String(admin.role)}{admin.password_reset_required ? ' · Reset Pending' : ''}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={() => handleAdminToggle(String(admin.id), !(admin.is_active === true))} className="rounded-lg bg-slate-800 px-3 py-1 text-xs">{admin.is_active ? 'Deactivate' : 'Activate'}</button>
                          <button onClick={() => handleResetPassword(String(admin.id))} className="rounded-lg bg-amber-600 px-3 py-1 text-xs">Reset Password</button>
                          <button onClick={() => handleAdminDelete(String(admin.id))} className="rounded-lg bg-rose-700 px-3 py-1 text-xs">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingId ? 'তথ্য আপডেট করুন' : 'নতুন রেজিস্ট্রেশন'}</h2>
              <button type="button" onClick={() => { setForm(initialForm); setEditingId(null); }} className="text-sm text-amber-400">রিসেট</button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                নাম<sup className="text-amber-400">*</sup>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ব্যাচ (SSC পাসের সাল)
                <input required type="number" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                পেশা
                <select value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                  <option value="">—</option>
                  {professions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                অন্যান্য পেশা
                <input value={form.profession_other} onChange={(e) => setForm({ ...form, profession_other: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                অতিথি সংখ্যা
                <input type="number" min="0" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                অতিথির বিবরণ
                <input value={form.guest_details} onChange={(e) => setForm({ ...form, guest_details: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ফোন নম্বর
                <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ইমেইল
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                জেলা
                <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ঠিকানা
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300 md:col-span-2">
                নোট
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300 md:col-span-2">
                বিশেষ অনুরোধ
                <textarea value={form.special_request} onChange={(e) => setForm({ ...form, special_request: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button disabled={isLoading} className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60">
                {isLoading ? 'সেভ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'রেজিস্টার করুন'}
              </button>
              <button type="button" onClick={exportExcel} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200">এক্সেল ডাউনলোড</button>
            </div>
            {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
          </form>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">অংশগ্রহণকারীদের তালিকা</h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, ব্যাচ, পেশা, জেলা" className="w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 max-h-[720px] overflow-auto rounded-2xl border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/90 text-left text-slate-300">
                  <tr>
                    <th className="px-3 py-3">নাম</th>
                    <th className="px-3 py-3">ব্যাচ</th>
                    <th className="px-3 py-3">পেশা</th>
                    <th className="px-3 py-3">অতিথি</th>
                    <th className="px-3 py-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="font-semibold">{participant.name}</div>
                        <div className="text-xs text-slate-400">{participant.contact_phone || '—'}</div>
                      </td>
                      <td className="px-3 py-3">{participant.batch}</td>
                      <td className="px-3 py-3">{participant.profession || participant.profession_other || '—'}</td>
                      <td className="px-3 py-3">{participant.guest_count}</td>
                      <td className="px-3 py-3">
                        {adminState.isAdmin ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(participant)} className="rounded-lg bg-slate-800 px-2 py-1 text-xs">এডিট</button>
                            <button onClick={() => handleDelete(participant.id)} className="rounded-lg bg-rose-700 px-2 py-1 text-xs">ডিলিট</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">অ্যাডমিন লগইন প্রয়োজন</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
