'use client'

import { Star } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'

export default function ReviewsPage() {
  return (
    <AccountPageWrapper>
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Reviews
        </h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          Your reviews of brands and products you've ordered.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-muted-bg flex items-center justify-center mb-4">
          <Star size={24} className="text-muted-text" aria-hidden="true" />
        </div>
        <p className="text-[16px] font-[600] font-public-sans text-primary mb-1">
          Coming soon
        </p>
        <p className="text-[13px] font-public-sans text-muted-text max-w-[320px]">
          The reviews feature is launching soon. Once live, you'll be able to rate brands and leave feedback on your orders here.
        </p>
      </div>
    </AccountPageWrapper>
  )
}
