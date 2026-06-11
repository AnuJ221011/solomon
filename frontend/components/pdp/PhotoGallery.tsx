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

  const prev = useCallback(() => {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const next = useCallback(() => {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, prev, next])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-primary/90 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} — image ${index + 1} of ${images.length}`}
      onClick={onClose}
    >
      {/* Stop propagation on inner container so clicks don't close */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 z-10',
            'w-10 h-10 rounded border border-white/20',
            'inline-flex items-center justify-center',
            'text-white/80 hover:text-white hover:bg-white/10 transition-colors'
          )}
          aria-label="Close lightbox"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Prev */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className={cn(
              'absolute left-4 z-10',
              'w-10 h-10 rounded border border-white/20',
              'inline-flex items-center justify-center',
              'text-white/80 hover:text-white hover:bg-white/10 transition-colors'
            )}
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
            className={cn(
              'absolute right-4 z-10',
              'w-10 h-10 rounded border border-white/20',
              'inline-flex items-center justify-center',
              'text-white/80 hover:text-white hover:bg-white/10 transition-colors'
            )}
            aria-label="Next image"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === index ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'
                )}
                aria-label={`View image ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PhotoGallery({ images, productName }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square rounded bg-muted-bg flex items-center justify-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className="text-border-warm"
        >
          <rect x="8" y="12" width="32" height="26" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 30 L16 24 L22 29 L32 21 L40 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  // Layout: 2×2 grid when 4 images; adapt for fewer
  const displayImages = images.slice(0, 4)
  const hasGrid = displayImages.length >= 4

  if (hasGrid) {
    return (
      <>
        <div
          className="grid grid-cols-2 gap-2 w-full"
          role="list"
          aria-label={`${productName} product images`}
        >
          {displayImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="aspect-square overflow-hidden rounded bg-muted-bg cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              aria-label={`View image ${i + 1} of ${productName} in full screen`}
              role="listitem"
            >
              <Image
                src={src}
                alt={`${productName} — view ${i + 1}`}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority={i === 0}
              />
            </button>
          ))}
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

  // Single image or 2–3: show primary large + thumbnails below
  const [primary, ...thumbs] = displayImages
  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Primary */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="w-full aspect-square overflow-hidden rounded bg-muted-bg cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          aria-label={`View primary image of ${productName} in full screen`}
        >
          <Image
            src={primary}
            alt={`${productName} — main view`}
            width={800}
            height={800}
            className="w-full h-full object-cover"
            priority
          />
        </button>

        {/* Thumbnails */}
        {thumbs.length > 0 && (
          <div className="flex gap-2">
            {thumbs.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i + 1)}
                className="flex-1 aspect-square overflow-hidden rounded bg-muted-bg cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                aria-label={`View image ${i + 2} of ${productName} in full screen`}
              >
                <Image
                  src={src}
                  alt={`${productName} — view ${i + 2}`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
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
