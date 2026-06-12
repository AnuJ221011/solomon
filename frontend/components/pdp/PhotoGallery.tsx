'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoGalleryProps {
  images: string[]
  productName: string
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  initialIndex,
  productName,
  onClose,
}: {
  images: string[]
  initialIndex: number
  productName: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)

  const prev = useCallback(() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setIndex((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-primary/92 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} — image ${index + 1} of ${images.length}`}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded border border-white/20 inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close lightbox"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {images.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 z-10 w-10 h-10 rounded border border-white/20 inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}

        <div className="relative max-h-[90vh] max-w-[90vw] w-full h-full flex items-center justify-center px-16">
          <Image
            src={images[index]}
            alt={`${productName} — view ${index + 1}`}
            width={900}
            height={900}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            priority
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-4 z-10 w-10 h-10 rounded border border-white/20 inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}

        {images.length > 1 && (
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 font-public-sans text-[13px]">
            {index + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Empty placeholder ────────────────────────────────────────────────────────

function EmptyPlaceholder() {
  return (
    <div className="w-full aspect-square rounded bg-muted-bg flex items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="text-border-warm">
        <rect x="8" y="12" width="32" height="26" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 30 L16 24 L22 29 L32 21 L40 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PhotoGallery({ images, productName }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images || images.length === 0) return <EmptyPlaceholder />

  // Single image
  if (images.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="w-full aspect-[4/3] rounded overflow-hidden relative cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`Enlarge ${productName} image`}
        >
          <Image src={images[0]} alt={productName} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 55vw" />
        </button>
        {lightboxIndex !== null && (
          <Lightbox images={images} initialIndex={lightboxIndex} productName={productName} onClose={() => setLightboxIndex(null)} />
        )}
      </>
    )
  }

  // 2–3 images: row 1 only (portrait left + landscape right)
  if (images.length < 4) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 h-[340px]">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="flex-[2] relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${productName} image 1`}
            >
              <Image src={images[0]} alt={`${productName} — 1`} fill className="object-cover" priority sizes="(max-width: 1024px) 40vw, 22vw" />
            </button>
            <button
              type="button"
              onClick={() => setLightboxIndex(1)}
              className="flex-[3] relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${productName} image 2`}
            >
              <Image src={images[1]} alt={`${productName} — 2`} fill className="object-cover" priority sizes="(max-width: 1024px) 60vw, 33vw" />
            </button>
          </div>

          {images.length === 3 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(2)}
              className="w-full h-[180px] relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${productName} image 3`}
            >
              <Image src={images[2]} alt={`${productName} — 3`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
            </button>
          )}
        </div>

        {lightboxIndex !== null && (
          <Lightbox images={images} initialIndex={lightboxIndex} productName={productName} onClose={() => setLightboxIndex(null)} />
        )}
      </>
    )
  }

  // 4+ images: Faire-style mosaic
  const remaining = images.length - 4

  return (
    <>
      <div className="flex flex-col gap-2">

        {/* Row 1: portrait left (flex-2) + landscape right (flex-3) */}
        <div className="flex gap-2 h-[340px] md:h-[370px]">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="flex-[2] relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`View ${productName} image 1`}
          >
            <Image
              src={images[0]}
              alt={`${productName} — 1`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              priority
              sizes="(max-width: 1024px) 40vw, 22vw"
            />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex(1)}
            className="flex-[3] relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`View ${productName} image 2`}
          >
            <Image
              src={images[1]}
              alt={`${productName} — 2`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              priority
              sizes="(max-width: 1024px) 60vw, 33vw"
            />
          </button>
        </div>

        {/* Row 2: two equal images, last has "Show all" overlay */}
        <div className="flex gap-2 h-[200px] md:h-[220px]">
          <button
            type="button"
            onClick={() => setLightboxIndex(2)}
            className="flex-1 relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`View ${productName} image 3`}
          >
            <Image
              src={images[2]}
              alt={`${productName} — 3`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              sizes="(max-width: 1024px) 50vw, 27vw"
            />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex(3)}
            className="flex-1 relative rounded overflow-hidden cursor-zoom-in bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={remaining > 0 ? `Show all ${images.length} photos` : `View ${productName} image 4`}
          >
            <Image
              src={images[3]}
              alt={`${productName} — 4`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              sizes="(max-width: 1024px) 50vw, 27vw"
            />
            {remaining > 0 && (
              <div className="absolute inset-0 bg-primary/45 flex items-center justify-center rounded">
                <span className="inline-flex items-center gap-2 bg-white text-primary font-public-sans text-[13px] font-[600] px-4 py-2 rounded-sm shadow">
                  <Images size={14} aria-hidden="true" />
                  Show all {images.length} photos
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          productName={productName}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
