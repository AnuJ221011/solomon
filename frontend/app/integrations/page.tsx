'use client'

import { Plug } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'

export default function IntegrationsPage() {
  return (
    <AccountPageWrapper title="Integrations" description="Connect Solomon Bharat with your existing tools and platforms.">

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-muted-bg flex items-center justify-center mb-4">
          <Plug size={24} className="text-muted-text" aria-hidden="true" />
        </div>
        <p className="text-[16px] font-[600] font-public-sans text-primary mb-1">
          Coming soon
        </p>
        <p className="text-[13px] font-public-sans text-muted-text max-w-[320px]">
          Shopify, WooCommerce, and other platform integrations are on the roadmap. We'll notify you when they're available.
        </p>
      </div>
    </AccountPageWrapper>
  )
}
