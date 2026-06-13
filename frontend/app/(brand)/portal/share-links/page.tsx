'use client'

import { useState } from 'react'
import { Plus, Copy, Share2, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  useShareLinks,
  useCreateShareLink,
  useUpdateShareLink,
  useDeleteShareLink,
  ShareLink,
  CreateShareLinkInput,
} from '@/hooks/queries/useShareLinks'

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <p className="text-[12px] leading-[1.3] font-public-sans text-muted-text">{label}</p>
      <p className="text-[28px] font-[600] font-public-sans text-primary mt-1 leading-none tabular-nums">
        {value}
      </p>
    </div>
  )
}

function SummaryCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 animate-pulse">
      <div className="h-3 w-24 bg-muted-bg rounded mb-3" />
      <div className="h-7 w-20 bg-muted-bg rounded" />
    </div>
  )
}

// ─── Create link modal ────────────────────────────────────────────────────────

function CreateLinkModal() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('Storefront')
  const [customSlug, setCustomSlug] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [currency, setCurrency] = useState('')

  const createMutation = useCreateShareLink()

  const handleSubmit = () => {
    const body: CreateShareLinkInput = {
      name,
      target,
      customSlug: customSlug || undefined,
      expiresAt: expiresAt || undefined,
      currency: currency || undefined,
    }
    createMutation.mutate(body, {
      onSuccess: () => {
        setOpen(false)
        setName('')
        setTarget('Storefront')
        setCustomSlug('')
        setExpiresAt('')
        setCurrency('')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} aria-hidden="true" />
          Create Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-2 space-y-4">
          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
              Link Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paris Buyers — Winter 2025"
              className="w-full h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
              Target
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option>Storefront</option>
              <option>Collection</option>
              <option>Product</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
              Custom Slug
            </label>
            <div className="flex items-center rounded border border-border-warm focus-within:border-accent transition-colors overflow-hidden">
              <span className="px-3 h-9 flex items-center text-[13px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm shrink-0">
                solomonbharat.com/s/
              </span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="your-slug"
                className="flex-1 h-9 px-3 bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
              Currency Lock (optional)
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">No lock — buyer's preference</option>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose className="inline-flex items-center justify-center h-10 px-4 rounded border border-border-warm text-[14px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors">
            Cancel
          </DialogClose>
          <Button
            size="md"
            onClick={handleSubmit}
            disabled={!name || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy link"
      className="inline-flex items-center gap-1 text-[12px] font-[600] font-public-sans text-muted-text hover:text-primary transition-colors"
    >
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShareLinksPage() {
  const { data, isLoading } = useShareLinks()
  const updateMutation = useUpdateShareLink()
  const deleteMutation = useDeleteShareLink()

  const links: ShareLink[] = data ?? []

  const totalCommission = links.reduce((sum, l) => sum + (l.commissionSaved ?? 0), 0)
  const totalOrders = links.reduce((sum, l) => sum + (l.orders ?? 0), 0)

  const columns = [
    {
      key: 'name',
      label: 'Link Name',
      sortable: true,
      render: (val: unknown, row: unknown) => {
        const l = row as ShareLink
        return (
          <div>
            <p className="text-[14px] font-[500] font-public-sans text-primary">
              {l.name ?? l.slug}
            </p>
            <p className="text-[11px] font-public-sans text-muted-text mt-0.5">
              {typeof window !== 'undefined' ? window.location.origin : 'solomonbharat.com'}/s/{l.slug}
            </p>
          </div>
        )
      },
    },
    { key: 'target', label: 'Target', sortable: true },
    {
      key: 'views',
      label: 'Views',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px]">{Number(val).toLocaleString()}</span>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px]">{String(val)}</span>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue (INR)',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px]">₹{Number(val).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'commissionSaved',
      label: 'Commission Saved',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px] text-accent font-[600]">
          ₹{Number(val).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (val: unknown) => (
        <Badge variant={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_val: unknown, row: unknown) => {
        const l = row as ShareLink
        const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://solomonbharat.com'}/s/${l.slug}`
        const shareText = `Check out ${l.name ?? 'this store'} on Solomon Bharat: ${shareUrl}`
        return (
          <div className="flex items-center gap-3">
            <CopyButton slug={l.slug} />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share via WhatsApp"
              className="inline-flex items-center gap-1 text-[12px] font-[600] font-public-sans text-muted-text hover:text-success transition-colors"
            >
              <Share2 size={12} />
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() =>
                updateMutation.mutate({ id: l.id, active: !l.active })
              }
              disabled={updateMutation.isPending}
              className="text-[12px] font-[600] font-public-sans text-muted-text hover:text-primary transition-colors disabled:opacity-50"
            >
              {l.active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(l.id)}
              disabled={deleteMutation.isPending}
              aria-label="Delete link"
              className="inline-flex items-center text-[12px] font-[600] font-public-sans text-muted-text hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Share Links
        </h1>
        <CreateLinkModal />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard label="Total Links" value={String(links.length)} />
            <SummaryCard
              label="Commission Saved"
              value={`₹${totalCommission.toLocaleString('en-IN')}`}
            />
            <SummaryCard label="Orders via Share Links" value={String(totalOrders)} />
          </>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && links.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border-warm rounded">
          <p className="text-[16px] font-[500] font-public-sans text-primary mb-2">
            No share links yet
          </p>
          <p className="text-[13px] font-public-sans text-muted-text mb-5">
            Create private links to share your store or products directly with buyers.
          </p>
          <CreateLinkModal />
        </div>
      )}

      {/* Table */}
      {(isLoading || links.length > 0) && (
        isLoading ? (
          <div className="bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border-warm px-4 flex items-center gap-4">
                <div className="h-3 w-40 bg-muted-bg rounded" />
                <div className="h-3 w-20 bg-muted-bg rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={links as unknown as Record<string, unknown>[]}
            pageSize={8}
          />
        )
      )}
    </div>
  )
}
