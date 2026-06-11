'use client'

import { useState } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Buyer'
  addedAt: string
}

interface NotifToggle {
  id: string
  label: string
  description: string
  enabled: boolean
}

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'SGD']

const STORE_TYPES = [
  'Boutique Retail', 'Gift Shop', 'Department Store', 'Online Retailer',
  'Interior Design Studio', 'Spa & Wellness', 'Museum Shop', 'Other',
]

const COUNTRIES = [
  'United States', 'United Kingdom', 'Australia', 'Canada',
  'Germany', 'France', 'Japan', 'Singapore', 'India', 'UAE',
]

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-border-warm rounded bg-surface p-6 space-y-5">
      <div className="pb-4 border-b border-border-warm">
        <h2 className="text-[18px] font-[600] font-public-sans text-primary">{title}</h2>
        {description && (
          <p className="text-[14px] font-public-sans text-muted-text mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  htmlFor,
}: {
  label: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[14px] font-[600] font-public-sans text-primary sm:w-[200px] flex-shrink-0"
      >
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Input({
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly,
}: {
  id?: string
  value: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        'w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30',
        'text-[14px] font-public-sans text-primary placeholder:text-muted-text',
        'focus:outline-none focus:border-primary/40 focus:bg-surface',
        'transition-colors duration-150',
        readOnly && 'opacity-60 cursor-not-allowed bg-muted-bg'
      )}
    />
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

function SelectField({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30',
        'text-[14px] font-public-sans text-primary',
        'focus:outline-none focus:border-primary/40 focus:bg-surface',
        'transition-colors duration-150 appearance-none cursor-pointer'
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label htmlFor={id} className="text-[14px] font-[600] font-public-sans text-primary cursor-pointer">
          {label}
        </label>
        <p className="text-[13px] font-public-sans text-muted-text mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 rounded border mt-0.5',
          'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          checked ? 'bg-accent border-accent' : 'bg-muted-bg border-border-warm'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded bg-white shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  // Store profile state — pre-filled from real auth user
  const [businessName, setBusinessName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('United States')
  const [storeType, setStoreType] = useState('Boutique Retail')
  const [profileSaved, setProfileSaved] = useState(false)

  // Preferences state
  const [currency, setCurrency] = useState('USD')

  // Notifications state
  const [notifToggles, setNotifToggles] = useState<NotifToggle[]>([
    {
      id: 'n1',
      label: 'New arrivals from saved brands',
      description: 'Get notified when brands you follow add new products.',
      enabled: true,
    },
    {
      id: 'n2',
      label: 'Order status updates',
      description: 'Confirmations, dispatch alerts, and delivery notifications.',
      enabled: true,
    },
    {
      id: 'n3',
      label: 'Platform promotions',
      description: 'Seasonal campaigns, special rates, and platform news.',
      enabled: false,
    },
  ])

  // Team — from API
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ['buyer-team'],
    queryFn: () => api.get('/team').then((r) => r.data.data ?? []),
  })

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Buyer'>('Buyer')

  const removeMember = useMutation({
    mutationFn: (id: string) => api.delete(`/team/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buyer-team'] }),
    onError: (err) => toast.error(getApiError(err)),
  })

  const inviteMember = useMutation({
    mutationFn: (body: { email: string; role: string }) => api.post('/team', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['buyer-team'] }); setInviteEmail('') },
    onError: (err) => toast.error(getApiError(err)),
  })

  function saveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  function toggleNotif(id: string, enabled: boolean) {
    setNotifToggles((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled } : n))
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Settings
        </h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          Manage your store profile, preferences, and team access.
        </p>
      </div>

      <div className="space-y-6">
        {/* Store Profile */}
        <Section
          title="Store Profile"
          description="Your business details as they appear on orders and invoices."
        >
          <Field label="Business Name" htmlFor="business-name">
            <Input id="business-name" value={businessName} onChange={setBusinessName} placeholder="Your boutique name" />
          </Field>
          <Field label="Email Address" htmlFor="email">
            <Input id="email" type="email" value={email} onChange={setEmail} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" type="tel" value={phone} onChange={setPhone} placeholder="+1 212 555 0000" />
          </Field>
          <Field label="Country" htmlFor="country">
            <SelectField id="country" value={country} onChange={setCountry} options={COUNTRIES} />
          </Field>
          <Field label="Store Type" htmlFor="store-type">
            <SelectField id="store-type" value={storeType} onChange={setStoreType} options={STORE_TYPES} />
          </Field>

          <div className="pt-2 flex items-center gap-3">
            <Button variant="primary" size="md" onClick={saveProfile}>
              Save Profile
            </Button>
            {profileSaved && (
              <span className="text-[13px] font-[500] font-public-sans text-success">
                Saved successfully.
              </span>
            )}
          </div>
        </Section>

        {/* Preferences */}
        <Section
          title="Preferences"
          description="Adjust how Solomon Bharat works for your store."
        >
          <Field label="Display Currency" htmlFor="currency">
            <SelectField id="currency" value={currency} onChange={setCurrency} options={CURRENCIES} />
          </Field>
          <Field label="Store Type Quiz">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-public-sans text-muted-text">
                Your profile: Boutique &middot; Artisan &middot; Textiles &amp; Jewellery
              </span>
              <a
                href="/onboarding"
                className="text-[13px] font-[600] font-public-sans text-accent hover:text-accent-hover underline underline-offset-2 transition-colors whitespace-nowrap"
              >
                Update quiz
              </a>
            </div>
          </Field>
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Choose which emails you receive from us."
        >
          <div className="space-y-4">
            {notifToggles.map((toggle) => (
              <ToggleRow
                key={toggle.id}
                id={toggle.id}
                label={toggle.label}
                description={toggle.description}
                checked={toggle.enabled}
                onChange={(v) => toggleNotif(toggle.id, v)}
              />
            ))}
          </div>
        </Section>

        {/* Team */}
        <Section
          title="Team"
          description="Invite colleagues to browse and place orders on your behalf."
        >
          {/* Members table */}
          <div className="border border-border-warm rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-muted-bg/40">
                  {['Name', 'Email', 'Role', 'Added', ''].map((col, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[14px] font-public-sans text-muted-text">
                      Loading team…
                    </td>
                  </tr>
                )}
                {!teamLoading && teamMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[14px] font-public-sans text-muted-text">
                      No team members yet.
                    </td>
                  </tr>
                )}
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-border-warm last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-[600] font-public-sans text-primary">
                        {member.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-public-sans text-muted-text">
                        {member.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-2 py-0.5',
                          'text-[12px] font-[500] font-public-sans',
                          member.role === 'Admin'
                            ? 'bg-accent/10 text-accent-hover'
                            : 'bg-muted-bg text-muted-text'
                        )}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-public-sans text-muted-text whitespace-nowrap">
                        {new Date(member.addedAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => removeMember.mutate(member.id)}
                          disabled={removeMember.isPending}
                          aria-label={`Remove ${member.name}`}
                          className="text-muted-text hover:text-error transition-colors p-1"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invite row */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className={cn(
                'flex-1 h-10 px-3 rounded border border-border-warm bg-muted-bg/30',
                'text-[14px] font-public-sans text-primary placeholder:text-muted-text',
                'focus:outline-none focus:border-primary/40 focus:bg-surface transition-colors'
              )}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Buyer')}
              className={cn(
                'h-10 px-3 rounded border border-border-warm bg-muted-bg/30',
                'text-[14px] font-public-sans text-primary',
                'focus:outline-none focus:border-primary/40 focus:bg-surface transition-colors appearance-none cursor-pointer'
              )}
            >
              <option value="Buyer">Buyer</option>
              <option value="Admin">Admin</option>
            </select>
            <Button
              variant="primary"
              size="md"
              onClick={() => inviteMember.mutate({ email: inviteEmail.trim(), role: inviteRole })}
              disabled={!inviteEmail.trim() || inviteMember.isPending}
              className="gap-1.5"
            >
              <UserPlus size={14} aria-hidden="true" />
              Invite Member
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}
