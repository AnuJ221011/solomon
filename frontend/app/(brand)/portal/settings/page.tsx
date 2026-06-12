'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, Link2, Trash2, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = [
  'Textiles', 'Home Decor', 'Jewellery', 'Accessories', 'Apparel',
  'Food & Wellness', 'Art & Craft', 'Stationery', 'Other',
]

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

const SHIPPING_ZONES = [
  { key: 'DOMESTIC',      label: 'Domestic (India)' },
  { key: 'SOUTH_ASIA',    label: 'South Asia' },
  { key: 'SOUTHEAST_ASIA',label: 'Southeast Asia' },
  { key: 'MIDDLE_EAST',   label: 'Middle East' },
  { key: 'EUROPE',        label: 'Europe' },
  { key: 'NORTH_AMERICA', label: 'North America' },
  { key: 'OCEANIA',       label: 'Oceania' },
  { key: 'REST_OF_WORLD', label: 'Rest of World' },
]

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border border-border-warm rounded bg-surface mb-6">
      <div className="px-6 py-5 border-b border-border-warm">
        <h2 className="text-[18px] leading-[1.3] font-[400] font-public-sans text-primary">{title}</h2>
        {description && <p className="text-[13px] font-public-sans text-muted-text mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] font-public-sans text-muted-text mt-1">{hint}</p>}
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

interface ShippingRateRecord {
  id: string
  zone: string
  rateType: 'FLAT' | 'PER_KG'
  flatRateInr?: number | null
  perKgRateInr?: number | null
  freeShippingAboveInr?: number | null
}

interface ZoneRateState {
  flatRateInr: string
  freeShippingAboveInr: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [shopifyConnected, setShopifyConnected] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Viewer'>('Viewer')

  // ── Brand profile fields ───────────────────────────────────────────────────
  const [brandName, setBrandName] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('IN')
  const [yearFounded, setYearFounded] = useState('')
  const [brandStory, setBrandStory] = useState('')
  const [description, setDescription] = useState('')
  const [existingRetailPartners, setExistingRetailPartners] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>(PRODUCT_CATEGORIES)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const newCategoryRef = useRef<HTMLInputElement>(null)
  const [instagramHandle, setInstagramHandle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [businessRegNumber, setBusinessRegNumber] = useState('')
  const [minimumOrderValue, setMinimumOrderValue] = useState('')

  // ── Shipping zone state ────────────────────────────────────────────────────
  // map of zone key → { flatRateInr, freeShippingAboveInr }
  const [zoneRates, setZoneRates] = useState<Record<string, ZoneRateState>>(() =>
    Object.fromEntries(SHIPPING_ZONES.map((z) => [z.key, { flatRateInr: '', freeShippingAboveInr: '' }]))
  )
  const [savingShipping, setSavingShipping] = useState(false)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: team = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ['brand-team'],
    queryFn: () => api.get('/team').then((r) => r.data.data ?? []),
  })

  const { data: shippingRates = [] } = useQuery<ShippingRateRecord[]>({
    queryKey: ['shipping-rates'],
    queryFn: () => api.get('/shipping').then((r) => r.data.data ?? []),
  })

  const { data: brandProfile } = useQuery({
    queryKey: ['my-brand-profile'],
    queryFn: () => api.get('/brands/me/profile').then((r) => r.data.data),
  })

  // ── Populate brand profile form ────────────────────────────────────────────
  useEffect(() => {
    if (!brandProfile) return
    setBrandName(brandProfile.brandName ?? '')
    setCity(brandProfile.city ?? '')
    setStateName(brandProfile.state ?? '')
    setCountryOfOrigin(brandProfile.countryOfOrigin ?? 'IN')
    setYearFounded(brandProfile.yearFounded != null ? String(brandProfile.yearFounded) : '')
    setBrandStory(brandProfile.brandStory ?? '')
    setDescription(brandProfile.description ?? '')
    setExistingRetailPartners(brandProfile.existingRetailPartners ?? '')
    const saved: string[] = brandProfile.category ?? []
    setCategories(saved)
    const extra = saved.filter((c: string) => !PRODUCT_CATEGORIES.includes(c))
    if (extra.length) setCategoryOptions([...PRODUCT_CATEGORIES, ...extra])
    setInstagramHandle(brandProfile.instagramHandle ?? '')
    setWebsiteUrl(brandProfile.websiteUrl ?? '')
    setGstNumber(brandProfile.gstNumber ?? '')
    setBusinessRegNumber(brandProfile.businessRegNumber ?? '')
    setMinimumOrderValue(brandProfile.minimumOrderValue != null ? String(brandProfile.minimumOrderValue) : '')
  }, [brandProfile])

  // ── Populate shipping zone rates ───────────────────────────────────────────
  useEffect(() => {
    if (!shippingRates.length) return
    setZoneRates((prev) => {
      const next = { ...prev }
      for (const r of shippingRates) {
        next[r.zone] = {
          flatRateInr: r.flatRateInr != null ? String(r.flatRateInr) : '',
          freeShippingAboveInr: r.freeShippingAboveInr != null ? String(r.freeShippingAboveInr) : '',
        }
      }
      return next
    })
  }, [shippingRates])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateProfile = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch('/brands/me/profile', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-brand-profile'] })
      toast.success('Profile saved.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  function handleSaveProfile() {
    updateProfile.mutate({
      brandName: brandName.trim() || undefined,
      city: city.trim() || undefined,
      state: stateName.trim() || undefined,
      countryOfOrigin: countryOfOrigin || undefined,
      yearFounded: yearFounded ? Number(yearFounded) : undefined,
      brandStory: brandStory.trim() || undefined,
      description: description.trim() || undefined,
      existingRetailPartners: existingRetailPartners.trim() || undefined,
      category: categories.length ? categories : undefined,
      instagramHandle: instagramHandle.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
      businessRegNumber: businessRegNumber.trim() || undefined,
      minimumOrderValue: minimumOrderValue !== '' ? Number(minimumOrderValue) : undefined,
    })
  }

  async function handleSaveShipping() {
    const zonesToSave = SHIPPING_ZONES.filter(
      (z) => zoneRates[z.key]?.flatRateInr.trim() !== ''
    )
    if (!zonesToSave.length) {
      toast.error('Enter a flat rate for at least one zone.')
      return
    }
    setSavingShipping(true)
    try {
      await Promise.all(
        zonesToSave.map((z) => {
          const rate = zoneRates[z.key]
          return api.put('/shipping/zone', {
            zone: z.key,
            rateType: 'FLAT',
            flatRateInr: Number(rate.flatRateInr),
            ...(rate.freeShippingAboveInr.trim() !== '' && {
              freeShippingAboveInr: Number(rate.freeShippingAboveInr),
            }),
          })
        })
      )
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
      toast.success('Shipping rates saved.')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSavingShipping(false)
    }
  }

  function setZoneField(zoneKey: string, field: keyof ZoneRateState, value: string) {
    setZoneRates((prev) => ({ ...prev, [zoneKey]: { ...prev[zoneKey], [field]: value } }))
  }

  function toggleCategory(cat: string) {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])
  }

  function confirmNewCategory() {
    const val = newCategoryInput.trim()
    if (!val) return
    if (!categoryOptions.includes(val)) setCategoryOptions((prev) => [...prev, val])
    setCategories((prev) => prev.includes(val) ? prev : [...prev, val])
    setNewCategoryInput('')
    setShowNewCategoryInput(false)
  }

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

  const roleBadgeVariant = (role: string) => {
    if (role === 'Owner') return 'primary' as const
    if (role === 'Manager') return 'accent' as const
    return 'default' as const
  }

  return (
    <div>
      <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-6">Settings</h1>

      {/* ── Brand Profile ──────────────────────────────────────────────────── */}
      <Section title="Brand Profile" description="Basic information about your brand.">
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Brand Name">
              <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your brand name" className={INPUT_CLS} />
            </Field>
            <Field label="Country of Origin">
              <select value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} className={INPUT_CLS}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="City">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Jaipur" className={INPUT_CLS} />
            </Field>
            <Field label="State">
              <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Rajasthan" className={INPUT_CLS} />
            </Field>
            <Field label="Year Founded">
              <input type="number" value={yearFounded} onChange={(e) => setYearFounded(e.target.value)}
                placeholder="e.g. 2018" className={INPUT_CLS} />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Logo">
              <div className="flex items-center gap-3">
                {brandProfile?.logoUrl ? (
                  <img src={brandProfile.logoUrl} alt="Logo"
                    className="w-12 h-12 rounded border border-border-warm object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded border border-border-warm bg-muted-bg flex items-center justify-center">
                    <span className="text-[16px] font-[700] font-playfair text-muted-text">
                      {brandName.slice(0, 2).toUpperCase() || '—'}
                    </span>
                  </div>
                )}
                <button type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors">
                  <Upload size={13} />Upload Logo
                </button>
              </div>
            </Field>
            <Field label="Banner">
              <div className="flex items-center gap-3">
                {brandProfile?.bannerUrl ? (
                  <img src={brandProfile.bannerUrl} alt="Banner"
                    className="w-20 h-12 rounded border border-border-warm object-cover" />
                ) : (
                  <div className="w-20 h-12 rounded border border-border-warm bg-muted-bg" />
                )}
                <button type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors">
                  <Upload size={13} />Upload Banner
                </button>
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Brand Story ────────────────────────────────────────────────────── */}
      <Section title="Brand Story" description="Tell buyers about your brand — this appears on your storefront.">
        <div className="space-y-5">
          <Field label="Brand Story" hint="Share your origin story and what makes your brand special (max 1000 characters).">
            <textarea rows={5} value={brandStory} onChange={(e) => setBrandStory(e.target.value)}
              maxLength={1000} placeholder="Tell us the story behind your brand..." className={TEXTAREA_CLS} />
            <p className="text-[11px] font-public-sans text-muted-text mt-1 text-right">{brandStory.length}/1000</p>
          </Field>
          <Field label="Short Description" hint="Shown on search and category pages.">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your brand..." className={TEXTAREA_CLS} />
          </Field>
          <Field label="Existing Retail Partners" hint="List any current stores or platforms where your products are sold.">
            <textarea rows={3} value={existingRetailPartners} onChange={(e) => setExistingRetailPartners(e.target.value)}
              maxLength={500} placeholder="e.g. Nykaa, local boutiques in Mumbai..." className={TEXTAREA_CLS} />
          </Field>
        </div>
      </Section>

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      <Section title="Product Categories" description="The categories your products fall under.">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((cat) => (
            <button key={cat} type="button" onClick={() => toggleCategory(cat)}
              className={cn(
                'px-3 py-2 rounded border text-[13px] font-[500] font-public-sans transition-colors',
                categories.includes(cat)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-muted-text border-border-warm hover:border-primary/40 hover:text-primary',
              )}>
              {cat}
            </button>
          ))}

          {showNewCategoryInput ? (
            <div className="flex items-center gap-1.5 rounded border border-accent px-2 py-1">
              <input ref={newCategoryRef} value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmNewCategory() }
                  if (e.key === 'Escape') { setShowNewCategoryInput(false); setNewCategoryInput('') }
                }}
                placeholder="Category name"
                className="text-[13px] font-public-sans text-primary bg-transparent outline-none w-32"
                autoFocus />
              <button type="button" onClick={confirmNewCategory} className="text-accent hover:text-primary transition-colors">
                <Plus size={13} />
              </button>
              <button type="button" onClick={() => { setShowNewCategoryInput(false); setNewCategoryInput('') }}
                className="text-muted-text hover:text-primary transition-colors">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button type="button"
              onClick={() => { setShowNewCategoryInput(true); setTimeout(() => newCategoryRef.current?.focus(), 50) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded border border-dashed border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:border-accent hover:text-accent transition-colors">
              <Plus size={13} />New category
            </button>
          )}
        </div>
        {categories.length === 0 && (
          <p className="text-[12px] font-public-sans text-error mt-3">Please select at least one category.</p>
        )}
      </Section>

      {/* ── Online Presence ─────────────────────────────────────────────────── */}
      <Section title="Online Presence" description="Your website and social media links.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Field label="Instagram Handle">
            <div className="flex items-center rounded border border-border-warm focus-within:border-accent overflow-hidden transition-colors">
              <span className="px-3 h-9 flex items-center text-[13px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm shrink-0">@</span>
              <input type="text" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="yourhandle"
                className="flex-1 h-9 px-3 bg-transparent text-[14px] font-public-sans text-primary focus:outline-none" />
            </div>
          </Field>
          <Field label="Website URL">
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourbrand.com" className={INPUT_CLS} />
          </Field>
        </div>
      </Section>

      {/* ── Business Details ────────────────────────────────────────────────── */}
      <Section title="Business Details" description="Legal and operational details for your brand.">
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="GST Number">
              <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g. 22AAAAA0000A1Z5" className={INPUT_CLS} />
            </Field>
            <Field label="Business Registration Number">
              <input type="text" value={businessRegNumber} onChange={(e) => setBusinessRegNumber(e.target.value)}
                placeholder="e.g. U74999MH2020PTC123456" className={INPUT_CLS} />
            </Field>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Minimum Order Value (₹)" hint="Minimum order value buyers must meet to place an order.">
              <div className="flex items-center rounded border border-border-warm focus-within:border-accent overflow-hidden transition-colors">
                <span className="px-3 h-9 flex items-center text-[13px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm shrink-0">₹</span>
                <input type="number" min={0} value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)}
                  placeholder="e.g. 5000"
                  className="flex-1 h-9 px-3 bg-transparent text-[14px] font-public-sans text-primary focus:outline-none" />
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Save profile ────────────────────────────────────────────────────── */}
      <div className="flex justify-end mb-6">
        <Button size="md" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* ── Shipping Zones ──────────────────────────────────────────────────── */}
      <Section title="Shipping Zones" description="Set flat shipping rates per zone. Leave a rate blank to disable that zone.">
        <div className="divide-y divide-border-warm">
          {SHIPPING_ZONES.map((z) => (
            <div key={z.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <p className="flex-1 min-w-0 text-[14px] font-[500] font-public-sans text-primary">{z.label}</p>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-public-sans text-muted-text hidden sm:inline">Flat rate</span>
                <div className="flex items-center rounded border border-border-warm focus-within:border-accent overflow-hidden transition-colors">
                  <span className="px-2.5 h-8 flex items-center text-[12px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={zoneRates[z.key]?.flatRateInr ?? ''}
                    onChange={(e) => setZoneField(z.key, 'flatRateInr', e.target.value)}
                    placeholder="—"
                    className="w-20 h-8 px-2 bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none text-right tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-public-sans text-muted-text hidden sm:inline">Free above</span>
                <div className="flex items-center rounded border border-border-warm focus-within:border-accent overflow-hidden transition-colors">
                  <span className="px-2.5 h-8 flex items-center text-[12px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={zoneRates[z.key]?.freeShippingAboveInr ?? ''}
                    onChange={(e) => setZoneField(z.key, 'freeShippingAboveInr', e.target.value)}
                    placeholder="—"
                    className="w-24 h-8 px-2 bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none text-right tabular-nums"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-border-warm">
          <Button size="sm" onClick={handleSaveShipping} disabled={savingShipping}>
            {savingShipping ? 'Saving…' : 'Save Shipping'}
          </Button>
        </div>
      </Section>

      {/* ── Team Members ────────────────────────────────────────────────────── */}
      <Section title="Team Members" description="Manage who has access to your brand portal.">
        {teamLoading ? (
          <div className="space-y-2 mb-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted-bg rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1 mb-4">
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-4 py-3 border-b border-border-warm last:border-0">
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
                <span className="text-[12px] font-public-sans text-muted-text shrink-0">Joined {member.joinedAt}</span>
                {member.role !== 'Owner' && (
                  <button type="button" aria-label="Remove member"
                    onClick={() => removeMember.mutate(member.id)} disabled={removeMember.isPending}
                    className="text-muted-text hover:text-error transition-colors">
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
          <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@brand.com"
            className="flex-1 h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'Manager' | 'Viewer')}
            className="h-9 px-2 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors">
            <option value="Manager">Manager</option>
            <option value="Viewer">Viewer</option>
          </select>
          <Button variant="ghost" size="sm" className="gap-1.5"
            disabled={!inviteEmail.trim() || inviteMember.isPending}
            onClick={() => inviteMember.mutate({ email: inviteEmail.trim(), role: inviteRole })}>
            <Plus size={13} />Invite
          </Button>
        </div>
      </Section>

      {/* ── Integrations ────────────────────────────────────────────────────── */}
      <Section title="Integrations" description="Connect your store and manage data sync.">
        <div className="space-y-4">
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
              {shopifyConnected && <Badge variant="success">Connected</Badge>}
              <Button variant={shopifyConnected ? 'ghost' : 'primary'} size="sm" className="gap-1.5"
                onClick={() => setShopifyConnected((v) => !v)}>
                <Link2 size={12} />{shopifyConnected ? 'Disconnect' : 'Connect Shopify'}
              </Button>
            </div>
          </div>
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
              <Button variant="ghost" size="sm" className="gap-1.5"><Upload size={12} />Import</Button>
              <Button variant="ghost" size="sm">Export</Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
