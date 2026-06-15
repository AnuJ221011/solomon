const STATS = [
  { value: '500+', label: 'Verified Brands' },
  { value: '40+', label: 'Countries Served' },
  { value: '10K+', label: 'Products Listed' },
  { value: '100%', label: 'Manually Verified' },
]

export function StatsSection() {
  return (
    <section className="bg-primary py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <span className="font-playfair text-[48px] lg:text-[56px] font-[500] text-white leading-none">
                {value}
              </span>
              <span className="font-public-sans text-[13px] font-[400] text-white/50 mt-2 uppercase tracking-[0.06em]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
