'use client'

import { useState } from 'react'
import { Plus, Upload, Link2, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border border-border-warm rounded bg-surface mb-6">
      <div className="px-6 py-5 border-b border-border-warm">
        <h2 className="text-[18px] leading-[1.3] font-[400] font-public-sans text-primary">{title}</h2>
        {description && (
          <p className="text-[13px] font-public-sans text-muted-text mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLS =
  'w-full h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors'

const TEXTAREA_CLS =
  'w-full px-3 py-2 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Manager' | 'Viewer'
  joinedAt: string
}

interface ShippingZone {
  id: string
  name: string
  countries: string
  rate: number
  freeThreshold?: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [shopifyConnected, setShopifyConnected] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Viewer'>('Viewer')

  const { data: team = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ['brand-team'],
    queryFn: () => api.get('/team').then((r) => r.data.data ?? []),
  })

  const { data: zones = [], isLoading: zonesLoading } = useQuery<ShippingZone[]>({
    queryKey: ['shipping-zones'],
    queryFn: () => api.get('/shipping').then((r) => r.data.data ?? []),
  })

  const { data: brandProfile } = useQuery({
    queryKey: ['my-brand-profile'],
    queryFn: () => api.get('/brands/me/profile').then((r) => r.data.data),
  })

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.delete(`/team/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-team'] }),
    onError: (err) => toast.error(getApiError(err)),
  })

  const inviteMember = useMutation({
    mutationFn: (body: { email: string; role: string }) => api.post('/team', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brand-team'] }); setInviteEmail('') },
    onError: (err) => toast.error(getApiError(err)),
  })

  const saveShipping = useMutation({
    mutationFn: (zone: { zone: string; rateType: string; rate: number; freeThreshold?: number }) =>
      api.put('/shipping/zone', zone),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Shipping saved.') },
    onError: (err) => toast.error(getApiError(err)),
  })

  const roleBadgeVariant = (role: string) => {
    if (role === 'Owner') return 'primary' as const
    if (role === 'Manager') return 'accent' as const
    return 'default' as const
  }

  return (
    <div>
      <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-6">
        Settings
      </h1>

      {/* Brand Profile */}
      <Section
        title="Brand Profile"
        description="This information appears on your brand storefront and product pages."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Brand Name">
              <input
                type="text"
                defaultValue={brandProfile?.name ?? ''}
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Location">
              <input
                type="text"
                defaultValue={brandProfile?.location ?? ''}
                className={INPUT_CLS}
              />
            </Field>
          </div>

          <Field label="Tagline">
            <input
              type="text"
              defaultValue={brandProfile?.tagline ?? ''}
              className={INPUT_CLS}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={4}
              defaultValue={brandProfile?.description ?? ''}
              className={TEXTAREA_CLS}
            />
          </Field>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded border border-border-warm bg-muted-bg flex items-center justify-center">
                  <span className="text-[16px] font-[700] font-playfair text-muted-text">AR</span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors"
                >
                  <Upload size={13} aria-hidden="true" />
                  Upload Logo
                </button>
              </div>
            </Field>

            <Field label="Banner">
              <div className="flex items-center gap-3">
                <div className="w-20 h-12 rounded border border-border-warm bg-muted-bg" />
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors"
                >
                  <Upload size={13} aria-hidden="true" />
                  Upload Banner
                </button>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Field label="Instagram">
              <div className="flex items-center rounded border border-border-warm focus-within:border-accent overflow-hidden transition-colors">
                <span className="px-3 h-9 flex items-center text-[13px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm shrink-0">
                  @
                </span>
                <input
                  type="text"
                  defaultValue={brandProfile?.instagramHandle ?? ''}
                  className="flex-1 h-9 px-3 bg-transparent text-[14px] font-public-sans text-primary focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Website">
              <input type="url" defaultValue={brandProfile?.website ?? ''} className={INPUT_CLS} />
            </Field>
            <Field label="Year Founded">
              <input type="number" defaultValue={brandProfile?.yearFounded ?? ''} className={INPUT_CLS} />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="md">Save Changes</Button>
          </div>
        </div>
      </Section>

      {/* Shipping Zones */}
      <Section title="Shipping Zones" description="Configure flat-rate shipping per zone. Free shipping threshold applies per order.">
        {zonesLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted-bg rounded animate-pulse" />
            ))}
          </div>
        )}
        {!zonesLoading && (
          <>
          <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-4 py-3 border-b border-border-warm last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-[600] font-public-sans text-primary">{zone.name}</p>
                <p className="text-[12px] font-public-sans text-muted-text">{zone.countries}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-public-sans text-muted-text">Flat rate</span>
                <div className="flex items-center rounded border border-border-warm overflow-hidden">
                  <span className="px-2.5 h-8 flex items-center text-[12px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm">
                    ₹
                  </span>
                  <input
                    type="number"
                    defaultValue={zone.rate}
                    className="w-20 h-8 px-2 bg-transparent text-[14px] font-public-sans text-primary focus:outline-none text-right tabular-nums"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-public-sans text-muted-text">Free above</span>
                <div className="flex items-center rounded border border-border-warm overflow-hidden">
                  <span className="px-2.5 h-8 flex items-center text-[12px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm">
                    ₹
                  </span>
                  <input
                    type="number"
                    defaultValue={zone.freeThreshold ?? ''}
                    placeholder="—"
                    className="w-24 h-8 px-2 bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none text-right tabular-nums"
                  />
                </div>
              </div>
              <button
                type="button"
                aria-label="Remove zone"
                className="text-muted-text hover:text-error transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-warm">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Plus size={13} />
            Add Zone
          </Button>
          <Button size="sm" onClick={() => saveShipping.mutate({ zone: 'CUSTOM', rateType: 'FLAT', rate: 0 })}>
            Save Shipping
          </Button>
        </div>
          </>
        )}
      </Section>

      {/* Team Members */}
      <Section title="Team Members" description="Manage who has access to your brand portal.">
        {teamLoading && (
          <div className="space-y-2 mb-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted-bg rounded animate-pulse" />
            ))}
          </div>
        )}
        {!teamLoading && (
          <div className="space-y-1 mb-4">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 py-3 border-b border-border-warm last:border-0"
              >
                <div className="w-9 h-9 rounded bg-muted-bg flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-[700] font-public-sans text-muted-text">
                    {member.name?.split(' ').filter(Boolean).map((n) => n[0]).join('') ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-[500] font-public-sans text-primary">{member.name}</p>
                  <p className="text-[12px] font-public-sans text-muted-text">{member.email}</p>
                </div>
                <Badge variant={roleBadgeVariant(member.role)}>{member.role}</Badge>
                <span className="text-[12px] font-public-sans text-muted-text shrink-0">
                  Joined {member.joinedAt}
                </span>
                {member.role !== 'Owner' && (
                  <button
                    type="button"
                    aria-label="Remove member"
                    onClick={() => removeMember.mutate(member.id)}
                    disabled={removeMember.isPending}
                    className="text-muted-text hover:text-error transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {team.length === 0 && (
              <p className="text-[14px] font-public-sans text-muted-text py-3">No team members yet.</p>
            )}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@brand.com"
            className="flex-1 h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'Manager' | 'Viewer')}
            className="h-9 px-2 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="Manager">Manager</option>
            <option value="Viewer">Viewer</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            disabled={!inviteEmail.trim() || inviteMember.isPending}
            onClick={() => inviteMember.mutate({ email: inviteEmail.trim(), role: inviteRole })}
          >
            <Plus size={13} />
            Invite
          </Button>
        </div>
      </Section>

      {/* Integrations */}
      <Section title="Integrations" description="Connect your store and manage data sync.">
        <div className="space-y-4">
          {/* Shopify */}
          <div className="flex items-center gap-4 p-4 border border-border-warm rounded">
            <div className="w-10 h-10 rounded bg-muted-bg flex items-center justify-center shrink-0">
              <span className="text-[14px] font-[700] font-public-sans text-muted-text">Sp</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-[600] font-public-sans text-primary">Shopify</p>
              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                Sync product catalogue and inventory with your Shopify store.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {shopifyConnected && (
                <Badge variant="success">Connected</Badge>
              )}
              <Button
                variant={shopifyConnected ? 'ghost' : 'primary'}
                size="sm"
                className="gap-1.5"
                onClick={() => setShopifyConnected((v) => !v)}
              >
                <Link2 size={12} />
                {shopifyConnected ? 'Disconnect' : 'Connect Shopify'}
              </Button>
            </div>
          </div>

          {/* CSV */}
          <div className="flex items-center gap-4 p-4 border border-border-warm rounded">
            <div className="w-10 h-10 rounded bg-muted-bg flex items-center justify-center shrink-0">
              <span className="text-[12px] font-[700] font-public-sans text-muted-text">CSV</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-[600] font-public-sans text-primary">CSV Import / Export</p>
              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                Bulk manage products, orders, and payouts via CSV files.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Upload size={12} />
                Import
              </Button>
              <Button variant="ghost" size="sm">
                Export
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
