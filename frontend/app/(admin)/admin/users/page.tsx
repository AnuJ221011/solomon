'use client'

import { useState } from 'react'
import { Search, UserX, UserCheck, Users } from 'lucide-react'
import {
  useAdminUsers,
  useSuspendUser,
  useReactivateUser,
  type AdminUser,
} from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
        role === 'ADMIN' && 'bg-accent/10 text-accent',
        role === 'BRAND' && 'bg-primary/10 text-primary',
        role === 'BUYER' && 'bg-muted-bg text-muted-text'
      )}
    >
      {role}
    </span>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: AdminUser }) {
  const suspend = useSuspendUser()
  const reactivate = useReactivateUser()
  const isActive = user.status === 'ACTIVE'

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
        <span
          className={cn(
            'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
            isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          )}
        >
          {user.status}
        </span>
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">
        {user.ordersCount ?? '—'}
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">
        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="py-3.5 px-4 text-right">
        {user.role !== 'ADMIN' && (
          isActive ? (
            <button
              type="button"
              onClick={() => suspend.mutate(user.id)}
              disabled={suspend.isPending}
              aria-label={`Suspend ${user.name}`}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2.5 rounded border text-[11px] font-[600] font-public-sans transition-colors ml-auto',
                'border-error/40 text-error bg-error/5 hover:bg-error/10 disabled:opacity-50'
              )}
            >
              <UserX size={12} aria-hidden="true" />
              Suspend
            </button>
          ) : (
            <button
              type="button"
              onClick={() => reactivate.mutate(user.id)}
              disabled={reactivate.isPending}
              aria-label={`Reactivate ${user.name}`}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2.5 rounded border text-[11px] font-[600] font-public-sans transition-colors ml-auto',
                'border-success/40 text-success bg-success/5 hover:bg-success/10 disabled:opacity-50'
              )}
            >
              <UserCheck size={12} aria-hidden="true" />
              Reactivate
            </button>
          )
        )}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminUsers({
    page,
    search: search.trim() || undefined,
    role: role || undefined,
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">
          Users
        </h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">
          Manage platform buyers and brands
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or email..."
            className="w-full h-9 pl-9 pr-3 rounded border border-border-warm bg-surface text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded border border-border-warm bg-surface text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="BUYER">Buyer</option>
          <option value="BRAND">Brand</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted-bg rounded w-36" />
                  <div className="h-3 bg-muted-bg rounded w-44" />
                </div>
                <div className="h-5 bg-muted-bg rounded w-14" />
              </div>
            ))}
          </div>
        ) : !users.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <Users size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">No users found</p>
            {search && (
              <p className="text-[13px] font-public-sans text-muted-text">
                Try a different search term.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['User', 'Role', 'Status', 'Orders', 'Joined', ''].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-left text-[12px] font-[700] font-public-sans text-muted-text uppercase tracking-[0.06em]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-warm">
                <p className="text-[12px] font-public-sans text-muted-text">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
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
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * 20 >= total}
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
    </div>
  )
}
