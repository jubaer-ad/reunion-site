"use client";

import { useEffect, useMemo, useState } from 'react';

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

  const loadParticipants = async () => {
    const res = await fetch('/api/participants');
    const data = await res.json();
    setParticipants(data);
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  const filteredParticipants = useMemo(() => {
    const term = search.toLowerCase();
    return participants.filter((item) => {
      const haystack = `${item.name} ${item.batch} ${item.profession || ''} ${item.profession_other || ''} ${item.district || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [participants, search]);

  const totalGuests = participants.reduce((sum, item) => sum + Number(item.guest_count || 0), 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    const payload = {
      ...form,
      batch: Number(form.batch),
      guest_count: Number(form.guest_count),
    };

    try {
      const res = await fetch('/api/participants', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editingId }),
      });

      if (!res.ok) {
        throw new Error('Failed to save participant');
      }

      setForm(initialForm);
      setEditingId(null);
      setMessage(editingId ? 'সফলভাবে আপডেট করা হয়েছে।' : 'সফলভাবে রেজিস্ট্রেশন সম্পন্ন হয়েছে।');
      await loadParticipants();
    } catch {
      setMessage('দুঃখিত, তথ্য সংরক্ষণ করা যায়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (participant: Participant) => {
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
    const confirmed = window.confirm('আপনি কি নিশ্চিতভাবে মুছতে চান?');
    if (!confirmed) return;

    const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage('তথ্য সফলভাবে মুছে ফেলা হয়েছে।');
      await loadParticipants();
    }
  };

  const exportExcel = () => {
    window.location.href = '/api/participants/export';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">High School Reunion</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">পুনর্মিলনী রেজিস্ট্রেশন ও তথ্য ব্যবস্থাপনা</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
            এই পৃষ্ঠায় অংশগ্রহণকারীরা নিজেদের তথ্য রেজিস্ট্রেশন করতে পারবেন, এবং reunion committee সহজে তালিকা অনুসন্ধান, আপডেট ও এক্সেল ডাউনলোড করতে পারবেন।
          </p>
        </header>

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
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(participant)} className="rounded-lg bg-slate-800 px-2 py-1 text-xs">এডিট</button>
                          <button onClick={() => handleDelete(participant.id)} className="rounded-lg bg-rose-700 px-2 py-1 text-xs">ডিলিট</button>
                        </div>
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
