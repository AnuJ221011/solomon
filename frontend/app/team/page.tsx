'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'

export default function TeamPage() {
  return (
    <AccountPageWrapper title="Team & Permissions" description="Manage who has access to your Solomon Bharat account">

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-muted-bg flex items-center justify-center mb-4">
          <Users size={24} className="text-muted-text" aria-hidden="true" />
        </div>
        <p className="text-[16px] font-[600] font-public-sans text-primary mb-1">
          Team management is in Settings
        </p>
        <p className="text-[13px] font-public-sans text-muted-text mb-4 max-w-[320px]">
          Invite colleagues and manage roles from the Team section in your account settings.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center justify-center h-10 px-4 rounded text-[14px] font-[600] font-public-sans bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </AccountPageWrapper>
  )
}
