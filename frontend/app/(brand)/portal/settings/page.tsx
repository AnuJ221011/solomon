'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, Link2, Trash2, X, Sparkles, RotateCcw, Loader2, FileText, ExternalLink, Download } from 'lucide-react'
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

const LEAD_TIMES = [
  { value: 'ONE_TO_THREE_DAYS', label: '1–3 days' },
  { value: 'ONE_TO_TWO_WEEKS', label: '1–2 weeks' },
  { value: 'TWO_TO_FOUR_WEEKS', label: '2–4 weeks' },
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

function Field({ label, hint, action, children }: { label: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em]">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="text-[11px] font-public-sans text-muted-text mt-1">{hint}</p>}
    </div>
  )
}

function PolishButton({ loading, canUndo, onPolish, onUndo }: {
  loading: boolean; canUndo: boolean; onPolish: () => void; onUndo: () => void
}) {
  if (canUndo) {
    return (
      <button type="button" onClick={onUndo}
        className="inline-flex items-center gap-1 text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors shrink-0">
        <RotateCcw size={11} />Undo
      </button>
    )
  }
  return (
    <button type="button" onClick={onPolish} disabled={loading}
      className="inline-flex items-center gap-1 text-[12px] font-[500] font-public-sans text-accent hover:opacity-70 transition-opacity disabled:opacity-40 shrink-0">
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
      {loading ? 'Polishing…' : 'Polish'}
    </button>
  )
}

function DocumentViewerModal({ label, field, onClose }: { label: string; field: string; onClose: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [ext, setExt] = useState<string>('pdf')
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.get('/brands/me/documents/doc-url', { params: { field }, headers: { 'Cache-Control': 'no-cache' } })
      .then((res) => {
        setSignedUrl(res.data.data.url)
        setExt(res.data.data.ext ?? 'pdf')
      })
      .catch(() => setError(true))
  }, [field])

  const isPdf = ext === 'pdf'

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (!signedUrl || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(signedUrl)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${label.replace(/\s+/g, '_')}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(signedUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="relative flex flex-col bg-white w-full h-full max-w-4xl max-h-[92vh] mx-auto my-auto rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-warm shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText size={15} className="text-accent" />
            <span className="text-[14px] font-[600] font-public-sans text-primary">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {signedUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-warm text-[12px] font-[600] font-public-sans text-muted-text hover:bg-muted-bg hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
              >
                <Download size={13} />
                {downloading ? 'Downloading…' : 'Download'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-warm text-muted-text hover:bg-muted-bg hover:text-primary transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted-bg flex items-center justify-center p-4">
          {error ? (
            <p className="text-[13px] font-public-sans text-muted-text">Failed to load document.</p>
          ) : !signedUrl ? (
            <p className="text-[13px] font-public-sans text-muted-text">Loading…</p>
          ) : isPdf ? (
            <iframe
              src={signedUrl}
              className="w-full h-full min-h-[600px] rounded-lg border border-border-warm bg-white"
              title={label}
            />
          ) : (
            <img
              src={signedUrl}
              alt={label}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentLink({ label, field, url, onOpen }: { label: string; field: string; url?: string | null; onOpen: (doc: { label: string; field: string }) => void }) {
  if (!url) return null
  return (
    <button
      type="button"
      onClick={() => onOpen({ label, field })}
      className="flex items-center gap-2.5 px-4 py-3 bg-muted-bg/40 border border-border-warm rounded hover:border-accent hover:bg-surface transition-all group w-full text-left"
    >
      <FileText size={15} className="text-muted-text group-hover:text-accent shrink-0" />
      <span className="text-[13px] font-[500] font-public-sans text-muted-text group-hover:text-primary flex-1">
        {label}
      </span>
      <ExternalLink size={12} className="text-muted-text group-hover:text-accent" />
    </button>
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
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Viewer'>('Viewer')
  const [docViewer, setDocViewer] = useState<{ label: string; field: string } | null>(null)

  // ── Brand profile fields ───────────────────────────────────────────────────
  const [brandName, setBrandName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('IN')
  const [yearFounded, setYearFounded] = useState('')
  const [brandStory, setBrandStory] = useState('')
  const [polishingStory, setPolishingStory] = useState(false)
  const [prevStory, setPrevStory] = useState<string | null>(null)

  async function polishStory() {
    if (!brandStory.trim()) return
    setPolishingStory(true)
    try {
      const res = await api.post('/products/ai/polish', { field: 'brandStory', value: brandStory })
      setPrevStory(brandStory)
      setBrandStory(res.data.data.cleaned)
      toast.success('Brand story polished.')
    } catch {
      toast.error('AI polish failed — try again.')
    } finally {
      setPolishingStory(false)
    }
  }

  function undoStory() {
    if (!prevStory) return
    setBrandStory(prevStory)
    setPrevStory(null)
  }

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
  const [returnsWindowDays, setReturnsWindowDays] = useState('')
  const [tagline, setTagline] = useState('')
  const [wholesaleProductCount, setWholesaleProductCount] = useState('')
  const [defaultLeadTime, setDefaultLeadTime] = useState('ONE_TO_TWO_WEEKS')

  // ── CSV export ─────────────────────────────────────────────────────────────
  const [csvExporting, setCsvExporting] = useState(false)

  async function handleCsvExport() {
    setCsvExporting(true)
    try {
      const res = await api.get('/products/me/export-csv', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `products_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setCsvExporting(false)
    }
  }

  // ── Logo / banner upload ───────────────────────────────────────────────────
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await api.post('/photos/brand/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setLogoPreview(res.data.data?.logoUrl ?? null)
      queryClient.invalidateQueries({ queryKey: ['my-brand-profile'] })
      toast.success('Logo updated.')
    } catch (err) {
      setLogoPreview(null)
      toast.error(getApiError(err))
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerPreview(URL.createObjectURL(file))
    setUploadingBanner(true)
    try {
      const fd = new FormData()
      fd.append('banner', file)
      const res = await api.post('/photos/brand/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setBannerPreview(res.data.data?.bannerUrl ?? null)
      queryClient.invalidateQueries({ queryKey: ['my-brand-profile'] })
      toast.success('Banner updated.')
    } catch (err) {
      setBannerPreview(null)
      toast.error(getApiError(err))
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

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

  // ── Shopify ────────────────────────────────────────────────────────────────
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [shopifyDomain, setShopifyDomain] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')
  const [shopifyWebhookSecret, setShopifyWebhookSecret] = useState('')

  const { data: shopifyStore, isLoading: shopifyLoading } = useQuery<{ shopDomain: string; isActive: boolean; lastSyncAt?: string } | null>({
    queryKey: ['shopify-store'],
    queryFn: () => api.get('/shopify/store').then((r) => r.data.data),
    retry: false,
  })
  const shopifyConnected = !!(shopifyStore?.isActive)

  const connectShopify = useMutation({
    mutationFn: (body: { shopDomain: string; accessToken: string; webhookSecret?: string }) =>
      api.post('/shopify/store/connect', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-store'] })
      toast.success('Shopify store connected.')
      setShowShopifyModal(false)
      setShopifyDomain('')
      setShopifyToken('')
      setShopifyWebhookSecret('')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const disconnectShopify = useMutation({
    mutationFn: () => api.delete('/shopify/store/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-store'] })
      toast.success('Shopify store disconnected.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const syncShopify = useMutation({
    mutationFn: () => api.post('/shopify/import-products'),
    onSuccess: (res) => {
      const { imported, skipped } = res.data.data ?? {}
      toast.success(`Sync complete — ${imported} imported, ${skipped} skipped.`)
      queryClient.invalidateQueries({ queryKey: ['shopify-store'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  // ── Populate brand profile form ────────────────────────────────────────────
  useEffect(() => {
    if (!brandProfile) return
    setBrandName(brandProfile.brandName ?? '')
    setPhone(brandProfile.phone ?? '')
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
    setReturnsWindowDays(brandProfile.returnsWindowDays != null ? String(brandProfile.returnsWindowDays) : '')
    setTagline(brandProfile.tagline ?? '')
    setWholesaleProductCount(brandProfile.wholesaleProductCount != null ? String(brandProfile.wholesaleProductCount) : '')
    setDefaultLeadTime(brandProfile.defaultLeadTime ?? 'ONE_TO_TWO_WEEKS')
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
      phone: phone.trim() || undefined,
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
      returnsWindowDays: returnsWindowDays !== '' ? Number(returnsWindowDays) : null,
      tagline: tagline.trim() || undefined,
      wholesaleProductCount: wholesaleProductCount !== '' ? Number(wholesaleProductCount) : undefined,
      defaultLeadTime: defaultLeadTime || undefined,
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
            <Field label="Phone number" hint="Used for WhatsApp communications. Include country code.">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210" className={INPUT_CLS} />
            </Field>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Tagline" hint="A short one-line pitch — shown under your brand name on your storefront.">
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                maxLength={120} placeholder="e.g. Handmade home décor from Rajasthan's artisan workshops" className={INPUT_CLS} />
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
            <Field label="Logo" hint="Square image, max 8 MB. Shown on your storefront and product cards.">
              <div className="flex items-center gap-3">
                {(logoPreview ?? brandProfile?.logoUrl) ? (
                  <img src={logoPreview ?? brandProfile.logoUrl} alt="Logo"
                    className="w-12 h-12 rounded border border-border-warm object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded border border-border-warm bg-muted-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-[16px] font-[600] font-playfair text-muted-text">
                      {brandName.slice(0, 2).toUpperCase() || '—'}
                    </span>
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors disabled:opacity-50">
                  <Upload size={13} aria-hidden="true" />
                  {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                </button>
              </div>
            </Field>
            <Field label="Banner" hint="Wide image (1600×400 recommended), max 8 MB.">
              <div className="flex items-center gap-3">
                {(bannerPreview ?? brandProfile?.bannerUrl) ? (
                  <img src={bannerPreview ?? brandProfile.bannerUrl} alt="Banner"
                    className="w-24 h-12 rounded border border-border-warm object-cover flex-shrink-0" />
                ) : (
                  <div className="w-24 h-12 rounded border border-border-warm bg-muted-bg flex-shrink-0" />
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                <button type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors disabled:opacity-50">
                  <Upload size={13} aria-hidden="true" />
                  {uploadingBanner ? 'Uploading…' : 'Upload Banner'}
                </button>
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Brand Story ────────────────────────────────────────────────────── */}
      <Section title="Brand Story" description="Tell buyers about your brand — this appears on your storefront.">
        <div className="space-y-5">
          <Field label="Brand Story" hint="Share your origin story and what makes your brand special (max 1000 characters)."
            action={<PolishButton loading={polishingStory} canUndo={!!prevStory} onPolish={polishStory} onUndo={undoStory} />}>
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
            <Field label="Returns Window (days)" hint="Leave blank to hide the returns policy on your product pages.">
              <div className="flex items-center rounded border border-border-warm focus-within:border-accent overflow-hidden transition-colors">
                <input type="number" min={1} max={365} value={returnsWindowDays} onChange={(e) => setReturnsWindowDays(e.target.value)}
                  placeholder="e.g. 60"
                  className="flex-1 h-9 px-3 bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none" />
                <span className="px-3 h-9 flex items-center text-[13px] font-public-sans text-muted-text bg-muted-bg border-l border-border-warm shrink-0">days</span>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Wholesale Product Count" hint="Roughly how many products you can offer wholesale.">
              <input type="number" min={1} value={wholesaleProductCount} onChange={(e) => setWholesaleProductCount(e.target.value)}
                placeholder="e.g. 25" className={INPUT_CLS} />
            </Field>
            <Field label="Default Lead Time" hint="Typical dispatch time for new orders — shown on your product pages unless overridden per product.">
              <select value={defaultLeadTime} onChange={(e) => setDefaultLeadTime(e.target.value)} className={INPUT_CLS}>
                {LEAD_TIMES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Submitted Documents ─────────────────────────────────────────────── */}
      <Section
        title="Submitted Documents"
        description="Identity and business documents you submitted during onboarding. These are reviewed by our team and cannot be edited here — contact support if you need to update one."
      >
        {(() => {
          const docs = [
            { label: 'Aadhar Card', field: 'aadharUrl', url: brandProfile?.aadharUrl },
            { label: 'PAN Card', field: 'panUrl', url: brandProfile?.panUrl },
            { label: 'GST Certificate', field: 'gstCertUrl', url: brandProfile?.gstCertUrl },
            { label: 'Incorporation Certificate', field: 'incorporateCertUrl', url: brandProfile?.incorporateCertUrl },
            { label: 'MSME Certificate', field: 'msmeCertUrl', url: brandProfile?.msmeCertUrl },
            { label: 'ISO Certificate', field: 'isoCertUrl', url: brandProfile?.isoCertUrl },
            { label: 'IEC Certificate', field: 'iecCertUrl', url: brandProfile?.iecCertUrl },
          ]
          const hasAny = docs.some((d) => d.url)
          return hasAny ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {docs.map((d) => (
                <DocumentLink key={d.field} label={d.label} field={d.field} url={d.url} onOpen={setDocViewer} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] font-public-sans text-muted-text">No documents on file.</p>
          )
        })()}
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
                  <span className="text-[12px] font-[600] font-public-sans text-muted-text">
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
          <div className="flex items-start gap-4 p-4 border border-border-warm rounded">
            <div className="w-10 h-10 rounded bg-[#96bf48]/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[13px] font-[600] font-public-sans text-[#96bf48]">Sp</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] font-[600] font-public-sans text-primary">Shopify</p>
                {shopifyConnected && (
                  <span className="inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans bg-success/10 text-success">
                    Connected
                  </span>
                )}
              </div>
              {shopifyConnected && shopifyStore?.shopDomain ? (
                <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                  {shopifyStore.shopDomain}
                  {shopifyStore.lastSyncAt && (
                    <span className="ml-2">· Last sync {new Date(shopifyStore.lastSyncAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                </p>
              ) : (
                <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                  Sync your product catalogue and inventory with your Shopify store.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {shopifyLoading ? (
                <span className="text-[12px] font-public-sans text-muted-text">Loading…</span>
              ) : shopifyConnected ? (
                <>
                  <Button variant="ghost" size="sm" className="gap-1.5"
                    disabled={syncShopify.isPending}
                    onClick={() => syncShopify.mutate()}>
                    {syncShopify.isPending ? 'Syncing…' : 'Sync Products'}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-error hover:text-error"
                    disabled={disconnectShopify.isPending}
                    onClick={() => disconnectShopify.mutate()}>
                    <Link2 size={12} />{disconnectShopify.isPending ? 'Disconnecting…' : 'Disconnect'}
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" className="gap-1.5"
                  onClick={() => setShowShopifyModal(true)}>
                  <Link2 size={12} />Connect Shopify
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 border border-border-warm rounded">
            <div className="w-10 h-10 rounded bg-muted-bg flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[12px] font-[600] font-public-sans text-muted-text">CSV</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-[600] font-public-sans text-primary">Export Catalogue</p>
              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                Download all your products as a CSV file. To import products from Shopify, use{' '}
                <a href="/portal/products/import" className="underline text-accent hover:text-accent/80">Import from Shopify</a>.
              </p>
            </div>
            <Button variant="ghost" size="sm" disabled={csvExporting} onClick={handleCsvExport} className="shrink-0">
              {csvExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Document viewer modal ───────────────────────────────────────────── */}
      {docViewer && (
        <DocumentViewerModal label={docViewer.label} field={docViewer.field} onClose={() => setDocViewer(null)} />
      )}

      {/* ── Shopify connect modal ──────────────────────────────────────────── */}
      {showShopifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border-warm rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm">
              <h2 className="text-[16px] font-[600] font-public-sans text-primary">Connect Shopify Store</h2>
              <button type="button" onClick={() => setShowShopifyModal(false)}
                className="text-muted-text hover:text-primary transition-colors">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-muted-bg/60 border border-border-warm rounded p-3 text-[12px] font-public-sans text-muted-text leading-relaxed">
                <p className="font-[600] text-primary mb-1">How to get your access token:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Go to <span className="font-[600]">Shopify Admin → Apps → Develop apps</span></li>
                  <li>Create a new app, then under <span className="font-[600]">Configuration</span> enable read_products, write_orders, read_inventory</li>
                  <li>Click <span className="font-[600]">Install app</span> and copy the Admin API access token</li>
                </ol>
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Shop Domain
                </label>
                <input
                  type="text"
                  value={shopifyDomain}
                  onChange={(e) => setShopifyDomain(e.target.value)}
                  placeholder="yourstore.myshopify.com"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Admin API Access Token
                </label>
                <input
                  type="password"
                  value={shopifyToken}
                  onChange={(e) => setShopifyToken(e.target.value)}
                  placeholder="shpat_••••••••••••••••"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-1.5">
                  Webhook Signing Secret <span className="normal-case font-[400] text-muted-text/70">(optional)</span>
                </label>
                <input
                  type="password"
                  value={shopifyWebhookSecret}
                  onChange={(e) => setShopifyWebhookSecret(e.target.value)}
                  placeholder="shpss_••••••••••••••••"
                  className={INPUT_CLS}
                />
                <p className="text-[11px] font-public-sans text-muted-text mt-1 leading-relaxed">
                  From the same app's API credentials page. Lets us verify that webhooks really came from your store — recommended if you register any.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="flex-1"
                  onClick={() => setShowShopifyModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" className="flex-1 gap-1.5"
                  disabled={!shopifyDomain.trim() || !shopifyToken.trim() || connectShopify.isPending}
                  onClick={() => connectShopify.mutate({
                    shopDomain: shopifyDomain.trim(),
                    accessToken: shopifyToken.trim(),
                    ...(shopifyWebhookSecret.trim() && { webhookSecret: shopifyWebhookSecret.trim() }),
                  })}>
                  <Link2 size={12} />
                  {connectShopify.isPending ? 'Connecting…' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
