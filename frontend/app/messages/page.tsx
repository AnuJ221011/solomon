'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Search, MessageSquare } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  senderId: 'me' | 'brand'
  text: string
  sentAt: string
}

interface Thread {
  id: string
  brandName: string
  brandInitial: string
  lastMessage: string
  lastAt: string
  unread: number
  messages: Message[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_THREADS: Thread[] = [
  {
    id: 'thread-1',
    brandName: 'Jaipur Craft House',
    brandInitial: 'J',
    lastMessage: 'Sure, we can do a sample shipment of 10 units.',
    lastAt: '10:32 AM',
    unread: 2,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Hi! I came across your block-print textiles and I\'m interested in placing a wholesale order. Could you share your price list?', sentAt: 'Yesterday, 4:15 PM' },
      { id: 'm2', senderId: 'brand', text: 'Hello! Thank you for reaching out. We\'d love to work with you. Our wholesale price list is attached — MOQ is 50 units per design.', sentAt: 'Yesterday, 5:02 PM' },
      { id: 'm3', senderId: 'me', text: 'Great, thank you. Is it possible to get a sample before committing to a full order?', sentAt: 'Today, 9:50 AM' },
      { id: 'm4', senderId: 'brand', text: 'Sure, we can do a sample shipment of 10 units.', sentAt: 'Today, 10:32 AM' },
    ],
  },
  {
    id: 'thread-2',
    brandName: 'Nilgiri Pottery Co.',
    brandInitial: 'N',
    lastMessage: 'Lead time is typically 3–4 weeks from order confirmation.',
    lastAt: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm5', senderId: 'me', text: 'Hello, what is your typical lead time for custom pottery orders?', sentAt: 'Mon, 2:00 PM' },
      { id: 'm6', senderId: 'brand', text: 'Lead time is typically 3–4 weeks from order confirmation.', sentAt: 'Mon, 4:45 PM' },
    ],
  },
  {
    id: 'thread-3',
    brandName: 'Dharavi Leather Works',
    brandInitial: 'D',
    lastMessage: 'We export to 20+ countries and handle all documentation.',
    lastAt: 'Mon',
    unread: 0,
    messages: [
      { id: 'm7', senderId: 'me', text: 'Do you handle export documentation for international orders?', sentAt: 'Sun, 11:00 AM' },
      { id: 'm8', senderId: 'brand', text: 'We export to 20+ countries and handle all documentation.', sentAt: 'Sun, 1:30 PM' },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function BrandAvatar({ initial, size = 'md' }: { initial: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn(
      'rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 font-playfair font-[500] text-accent',
      size === 'md' ? 'w-10 h-10 text-[15px]' : 'w-8 h-8 text-[13px]'
    )}>
      {initial}
    </div>
  )
}

function ThreadItem({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-border-warm',
        active ? 'bg-muted-bg' : 'hover:bg-muted-bg/60'
      )}
    >
      <BrandAvatar initial={thread.brandInitial} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-public-sans text-[13px] font-[600] text-primary truncate">{thread.brandName}</span>
          <span className="font-public-sans text-[11px] text-muted-text flex-shrink-0">{thread.lastAt}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="font-public-sans text-[12px] text-muted-text truncate">{thread.lastMessage}</p>
          {thread.unread > 0 && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-[700] flex items-center justify-center">
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatBubble({ message }: { message: Message }) {
  const isMe = message.senderId === 'me'
  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[72%]">
        <div className={cn(
          'px-4 py-2.5 rounded-2xl font-public-sans text-[14px] leading-[1.6]',
          isMe
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface border border-border-warm text-primary rounded-bl-sm'
        )}>
          {message.text}
        </div>
        <p className={cn('font-public-sans text-[11px] text-muted-text mt-1', isMe ? 'text-right' : 'text-left')}>
          {message.sentAt}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS)
  const [activeId, setActiveId] = useState<string>(INITIAL_THREADS[0].id)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)

  const activeThread = threads.find((t) => t.id === activeId)!

  const filteredThreads = search
    ? threads.filter((t) => t.brandName.toLowerCase().includes(search.toLowerCase()))
    : threads

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, activeThread?.messages.length])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      text,
      sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, messages: [...t.messages, newMsg], lastMessage: text, lastAt: 'Just now', unread: 0 }
          : t
      )
    )
    setInput('')
  }

  function handleSelect(id: string) {
    setActiveId(id)
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, unread: 0 } : t))
  }

  return (
    <AccountPageWrapper>
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">Messages</h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          Direct conversations with brands
        </p>
      </div>

      {/* Two-pane layout */}
      <div className="border border-border-warm rounded overflow-hidden flex" style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}>

        {/* Left — thread list */}
        <div className="w-[300px] flex-shrink-0 border-r border-border-warm flex flex-col">
          {/* Search */}
          <div className="px-3 py-3 border-b border-border-warm">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full h-8 pl-8 pr-3 rounded border border-border-warm bg-muted-bg text-[12px] font-public-sans text-primary placeholder:text-muted-text/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <p className="px-4 py-8 text-center font-public-sans text-[13px] text-muted-text">No conversations found.</p>
            ) : (
              filteredThreads.map((t) => (
                <ThreadItem
                  key={t.id}
                  thread={t}
                  active={t.id === activeId}
                  onClick={() => handleSelect(t.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right — active conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-warm bg-surface flex-shrink-0">
            <BrandAvatar initial={activeThread.brandInitial} size="sm" />
            <div>
              <p className="font-public-sans text-[13px] font-[600] text-primary">{activeThread.brandName}</p>
              <p className="font-public-sans text-[11px] text-muted-text">Verified supplier</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 bg-bg">
            {activeThread.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border-warm px-4 py-3 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder={`Message ${activeThread.brandName}…`}
                rows={1}
                className="flex-1 resize-none rounded border border-border-warm bg-muted-bg px-3 py-2 font-public-sans text-[13px] text-primary placeholder:text-muted-text/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors leading-[1.5] max-h-[120px]"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
                className="w-9 h-9 flex-shrink-0 rounded bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} aria-hidden="true" />
              </button>
            </div>
            <p className="font-public-sans text-[11px] text-muted-text/60 mt-1.5">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

      </div>
    </AccountPageWrapper>
  )
}
