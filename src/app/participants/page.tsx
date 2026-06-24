"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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

type SortField = 'name' | 'batch' | 'profession' | 'guest_count' | 'district' | 'created_at';

type AdminState = {
  isAdmin: boolean;
  username: string | null;
  role: 'admin' | 'super_admin' | null;
  passwordResetRequired: boolean;
};

type EditFormState = {
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

const initialEditForm: EditFormState = {
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

function SortIcon({ field, currentField, dir }: { field: SortField; currentField: SortField; dir: 'asc' | 'desc' }) {
  if (field !== currentField) {
    return <span className="ml-1 text-slate-600">&#8597;</span>;
  }
  return <span className="ml-1 text-amber-400">{dir === 'asc' ? '▲' : '▼'}</span>;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('batch');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [adminState, setAdminState] = useState<AdminState>({ isAdmin: false, username: null, role: null, passwordResetRequired: false });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (Array.isArray(data)) {
        setParticipants(data);
      } else {
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
      setAdminState({
        isAdmin: Boolean(data.isAdmin),
        username: data.username ?? null,
        role: data.role ?? null,
        passwordResetRequired: Boolean(data.passwordResetRequired),
      });
    } catch {
      setAdminState({ isAdmin: false, username: null, role: null, passwordResetRequired: false });
    }
  };

  useEffect(() => {
    void loadParticipants();
    void loadAdminStatus();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedParticipants = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = participants.filter((item) => {
      const haystack = `${item.name} ${item.batch} ${item.profession || ''} ${item.profession_other || ''} ${item.district || ''}`.toLowerCase();
      return haystack.includes(term);
    });

    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'batch':
          aVal = a.batch;
          bVal = b.batch;
          break;
        case 'guest_count':
          aVal = a.guest_count;
          bVal = b.guest_count;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'profession':
          aVal = (a.profession || a.profession_other || '').toLowerCase();
          bVal = (b.profession || b.profession_other || '').toLowerCase();
          break;
        case 'district':
          aVal = (a.district || '').toLowerCase();
          bVal = (b.district || '').toLowerCase();
          break;
        case 'created_at':
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal);
      const strB = String(bVal);
      if (sortDir === 'asc') return strA.localeCompare(strB);
      return strB.localeCompare(strA);
    });
  }, [participants, search, sortField, sortDir]);

  const totalGuests = participants.reduce((sum, item) => sum + Number(item.guest_count || 0), 0);

  const handleEdit = (participant: Participant) => {
    if (!adminState.isAdmin) {
      setMessage('এডিট করতে অ্যাডমিন লগইন করুন।');
      return;
    }
    if (adminState.passwordResetRequired) {
      setMessage('প্রথমে পাসওয়ার্ড সেট করুন (হোম পেজে যান)।');
      return;
    }
    setEditingId(participant.id);
    setEditForm({
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
    if (adminState.passwordResetRequired) {
      setMessage('প্রথমে পাসওয়ার্ড সেট করুন (হোম পেজে যান)।');
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

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setMessage('');
    const payload = {
      ...editForm,
      batch: Number(editForm.batch),
      guest_count: Number(editForm.guest_count),
    };
    try {
      const res = await fetch(`/api/participants/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setEditingId(null);
      setEditForm(initialEditForm);
      setMessage('সফলভাবে আপডেট করা হয়েছে।');
      await loadParticipants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'আপডেট করা যায়নি।');
    } finally {
      setIsSaving(false);
    }
  };

  const exportExcel = () => {
    window.location.href = '/api/participants/export';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
              &larr; হোম
            </Link>
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">অংশগ্রহণকারীদের তালিকা</h1>
              <p className="text-sm text-slate-400">সকল নিবন্ধিত প্রাক্তন শিক্ষার্থী</p>
            </div>
          </div>
          <button onClick={exportExcel} className="rounded-xl border border-emerald-700/50 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-950/30">
            এক্সেল ডাউনলোড
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">মোট অংশগ্রহণকারী</p>
            <p className="mt-1 text-2xl font-semibold">{participants.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">মোট অতিথি</p>
            <p className="mt-1 text-2xl font-semibold">{totalGuests}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">অনুসন্ধান ফলাফল</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold">{sortedParticipants.length}</p>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম, ব্যাচ, পেশা, জেলা"
                className="ml-auto w-48 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </section>

        {editingId ? (
          <section className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-300">তথ্য আপডেট করুন</h2>
              <button
                onClick={() => { setEditingId(null); setEditForm(initialEditForm); }}
                className="rounded-xl border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-slate-200"
              >
                বাতিল
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                নাম<sup className="text-amber-400">*</sup>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ব্যাচ (SSC পাসের সাল)<sup className="text-amber-400">*</sup>
                <input required type="number" min={1900} max={2026} value={editForm.batch} onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                পেশা
                <select value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                  <option value="">—</option>
                  {professions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                অন্যান্য পেশা
                <input value={editForm.profession_other} onChange={(e) => setEditForm({ ...editForm, profession_other: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                অতিথি সংখ্যা
                <input type="number" min="0" value={editForm.guest_count} onChange={(e) => setEditForm({ ...editForm, guest_count: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                অতিথির বিবরণ
                <input value={editForm.guest_details} onChange={(e) => setEditForm({ ...editForm, guest_details: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ফোন নম্বর
                <input value={editForm.contact_phone} onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ইমেইল
                <input type="email" value={editForm.contact_email} onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                জেলা
                <input value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-300">
                ঠিকানা
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
              </label>
            </div>
            <div className="mt-4">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {isSaving ? 'সেভ হচ্ছে...' : 'আপডেট করুন'}
              </button>
            </div>
          </section>
        ) : null}

        {message ? (
          <p className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-400">{message}</p>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="max-h-[calc(100vh-320px)] overflow-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-950/95 text-left text-slate-300">
                <tr>
                  <th
                    className="cursor-pointer select-none px-4 py-3 hover:text-white transition"
                    onClick={() => handleSort('name')}
                  >
                    নাম<SortIcon field="name" currentField={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 hover:text-white transition"
                    onClick={() => handleSort('batch')}
                  >
                    ব্যাচ<SortIcon field="batch" currentField={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 hover:text-white transition"
                    onClick={() => handleSort('profession')}
                  >
                    পেশা<SortIcon field="profession" currentField={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 hover:text-white transition"
                    onClick={() => handleSort('guest_count')}
                  >
                    অতিথি<SortIcon field="guest_count" currentField={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 hover:text-white transition"
                    onClick={() => handleSort('district')}
                  >
                    জেলা<SortIcon field="district" currentField={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 hover:text-white transition"
                    onClick={() => handleSort('created_at')}
                  >
                    রেজিস্ট্রেশন তারিখ<SortIcon field="created_at" currentField={sortField} dir={sortDir} />
                  </th>
                  <th className="px-4 py-3">ফোন</th>
                  <th className="px-4 py-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {sortedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      কোন অংশগ্রহণকারী পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  sortedParticipants.map((participant) => (
                    <tr key={participant.id} className="align-top hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold">{participant.name}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{participant.batch}</td>
                      <td className="px-4 py-3">{participant.profession || participant.profession_other || '—'}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{participant.guest_count}</td>
                      <td className="px-4 py-3">{participant.district || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 tabular-nums">
                        {new Date(participant.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{participant.contact_phone || '—'}</td>
                      <td className="px-4 py-3">
                        {adminState.isAdmin ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleEdit(participant)} className="rounded-lg bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600 transition">এডিট</button>
                            <button onClick={() => handleDelete(participant.id)} className="rounded-lg bg-rose-800 px-2 py-1 text-xs hover:bg-rose-700 transition">ডিলিট</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
