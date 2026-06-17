'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { Send, Search, MessageSquare } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { cn } from '@/lib/utils'
import {
  useConversations,
  useMessages,
  useSendMessage,
  type Conversation,
  type Message,
} from '@/hooks/queries/useMessages'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function getDisplayName(conv: Conversation) {
  return conv.partner.brandProfile?.brandName ?? conv.partner.name ?? 'Unknown'
}

function getInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase()
}

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

function ThreadItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation
  active: boolean
  onClick: () => void
}) {
  const name = getDisplayName(conv)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-border-warm',
        active ? 'bg-muted-bg' : 'hover:bg-muted-bg/60'
      )}
    >
      <BrandAvatar initial={getInitial(name)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-public-sans text-[13px] font-[600] text-primary truncate">{name}</span>
          <span className="font-public-sans text-[11px] text-muted-text flex-shrink-0">
            {conv.lastAt ? formatTime(conv.lastAt) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="font-public-sans text-[12px] text-muted-text truncate">{conv.lastMessage}</p>
          {conv.unreadCount > 0 && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-[700] flex items-center justify-center">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatBubble({ message, myId }: { message: Message; myId: string }) {
  const isMe = message.senderId === myId
  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[72%]">
        <div className={cn(
          'px-4 py-2.5 rounded-2xl font-public-sans text-[14px] leading-[1.6]',
          isMe
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface border border-border-warm text-primary rounded-bl-sm'
        )}>
          {message.content}
        </div>
        <p className={cn('font-public-sans text-[11px] text-muted-text mt-1', isMe ? 'text-right' : 'text-left')}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

// ─── Inner page (needs useSearchParams inside Suspense) ───────────────────────

function MessagesInner() {
  const user = useAuthStore((s) => s.user)
  const searchParams = useSearchParams()
  const initialPartnerId = searchParams.get('partner')
  const initialPartnerName = searchParams.get('name') ?? ''

  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isLoading: convsLoading } = useConversations()
  const { data: messages = [], isLoading: msgsLoading } = useMessages(activePartnerId)
  const sendMessage = useSendMessage()

  const activeConv = conversations.find((c) => c.partnerId === activePartnerId)
  // For a new conversation (partner from URL, no prior messages), show their name from URL param
  const displayName = activeConv
    ? getDisplayName(activeConv)
    : (activePartnerId ? initialPartnerName : '')
  const hasActiveThread = !!activeConv || (!!activePartnerId && !!initialPartnerId)

  const filtered = search
    ? conversations.filter((c) => getDisplayName(c).toLowerCase().includes(search.toLowerCase()))
    : conversations

  // Auto-select first conversation only when no partner is pre-selected from URL
  useEffect(() => {
    if (!activePartnerId && conversations.length > 0) {
      setActivePartnerId(conversations[0].partnerId)
    }
  }, [conversations, activePartnerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, activePartnerId])

  function handleSend() {
    const content = input.trim()
    if (!content || !activePartnerId) return
    sendMessage.mutate({ recipientId: activePartnerId, content })
    setInput('')
  }

  return (
    <AccountPageWrapper title="Messages" description="Direct conversations with brands">

      <div
        className="border border-border-warm rounded overflow-hidden flex"
        style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}
      >
        {/* Left — thread list */}
        <div className="w-[300px] flex-shrink-0 border-r border-border-warm flex flex-col">
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

          <div className="flex-1 overflow-y-auto">
            {convsLoading && (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-border-warm animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted-bg flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-muted-bg rounded w-2/3" />
                    <div className="h-3 bg-muted-bg rounded w-full" />
                  </div>
                </div>
              ))
            )}
            {/* Show new-conversation placeholder in thread list when coming from product page */}
            {!convsLoading && initialPartnerId && !conversations.find((c) => c.partnerId === initialPartnerId) && (
              <button
                type="button"
                onClick={() => setActivePartnerId(initialPartnerId)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-border-warm',
                  activePartnerId === initialPartnerId ? 'bg-muted-bg' : 'hover:bg-muted-bg/60'
                )}
              >
                <BrandAvatar initial={getInitial(initialPartnerName)} />
                <div className="flex-1 min-w-0">
                  <span className="font-public-sans text-[13px] font-[600] text-primary truncate block">{initialPartnerName}</span>
                  <p className="font-public-sans text-[12px] text-muted-text">New conversation</p>
                </div>
              </button>
            )}
            {!convsLoading && filtered.length === 0 && !initialPartnerId && (
              <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
                <MessageSquare size={24} className="text-muted-text mb-2" aria-hidden="true" />
                <p className="font-public-sans text-[13px] text-muted-text">
                  {search ? 'No conversations found.' : 'No conversations yet.'}
                </p>
              </div>
            )}
            {filtered.map((conv) => (
              <ThreadItem
                key={conv.partnerId}
                conv={conv}
                active={conv.partnerId === activePartnerId}
                onClick={() => setActivePartnerId(conv.partnerId)}
              />
            ))}
          </div>
        </div>

        {/* Right — active conversation */}
        {!hasActiveThread ? (
          <div className="flex-1 flex items-center justify-center font-public-sans text-[14px] text-muted-text">
            {convsLoading ? 'Loading…' : 'Select a conversation'}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-warm bg-surface flex-shrink-0">
              <BrandAvatar initial={getInitial(displayName)} size="sm" />
              <div>
                <p className="font-public-sans text-[13px] font-[600] text-primary">{displayName}</p>
                <p className="font-public-sans text-[11px] text-muted-text">Verified supplier</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 bg-bg">
              {msgsLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
              )}
              {!msgsLoading && messages.length === 0 && (
                <p className="text-center font-public-sans text-[13px] text-muted-text pt-8">
                  No messages yet. Start the conversation below.
                </p>
              )}
              {!msgsLoading && messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} myId={user?.id ?? ''} />
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
                  placeholder={`Message ${displayName}…`}
                  rows={1}
                  className="flex-1 resize-none rounded border border-border-warm bg-muted-bg px-3 py-2 font-public-sans text-[13px] text-primary placeholder:text-muted-text/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors leading-[1.5] max-h-[120px]"
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
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
        )}
      </div>
    </AccountPageWrapper>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  )
}
