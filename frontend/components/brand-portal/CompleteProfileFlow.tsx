'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MissingKey = 'brandStory' | 'identityDocs' | 'bankDetails'
export interface MissingItem {
  key: MissingKey
  label: string
}

const STEP_ORDER: MissingKey[] = ['brandStory', 'identityDocs', 'bankDetails']

interface BankForm {
  accountHolderName: string
  bankName: string
  accountNumber: string
  confirmAccountNumber: string
  ifscCode: string
  accountType: 'SAVINGS' | 'CURRENT'
  upiId: string
}

const EMPTY_BANK_FORM: BankForm = {
  accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '',
  ifscCode: '', accountType: 'SAVINGS', upiId: '',
}

const INPUT_CLS =
  'w-full h-10 rounded border border-[#D4D0C8] bg-white px-3.5 text-[14px] font-public-sans text-[#1A1A1A] placeholder:text-[#B0ACA3] focus:outline-none focus:border-[#A68B67] transition-colors'

// ─── Referral link — copyable, shown once the profile is already complete ────

function CopyLinkRow() {
  const [copied, setCopied] = useState(false)
  const displayUrl = typeof window !== 'undefined' ? window.location.host : 'solomonbharat.com'

  function handleCopy() {
    const fullUrl = typeof window !== 'undefined' ? window.location.origin : 'https://solomonbharat.com'
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded border border-[#E5E1D8] bg-[#F9F7F2]">
      <span className="text-[13px] font-[500] font-public-sans text-[#1A1A1A] truncate">{displayUrl}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 text-[12px] font-[600] font-public-sans text-[#A68B67] hover:opacity-70 transition-opacity shrink-0"
      >
        {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

// ─── Intro screen — summary + single CTA into the step wizard ────────────────

function IntroScreen({ missing, onStart, onDismiss }: {
  missing: MissingItem[]
  onStart: () => void
  onDismiss: () => void
}) {
  const allDone = missing.length === 0
  return (
    <>
      <DialogHeader>
        <DialogTitle>{allDone ? 'Your profile is complete' : 'Complete your profile'}</DialogTitle>
        <DialogDescription>
          {allDone
            ? "Nice — you've completed your profile. Your application is still under review; we'll notify you as soon as you're verified. Increase your chance to get verified by referring people."
            : 'Complete your profile to increase your chances of getting verified soon — it also helps buyers trust your brand and is required before you can receive payouts.'}
        </DialogDescription>
      </DialogHeader>
      {!allDone && (
        <div className="px-6 pb-2 space-y-2">
          {missing.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded border border-[#E5E1D8]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#A68B67] shrink-0" aria-hidden="true" />
              <span className="text-[14px] font-[500] font-public-sans text-[#1A1A1A]">{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {allDone && (
        <div className="px-6 pb-2">
          <CopyLinkRow />
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E1D8]">
        <DialogClose
          onClick={onDismiss}
          className="text-[13px] font-[600] font-public-sans text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
        >
          {allDone ? 'Got it' : 'Maybe later'}
        </DialogClose>
        {!allDone && (
          <Button variant="accent" size="md" onClick={onStart}>
            Complete Profile
          </Button>
        )}
      </div>
    </>
  )
}

// ─── Step: Brand story ────────────────────────────────────────────────────────

function BrandStoryStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-6 pb-2">
      <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
        Brand story
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        maxLength={1000}
        placeholder="Tell buyers about your brand's origins, the artisans behind it, and what drives you to create."
        className="w-full rounded border border-[#D4D0C8] bg-white px-3.5 py-2.5 text-[14px] font-public-sans text-[#1A1A1A] placeholder:text-[#B0ACA3] focus:outline-none focus:border-[#A68B67] transition-colors resize-none"
      />
      <p className="text-[11px] font-public-sans text-[#9CA3AF] mt-1 text-right">{value.length}/1000</p>
    </div>
  )
}

// ─── Step: Identity documents ─────────────────────────────────────────────────

function FileSlot({ label, file, onChange }: {
  label: string; file: File | null; onChange: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div>
      <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onChange(f)
        }}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded border-2 border-dashed transition-colors text-left w-full',
          dragging || file ? 'border-[#A68B67] bg-[#F9F7F2]' : 'border-[#D4D0C8] hover:border-[#A68B67] bg-white'
        )}
      >
        <FileText size={17} className="text-[#A68B67] shrink-0" aria-hidden="true" />
        <span className="text-[13px] font-[500] font-public-sans text-[#555] flex-1 truncate">
          {file ? file.name : dragging ? 'Drop file here' : 'Click or drag file here — PDF, JPG or PNG'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function IdentityDocsStep({ aadhar, pan, onAadhar, onPan }: {
  aadhar: File | null; pan: File | null
  onAadhar: (f: File | null) => void; onPan: (f: File | null) => void
}) {
  return (
    <div className="px-6 pb-2 space-y-4">
      <FileSlot label="Aadhar card" file={aadhar} onChange={onAadhar} />
      <FileSlot label="PAN card" file={pan} onChange={onPan} />
    </div>
  )
}

// ─── Step: Payout bank details ────────────────────────────────────────────────

function BankDetailsStep({ form, onChange }: {
  form: BankForm
  onChange: <K extends keyof BankForm>(key: K, value: BankForm[K]) => void
}) {
  return (
    <div className="px-6 pb-2 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            Account holder name
          </label>
          <input value={form.accountHolderName} onChange={(e) => onChange('accountHolderName', e.target.value)}
            placeholder="As per bank records" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            Bank name
          </label>
          <input value={form.bankName} onChange={(e) => onChange('bankName', e.target.value)}
            placeholder="e.g. HDFC Bank" className={INPUT_CLS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            Account number
          </label>
          <input type="password" value={form.accountNumber} onChange={(e) => onChange('accountNumber', e.target.value)}
            placeholder="Enter account number" className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            Confirm account number
          </label>
          <input
            type="password" value={form.confirmAccountNumber} onChange={(e) => onChange('confirmAccountNumber', e.target.value)}
            placeholder="Re-enter account number"
            className={cn(INPUT_CLS, form.confirmAccountNumber && form.confirmAccountNumber !== form.accountNumber ? 'border-red-400' : '')}
          />
          {form.confirmAccountNumber && form.confirmAccountNumber !== form.accountNumber && (
            <p className="text-[11px] text-red-600 mt-1">Account numbers do not match.</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            IFSC code
          </label>
          <input value={form.ifscCode} onChange={(e) => onChange('ifscCode', e.target.value.toUpperCase())}
            placeholder="e.g. HDFC0001234" maxLength={11} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            Account type
          </label>
          <select value={form.accountType} onChange={(e) => onChange('accountType', e.target.value as BankForm['accountType'])}
            className={cn(INPUT_CLS, 'appearance-none')}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.05em] mb-2">
            UPI ID <span className="font-[400] normal-case">(optional)</span>
          </label>
          <input value={form.upiId} onChange={(e) => onChange('upiId', e.target.value)}
            placeholder="yourname@upi" className={INPUT_CLS} />
        </div>
      </div>
    </div>
  )
}

// ─── Wizard ────────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<MissingKey, string> = {
  brandStory: 'Brand story',
  identityDocs: 'Identity documents',
  bankDetails: 'Payout bank details',
}

function ProfileWizard({ steps, onBack, onFinished }: {
  steps: MissingKey[]
  onBack: () => void
  onFinished: () => void
}) {
  const queryClient = useQueryClient()
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  const [brandStory, setBrandStory] = useState('')
  const [aadhar, setAadhar] = useState<File | null>(null)
  const [pan, setPan] = useState<File | null>(null)
  const [bankForm, setBankForm] = useState<BankForm>(EMPTY_BANK_FORM)

  const currentKey = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  function updateBankForm<K extends keyof BankForm>(key: K, value: BankForm[K]) {
    setBankForm((f) => ({ ...f, [key]: value }))
  }

  const canProceed = (() => {
    if (currentKey === 'brandStory') return brandStory.trim().length > 0
    if (currentKey === 'identityDocs') return !!aadhar && !!pan
    if (currentKey === 'bankDetails') {
      return !!bankForm.accountHolderName.trim() && !!bankForm.bankName.trim()
        && !!bankForm.accountNumber.trim() && bankForm.accountNumber === bankForm.confirmAccountNumber
        && !!bankForm.ifscCode.trim()
    }
    return false
  })()

  async function handleSaveStep() {
    setSaving(true)
    try {
      if (currentKey === 'brandStory') {
        await api.patch('/brands/me/profile', { brandStory: brandStory.trim() })
        queryClient.invalidateQueries({ queryKey: ['my-brand-profile'] })
      } else if (currentKey === 'identityDocs') {
        const fd = new FormData()
        if (aadhar) fd.append('aadhar', aadhar)
        if (pan) fd.append('pan', pan)
        await api.post('/photos/brand/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        queryClient.invalidateQueries({ queryKey: ['my-brand-profile'] })
      } else if (currentKey === 'bankDetails') {
        await api.post('/brands/me/bank-account', {
          accountHolderName: bankForm.accountHolderName.trim(),
          bankName: bankForm.bankName.trim(),
          accountNumber: bankForm.accountNumber.trim(),
          ifscCode: bankForm.ifscCode.trim().toUpperCase(),
          accountType: bankForm.accountType,
          ...(bankForm.upiId.trim() && { upiId: bankForm.upiId.trim() }),
        })
        queryClient.invalidateQueries({ queryKey: ['bank-account'] })
      }

      if (isLastStep) {
        toast.success('Profile completed!')
        onFinished()
      } else {
        setStepIndex((i) => i + 1)
      }
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          {steps.map((key, i) => (
            <span
              key={key}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= stepIndex ? 'bg-[#A68B67]' : 'bg-[#E5E1D8]'
              )}
            />
          ))}
        </div>
        <DialogTitle>{STEP_TITLES[currentKey]}</DialogTitle>
        <DialogDescription>Step {stepIndex + 1} of {steps.length}</DialogDescription>
      </DialogHeader>

      {currentKey === 'brandStory' && <BrandStoryStep value={brandStory} onChange={setBrandStory} />}
      {currentKey === 'identityDocs' && (
        <IdentityDocsStep aadhar={aadhar} pan={pan} onAadhar={setAadhar} onPan={setPan} />
      )}
      {currentKey === 'bankDetails' && <BankDetailsStep form={bankForm} onChange={updateBankForm} />}

      <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E1D8]">
        <button
          type="button"
          onClick={() => (stepIndex === 0 ? onBack() : setStepIndex((i) => i - 1))}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-[13px] font-[600] font-public-sans text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back
        </button>
        <Button variant="accent" size="md" onClick={handleSaveStep} disabled={!canProceed || saving}>
          {saving ? 'Saving…' : isLastStep ? 'Submit' : 'Save & Next'}
        </Button>
      </div>
    </>
  )
}

// ─── Flow — intro screen, then the step wizard ────────────────────────────────

export function CompleteProfileFlow({ missing, onDismiss }: {
  missing: MissingItem[]
  onDismiss: () => void
}) {
  const [mode, setMode] = useState<'intro' | 'wizard'>('intro')
  // Frozen at the moment the wizard starts — `missing` (and therefore the
  // step list derived from it) changes mid-flow as each step saves and
  // invalidates the profile query, which would otherwise shift stepIndex
  // out from under the user or shrink the list while they're on it.
  const [frozenSteps, setFrozenSteps] = useState<MissingKey[]>([])

  function handleStart() {
    setFrozenSteps(STEP_ORDER.filter((key) => missing.some((m) => m.key === key)))
    setMode('wizard')
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDismiss() }}>
      <DialogContent className="max-w-[480px]">
        {mode === 'intro' || frozenSteps.length === 0 ? (
          <IntroScreen missing={missing} onStart={handleStart} onDismiss={onDismiss} />
        ) : (
          <ProfileWizard steps={frozenSteps} onBack={() => setMode('intro')} onFinished={onDismiss} />
        )}
      </DialogContent>
    </Dialog>
  )
}
