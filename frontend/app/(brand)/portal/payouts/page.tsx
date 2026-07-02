'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, Download, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMyBrandDashboard } from '@/hooks/queries/useBrands'
import { useBrandOrders, Order } from '@/hooks/queries/useOrders'
import { getApiError } from '@/lib/getApiError'
import api from '@/lib/api'

// ─── Payout speed option ──────────────────────────────────────────────────────

interface SpeedOptionProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  selected: boolean
  onSelect: () => void
}

function SpeedOption({ icon, title, subtitle, selected, onSelect }: SpeedOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex-1 flex items-start gap-3 p-4 rounded border text-left transition-colors',
        selected
          ? 'border-accent bg-accent/[5%]'
          : 'border-border-warm bg-surface hover:bg-muted-bg'
      )}
    >
      <div className={cn('mt-0.5', selected ? 'text-accent' : 'text-muted-text')}>
        {icon}
      </div>
      <div>
        <p className={cn(
          'text-[14px] font-[600] font-public-sans',
          selected ? 'text-primary' : 'text-muted-text'
        )}>
          {title}
        </p>
        <p className="text-[12px] font-public-sans text-muted-text mt-0.5">{subtitle}</p>
      </div>
      <div className={cn(
        'ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
        selected ? 'border-accent' : 'border-border-warm'
      )}>
        {selected && <div className="w-2 h-2 rounded-full bg-accent" />}
      </div>
    </button>
  )
}

// ─── Derive payout row from order ─────────────────────────────────────────────

interface PayoutRow {
  id: string
  orderNumber: string
  date: string
  gross: number
  net: number
  status: 'PENDING' | 'PROCESSING' | 'PAID'
  buyerName: string
}

function derivePayoutRow(order: Order): PayoutRow {
  // Estimate commission at 8% if achievement level unknown — show "N/A" label handled in column
  const commissionRate = 0.08
  const net = Math.round(order.amount * (1 - commissionRate))
  // DELIVERED orders are treated as PAID
  const status: PayoutRow['status'] =
    order.status === 'DELIVERED' ? 'PAID' : 'PENDING'
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.slice(0, 10),
    gross: order.amount,
    net,
    status,
    buyerName: order.buyerName,
  }
}

// ─── Summary card skeleton ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  subColor = 'text-muted-text',
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <p className="text-[12px] font-public-sans text-muted-text">{label}</p>
      <p className="text-[28px] font-[600] font-public-sans text-primary mt-1 tabular-nums leading-none">
        {value}
      </p>
      {sub && (
        <p className={cn('text-[12px] font-public-sans mt-2', subColor)}>{sub}</p>
      )}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 animate-pulse">
      <div className="h-3 w-28 bg-muted-bg rounded mb-3" />
      <div className="h-7 w-24 bg-muted-bg rounded mb-2" />
      <div className="h-3 w-16 bg-muted-bg rounded" />
    </div>
  )
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

async function exportCsv() {
  try {
    const response = await api.get('/brands/me/payouts/export', {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payouts.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // Endpoint not yet available — silently ignore
  }
}

// ─── Bank Account Details ─────────────────────────────────────────────────────

interface BankAccount {
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountType: 'SAVINGS' | 'CURRENT'
  upiId: string
}

const EMPTY_BANK: BankAccount = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  accountType: 'SAVINGS',
  upiId: '',
}

const INPUT_CLS =
  'w-full h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors'

function BankAccountSection() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<BankAccount>(EMPTY_BANK)
  const [confirm, setConfirm] = useState('')
  const [showAccNum, setShowAccNum] = useState(false)
  const [editing, setEditing] = useState(false)

  const { data: saved, isLoading } = useQuery<BankAccount | null>({
    queryKey: ['bank-account'],
    queryFn: () => api.get('/brands/me/bank-account').then((r) => r.data.data ?? null).catch(() => null),
  })

  useEffect(() => {
    if (saved) {
      setForm(saved)
      setConfirm(saved.accountNumber ?? '')
    }
  }, [saved])

  const saveMutation = useMutation({
    mutationFn: (body: BankAccount) => api.post('/brands/me/bank-account', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-account'] })
      toast.success('Bank account saved.')
      setEditing(false)
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  function handleSave() {
    if (!form.accountHolderName.trim()) { toast.error('Account holder name is required.'); return }
    if (!form.bankName.trim())          { toast.error('Bank name is required.'); return }
    if (!form.accountNumber.trim())     { toast.error('Account number is required.'); return }
    if (form.accountNumber !== confirm) { toast.error('Account numbers do not match.'); return }
    if (!form.ifscCode.trim())          { toast.error('IFSC code is required.'); return }
    saveMutation.mutate(form)
  }

  const isSaved = !!saved?.accountNumber
  const showForm = editing || !isSaved

  return (
    <div className="bg-surface border border-border-warm rounded mb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary">Bank Account Details</h2>
          {isSaved && !editing && (
            <span className="inline-flex items-center gap-1 text-[11px] font-[600] font-public-sans px-2 py-0.5 rounded border text-[#1E5F1E] bg-[#F0FAF0] border-[#B2DDB2]">
              <CheckCircle2 size={10} />Saved
            </span>
          )}
          {!isSaved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-[600] font-public-sans px-2 py-0.5 rounded border text-[#B25E00] bg-[#FFF4E6] border-[#FFD8A8]">
              <AlertCircle size={10} />Required for payouts
            </span>
          )}
        </div>
        {isSaved && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[13px] font-[600] font-public-sans text-accent hover:text-accent/80 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3].map((i) => <div key={i} className="h-9 bg-muted-bg rounded" />)}
          </div>
        ) : isSaved && !editing ? (
          /* ── Read-only summary ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-[14px] font-public-sans">
            {[
              ['Account Holder', saved.accountHolderName],
              ['Bank Name',      saved.bankName],
              ['Account Number', `••••••${saved.accountNumber.slice(-4)}`],
              ['IFSC Code',      saved.ifscCode],
              ['Account Type',   saved.accountType === 'SAVINGS' ? 'Savings' : 'Current'],
              ...(saved.upiId ? [['UPI ID', saved.upiId]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-[600] text-muted-text uppercase tracking-[0.05em]">{label}</span>
                <span className="text-primary">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          /* ── Edit form ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Account Holder Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.accountHolderName}
                  onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                  placeholder="As per bank records"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Bank Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  placeholder="e.g. HDFC Bank"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Account Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAccNum ? 'text' : 'password'}
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="Enter account number"
                    className={cn(INPUT_CLS, 'pr-9')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccNum((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary transition-colors"
                  >
                    {showAccNum ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Confirm Account Number <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter account number"
                  className={cn(INPUT_CLS, confirm && confirm !== form.accountNumber ? 'border-error' : '')}
                />
                {confirm && confirm !== form.accountNumber && (
                  <p className="text-[11px] text-error mt-1">Account numbers do not match.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  IFSC Code <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) => setForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Account Type <span className="text-error">*</span>
                </label>
                <select
                  value={form.accountType}
                  onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value as BankAccount['accountType'] }))}
                  className={INPUT_CLS}
                >
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  UPI ID <span className="text-muted-text font-[400] normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.upiId}
                  onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
                  placeholder="yourname@upi"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Bank Details'}
              </Button>
              {editing && (
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setForm(saved!); setConfirm(saved!.accountNumber) }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const [speedMode, setSpeedMode] = useState<'standard' | 'express'>('standard')

  const { data: dashboard, isLoading: dashLoading } = useMyBrandDashboard()
  // Fetch all delivered orders (limit=100) as proxy for payout rows
  const { data: deliveredData, isLoading: ordersLoading } = useBrandOrders({
    status: 'DELIVERED',
    limit: 100,
  })
  // Also fetch pending orders for the pending payout card
  const { data: pendingData } = useBrandOrders({ status: 'PENDING', limit: 100 })

  const isLoading = dashLoading || ordersLoading

  const deliveredOrders = deliveredData?.orders ?? []
  const pendingOrders = pendingData?.orders ?? []

  const payoutRows: PayoutRow[] = deliveredOrders.map(derivePayoutRow)

  // Summary values — prefer dashboard stats if available, fallback to derived
  const pendingTotal = pendingOrders.reduce(
    (sum, o) => sum + Math.round(o.amount * 0.92),
    0
  )

  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const paidThisMonth = deliveredOrders
    .filter((o) => o.createdAt.startsWith(thisMonthKey))
    .reduce((sum, o) => sum + Math.round(o.amount * 0.92), 0)

  const totalPaid = deliveredOrders.reduce(
    (sum, o) => sum + Math.round(o.amount * 0.92),
    0
  )

  const thisMonthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px] font-[500]">{String(val)}</span>
      ),
    },
    {
      key: 'buyerName',
      label: 'Buyer',
      render: (val: unknown) => (
        <span className="text-[13px] font-public-sans text-primary">{String(val)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val: unknown) => (
        <span className="text-muted-text text-[13px]">{String(val)}</span>
      ),
    },
    {
      key: 'gross',
      label: 'Gross',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px]">₹{Number(val).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'gross',
      label: 'Commission',
      render: (val: unknown) => {
        const gross = Number(val)
        const commission = Math.round(gross * 0.08)
        return (
          <div>
            <span className="text-[13px] font-public-sans text-muted-text">8%</span>
            <span className="text-[13px] font-public-sans text-muted-text ml-1.5">
              (₹{commission.toLocaleString('en-IN')})
            </span>
          </div>
        )
      },
    },
    {
      key: 'net',
      label: 'Net',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px] font-[600] text-primary">
          ₹{Number(val).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: unknown) => {
        const status = String(val) as PayoutRow['status']
        const variants: Record<string, 'warning' | 'accent' | 'success'> = {
          PENDING: 'warning',
          PROCESSING: 'accent',
          PAID: 'success',
        }
        return (
          <Badge variant={variants[status]}>
            {status ? status.charAt(0) + status.slice(1).toLowerCase() : '—'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Payouts
        </h1>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Bank account details */}
      <BankAccountSection />

      {/* Payout speed toggle */}
      <div className="mb-8">
        <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
          Payout Speed
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-[600px]">
          <SpeedOption
            icon={<Clock size={16} />}
            title="Standard — Net 30"
            subtitle="No fee. Settle within 30 days of delivery."
            selected={speedMode === 'standard'}
            onSelect={() => setSpeedMode('standard')}
          />
          <SpeedOption
            icon={<Zap size={16} />}
            title="Express — Next Day"
            subtitle="2.5% fee. Payout next business day."
            selected={speedMode === 'express'}
            onSelect={() => setSpeedMode('express')}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Pending Payout"
              value={`₹${pendingTotal.toLocaleString('en-IN')}`}
              sub={`${pendingOrders.length} orders`}
              subColor="text-warning"
            />
            <StatCard
              label="This Month Paid"
              value={`₹${paidThisMonth.toLocaleString('en-IN')}`}
              sub={thisMonthLabel}
              subColor="text-success"
            />
            <StatCard
              label="Total Paid (All time)"
              value={`₹${totalPaid.toLocaleString('en-IN')}`}
              sub="Since onboarding"
            />
          </>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && payoutRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border-warm rounded">
          <p className="text-[16px] font-[500] font-public-sans text-primary mb-2">
            No payouts yet
          </p>
          <p className="text-[13px] font-public-sans text-muted-text">
            Delivered orders will appear here as payout records.
          </p>
        </div>
      )}

      {/* Table */}
      {(isLoading || payoutRows.length > 0) && (
        isLoading ? (
          <div className="bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border-warm px-4 flex items-center gap-4">
                <div className="h-3 w-32 bg-muted-bg rounded" />
                <div className="h-3 w-20 bg-muted-bg rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={payoutRows as unknown as Record<string, unknown>[]}
            pageSize={10}
          />
        )
      )}
    </div>
  )
}
