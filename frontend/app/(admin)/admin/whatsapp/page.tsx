'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MessageSquare, Plus, X, ChevronRight, RefreshCw, Search, Check } from 'lucide-react'
import { useWhatsappBroadcasts, useCreateWhatsappBroadcast, useWhatsappContacts, WhatsappContact } from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-muted-bg text-accent',
  RUNNING: 'bg-amber-50 text-amber-700',
  DONE:    'bg-success/10 text-success',
}

const RECIPIENT_GROUPS = [
  { value: 'ALL_BUYERS',       label: 'All Buyers' },
  { value: 'ALL_BRANDS',       label: 'All Approved Brands' },
  { value: 'SPECIFIC_BRANDS',  label: 'Specific Brands — pick from list' },
  { value: 'SPECIFIC_BUYERS',  label: 'Specific Buyers — pick from list' },
  { value: 'CUSTOM',           label: 'Custom phone numbers (paste)' },
]

// ─── Contact picker ───────────────────────────────────────────────────────────

function ContactPicker({
  type,
  selected,
  onChange,
}: {
  type: 'brands' | 'buyers'
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [search, setSearch] = useState('')
  const { data: contacts = [], isLoading } = useWhatsappContacts(type, true)

  const filtered = useMemo(
    () =>
      search.trim()
        ? contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
        : contacts,
    [contacts, search]
  )

  const toggle = (c: WhatsappContact) => {
    const next = new Set(selected)
    next.has(c.phone) ? next.delete(c.phone) : next.add(c.phone)
    onChange(next)
  }

  const toggleAll = () => {
    if (filtered.every((c) => selected.has(c.phone))) {
      const next = new Set(selected)
      filtered.forEach((c) => next.delete(c.phone))
      onChange(next)
    } else {
      const next = new Set(selected)
      filtered.forEach((c) => next.add(c.phone))
      onChange(next)
    }
  }

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.phone))

  return (
    <div className="border border-border-warm rounded-md overflow-hidden">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-warm bg-surface">
        <Search size={13} className="text-[#9CA3AF] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${type}…`}
          className="flex-1 text-[13px] font-public-sans text-primary placeholder:text-[#9CA3AF] bg-transparent focus:outline-none"
        />
        {selected.size > 0 && (
          <span className="text-[11px] font-[600] font-public-sans text-accent bg-muted-bg px-1.5 py-0.5 rounded tabular-nums">
            {selected.size} selected
          </span>
        )}
      </div>

      {/* Select all row */}
      {!isLoading && filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-muted-bg hover:bg-surface text-left"
        >
          <span className={cn(
            'w-4 h-4 rounded border flex items-center justify-center shrink-0',
            allSelected ? 'bg-primary border-primary' : 'border-[#D0C8BE]'
          )}>
            {allSelected && <Check size={10} className="text-white" strokeWidth={3} />}
          </span>
          <span className="text-[12px] font-[600] font-public-sans text-muted-text">
            {allSelected ? 'Deselect all' : `Select all (${filtered.length})`}
          </span>
        </button>
      )}

      {/* List */}
      <div className="max-h-[220px] overflow-y-auto">
        {isLoading ? (
          <div className="py-6 text-center text-[13px] font-public-sans text-[#9CA3AF]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-[13px] font-public-sans text-[#9CA3AF]">
            {search ? 'No matches' : `No ${type} with a phone number`}
          </div>
        ) : (
          filtered.map((c) => {
            const checked = selected.has(c.phone)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-bg text-left transition-colors last:border-0',
                  checked ? 'bg-muted-bg' : 'hover:bg-surface'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                  checked ? 'bg-primary border-primary' : 'border-[#D0C8BE]'
                )}>
                  {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-public-sans font-[500] text-primary truncate">{c.name}</p>
                  <p className="text-[11.5px] font-mono text-[#9CA3AF]">{c.phone}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateWhatsappBroadcast()
  const [form, setForm] = useState({
    name: '',
    templateName: '',
    languageCode: 'en',
    recipientGroup: 'ALL_BUYERS',
    customPhones: '',
  })
  const [pickedPhones, setPickedPhones] = useState<Set<string>>(new Set())

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    // clear picker selection when switching group
    if (k === 'recipientGroup') setPickedPhones(new Set())
  }

  const isSpecific = form.recipientGroup === 'SPECIFIC_BRANDS' || form.recipientGroup === 'SPECIFIC_BUYERS'
  const pickerType: 'brands' | 'buyers' = form.recipientGroup === 'SPECIFIC_BRANDS' ? 'brands' : 'buyers'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let phones: string[] | undefined
    let recipientGroup: string | undefined

    if (isSpecific) {
      phones = [...pickedPhones]
      if (!phones.length) return // picker validates via button disabled state
    } else if (form.recipientGroup === 'CUSTOM') {
      phones = form.customPhones.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean)
    } else {
      recipientGroup = form.recipientGroup
    }

    await create.mutateAsync({
      name: form.name.trim(),
      templateName: form.templateName.trim(),
      languageCode: form.languageCode.trim() || 'en',
      recipientGroup,
      phones,
    })
    onClose()
  }

  const submitDisabled = create.isPending || (isSpecific && pickedPhones.size === 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm">
          <h2 className="font-playfair text-[17px] font-[600] text-primary">New Broadcast</h2>
          <button type="button" onClick={onClose} className="text-[#9CA3AF] hover:text-primary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text mb-1.5 uppercase tracking-wide">
              Campaign name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Summer Collection Launch"
              className="w-full border border-border-warm rounded-md px-3 py-2 text-[13.5px] font-public-sans text-primary placeholder:text-[#9CA3AF] focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text mb-1.5 uppercase tracking-wide">
              Template name <span className="text-[#9CA3AF] normal-case font-[400]">(from Meta)</span>
            </label>
            <input
              required
              value={form.templateName}
              onChange={(e) => set('templateName', e.target.value)}
              placeholder="e.g. new_collection_launch"
              className="w-full border border-border-warm rounded-md px-3 py-2 text-[13.5px] font-public-sans text-primary placeholder:text-[#9CA3AF] focus:outline-none focus:border-accent font-mono"
            />
            <p className="mt-1 text-[11.5px] font-public-sans text-[#9CA3AF]">
              Must be an approved template in your Meta WhatsApp Manager.
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text mb-1.5 uppercase tracking-wide">
              Language code
            </label>
            <input
              value={form.languageCode}
              onChange={(e) => set('languageCode', e.target.value)}
              placeholder="en"
              className="w-full border border-border-warm rounded-md px-3 py-2 text-[13.5px] font-public-sans text-primary placeholder:text-[#9CA3AF] focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text mb-1.5 uppercase tracking-wide">
              Recipients
            </label>
            <select
              value={form.recipientGroup}
              onChange={(e) => set('recipientGroup', e.target.value)}
              className="w-full border border-border-warm rounded-md px-3 py-2 text-[13.5px] font-public-sans text-primary focus:outline-none focus:border-accent bg-white"
            >
              {RECIPIENT_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {isSpecific && (
            <ContactPicker
              type={pickerType}
              selected={pickedPhones}
              onChange={setPickedPhones}
            />
          )}

          {form.recipientGroup === 'CUSTOM' && (
            <div>
              <label className="block text-[12px] font-[600] font-public-sans text-muted-text mb-1.5 uppercase tracking-wide">
                Phone numbers
              </label>
              <textarea
                required
                rows={4}
                value={form.customPhones}
                onChange={(e) => set('customPhones', e.target.value)}
                placeholder={"919876543210\n918765432109\n..."}
                className="w-full border border-border-warm rounded-md px-3 py-2 text-[13px] font-mono text-primary placeholder:text-[#9CA3AF] focus:outline-none focus:border-accent resize-none"
              />
              <p className="mt-1 text-[11.5px] font-public-sans text-[#9CA3AF]">
                One number per line or comma-separated. Digits only, no + or spaces.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-border-warm rounded-md text-[13.5px] font-public-sans font-[500] text-muted-text hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="flex-1 py-2 bg-primary rounded-md text-[13.5px] font-public-sans font-[500] text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {create.isPending
                ? 'Starting…'
                : isSpecific && pickedPhones.size > 0
                  ? `Send to ${pickedPhones.size} ${pickerType}`
                  : 'Start Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-public-sans text-[#9CA3AF] tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsappBroadcastsPage() {
  const { data: broadcasts, isLoading, refetch } = useWhatsappBroadcasts()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted-bg flex items-center justify-center">
            <MessageSquare size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="font-playfair text-[22px] font-[600] text-primary leading-tight">
              WhatsApp Broadcasts
            </h1>
            <p className="text-[13px] font-public-sans text-[#9CA3AF] mt-0.5">
              Send approved template messages to buyers or brands
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-md text-[#9CA3AF] hover:text-muted-text hover:bg-muted-bg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-[13.5px] font-public-sans font-[500] hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            New Broadcast
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border-warm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-warm bg-surface">
                {['Campaign', 'Template', 'Recipients', 'Progress', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-[700] font-public-sans text-[#9CA3AF] uppercase tracking-[0.07em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-muted-bg">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 bg-[#F0EBE3] rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !broadcasts?.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <MessageSquare size={28} className="text-[#D0C8BE] mx-auto mb-3" />
                    <p className="text-[14px] font-public-sans text-[#9CA3AF]">No broadcasts yet</p>
                    <p className="text-[12.5px] font-public-sans text-[#C4BDB4] mt-1">
                      Click "New Broadcast" to send your first campaign
                    </p>
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} className="border-b border-muted-bg hover:bg-surface transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-[13.5px] font-[500] font-public-sans text-primary">{b.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-[12px] bg-muted-bg text-accent px-2 py-0.5 rounded">
                        {b.templateName}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-public-sans text-muted-text tabular-nums">
                        {b.totalCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 min-w-[140px]">
                      <ProgressBar sent={b.sentCount} total={b.totalCount} />
                      <p className="text-[11px] font-public-sans text-[#9CA3AF] mt-1 tabular-nums">
                        {b.sentCount} sent · {b.failedCount} failed
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-[600] font-public-sans', STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING)}>
                        {b.status === 'RUNNING' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                        )}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[12.5px] font-public-sans text-[#9CA3AF]">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/whatsapp/${b.id}`}
                        className="flex items-center gap-1 text-[12.5px] font-public-sans text-accent hover:text-[#8B6F4E] transition-colors"
                      >
                        Details <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
