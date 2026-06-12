'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded border border-white/20 inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close lightbox"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Prev */}
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

        {/* Image */}
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

        {/* Next */}
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

        {/* Counter */}
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
  const [active, setActive] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images || images.length === 0) return <EmptyPlaceholder />

  const thumbs = images.slice(0, 6)

  return (
    <>
      <div className="flex gap-3">
        {/* Vertical thumbnail strip — left side */}
        {images.length > 1 && (
          <div className="flex flex-col gap-2 flex-shrink-0" role="list" aria-label="Product image thumbnails">
            {thumbs.map((src, i) => (
              <button
                key={i}
                type="button"
                role="listitem"
                onClick={() => setActive(i)}
                className={cn(
                  'w-[68px] aspect-square rounded overflow-hidden border-2 transition-all duration-150 flex-shrink-0',
                  i === active
                    ? 'border-accent'
                    : 'border-border-warm hover:border-primary/40 opacity-70 hover:opacity-100'
                )}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === active}
              >
                <Image
                  src={src}
                  alt={`${productName} — thumbnail ${i + 1}`}
                  width={68}
                  height={68}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Large main image */}
        <button
          type="button"
          onClick={() => setLightboxIndex(active)}
          className="flex-1 aspect-square rounded overflow-hidden bg-muted-bg relative cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={`Enlarge ${productName} image`}
        >
          <Image
            src={images[active]}
            alt={`${productName} — main view`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            priority
          />
        </button>
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
