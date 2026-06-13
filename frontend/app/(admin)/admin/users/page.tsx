'use client'

import { useState } from 'react'
import { Search, UserX, UserCheck, Users, Download, ExternalLink, X, Mail, Calendar, ShoppingBag, TrendingUp } from 'lucide-react'
import {
  useAdminUsers,
  useSuspendUser,
  useReactivateUser,
  type AdminUser,
} from '@/hooks/queries/useAdmin'
import { BrandDetailDrawer } from '@/components/admin/BrandDetailDrawer'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

async function downloadUsersCsv() {
  const res = await api.get('/admin/users/export', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `users_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  return (
    <span className={cn(
      'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
      role === 'ADMIN' && 'bg-accent/10 text-accent',
      role === 'BRAND' && 'bg-primary/10 text-primary',
      role === 'BUYER' && 'bg-muted-bg text-muted-text',
    )}>
      {role}
    </span>
  )
}

function StatusBadge({ status }: { status: AdminUser['status'] }) {
  return (
    <span className={cn(
      'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
      status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
    )}>
      {status}
    </span>
  )
}

// ─── Buyer detail panel ───────────────────────────────────────────────────────

function BuyerPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[380px] bg-surface border-l border-border-warm h-full overflow-y-auto flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary">Buyer Profile</h2>
          <button type="button" onClick={onClose} className="text-muted-text hover:text-primary transition-colors">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Identity */}
          <div>
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              <span className="text-[18px] font-[600] font-public-sans text-accent">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <p className="text-[18px] font-[600] font-public-sans text-primary leading-tight">{user.name}</p>
            <p className="text-[13px] font-public-sans text-muted-text mt-0.5">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShoppingBag, label: 'Orders placed', value: user.ordersCount.toString() },
              { icon: TrendingUp, label: 'Total spent', value: fmtINR(user.gmvInr) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-muted-bg/50 rounded p-3 border border-border-warm">
                <Icon size={14} className="text-muted-text mb-1.5" aria-hidden="true" />
                <p className="text-[18px] font-[600] font-public-sans text-primary leading-none">{value}</p>
                <p className="text-[11px] font-public-sans text-muted-text mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-3 text-[13px] font-public-sans">
            <div className="flex items-center gap-2.5 text-muted-text">
              <Mail size={13} aria-hidden="true" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-text">
              <Calendar size={13} aria-hidden="true" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Status + action */}
          <div className="border-t border-border-warm pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1">Account status</p>
                <StatusBadge status={user.status} />
              </div>
              {user.status === 'ACTIVE' ? (
                <SuspendReactivateButton user={user} onDone={onClose} />
              ) : (
                <SuspendReactivateButton user={user} onDone={onClose} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Suspend/Reactivate button (shared) ──────────────────────────────────────

function SuspendReactivateButton({ user, onDone }: { user: AdminUser; onDone?: () => void }) {
  const suspend = useSuspendUser()
  const reactivate = useReactivateUser()
  const isActive = user.status === 'ACTIVE'

  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => suspend.mutate(user.id, { onSuccess: onDone })}
        disabled={suspend.isPending}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-error/40 text-error bg-error/5 hover:bg-error/10 text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50"
      >
        <UserX size={12} aria-hidden="true" />
        Suspend
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => reactivate.mutate(user.id, { onSuccess: onDone })}
      disabled={reactivate.isPending}
      className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-success/40 text-success bg-success/5 hover:bg-success/10 text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50"
    >
      <UserCheck size={12} aria-hidden="true" />
      Reactivate
    </button>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onView,
}: {
  user: AdminUser
  onView: (u: AdminUser) => void
}) {
  return (
    <tr className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors">
      <td className="py-3.5 px-4">
        <div>
          <p className="text-[14px] font-[600] font-public-sans text-primary">{user.name}</p>
          <p className="text-[12px] font-public-sans text-muted-text">{user.email}</p>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text tabular-nums">
        {user.ordersCount}
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-primary tabular-nums">
        {user.gmvInr > 0 ? fmtINR(user.gmvInr) : <span className="text-muted-text">—</span>}
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">
        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center justify-end gap-2">
          {user.role !== 'ADMIN' && (
            <button
              type="button"
              onClick={() => onView(user)}
              className="flex items-center gap-1 h-7 px-2.5 rounded border border-border-warm text-[11px] font-[600] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
            >
              <ExternalLink size={11} aria-hidden="true" />
              View
            </button>
          )}
          {user.role !== 'ADMIN' && <SuspendReactivateButton user={user} />}
        </div>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState<AdminUser | null>(null)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useAdminUsers({
    page,
    search: search.trim() || undefined,
    role: role || undefined,
    status: status || undefined,
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  async function handleExport() {
    setExporting(true)
    try { await downloadUsersCsv() } finally { setExporting(false) }
  }

  const isBrandView = viewUser?.role === 'BRAND'
  const isBuyerView = viewUser?.role === 'BUYER'

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">Users</h1>
          <p className="text-[14px] font-public-sans text-muted-text mt-1">
            {total > 0 ? `${total.toLocaleString()} total users` : 'Manage platform buyers and brands'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded border border-border-warm bg-surface text-[13px] font-[600] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Download size={14} aria-hidden="true" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or email…"
            className="w-full h-9 pl-9 pr-3 rounded border border-border-warm bg-surface text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {(['', 'BUYER', 'BRAND', 'ADMIN'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { setRole(r); setPage(1) }}
            className={cn(
              'h-9 px-3.5 rounded border text-[13px] font-[600] font-public-sans transition-colors',
              role === r
                ? 'border-primary bg-primary text-white'
                : 'border-border-warm bg-surface text-muted-text hover:text-primary hover:bg-muted-bg',
            )}
          >
            {r || 'All roles'}
          </button>
        ))}

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded border border-border-warm bg-surface text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted-bg rounded w-36" />
                  <div className="h-3 bg-muted-bg rounded w-44" />
                </div>
                <div className="h-5 bg-muted-bg rounded w-14" />
                <div className="h-5 bg-muted-bg rounded w-16" />
              </div>
            ))}
          </div>
        ) : !users.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <Users size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[15px] font-[600] font-public-sans text-primary">No users found</p>
            {(search || role || status) && (
              <p className="text-[13px] font-public-sans text-muted-text">Try adjusting the filters.</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['User', 'Role', 'Status', 'Orders', 'GMV', 'Joined', ''].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow key={u.id} user={u} onView={setViewUser} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-warm">
                <p className="text-[12px] font-public-sans text-muted-text">
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="h-8 px-3 flex items-center text-[12px] font-public-sans text-muted-text">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail panels */}
      {isBrandView && (
        <BrandDetailDrawer
          brandId={viewUser.brandProfileId ?? null}
          onClose={() => setViewUser(null)}
        />
      )}
      {isBuyerView && (
        <BuyerPanel user={viewUser} onClose={() => setViewUser(null)} />
      )}
    </div>
  )
}
