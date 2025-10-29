'use client'
import { Button as _Button } from '@/components/ui/button'
import { Card as _Card } from '@/components/ui/card'
import { Input as _Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function Button(props: React.ComponentProps<typeof _Button>) {
  return <_Button {...props} />
}

export function Card(props: React.ComponentProps<typeof _Card>) {
  return <_Card {...props} />
}

export function Input(props: React.ComponentProps<typeof _Input>) {
  return <_Input {...props} />
}

// Lightweight "semantic" text/heading wrappers so we stop importing GenZ*:
export function Heading({
  level = 2,
  className,
  children,
}: { level?: 1|2|3|4|5|6; className?: string; children: React.ReactNode }) {
  const Tag = (`h${level}` as keyof JSX.IntrinsicElements)
  return <Tag className={cn('font-semibold tracking-tight', className)}>{children}</Tag>
}

export function Text({
  as = 'p',
  dim,
  size = 'base',
  className,
  children,
}: {
  as?: 'p' | 'span' | 'div'
  dim?: boolean
  size?: 'sm' | 'base' | 'lg'
  className?: string
  children: React.ReactNode
}) {
  const Tag = as
  const sizeCls = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
  const tone = dim ? 'text-white/70' : 'text-white'
  return <Tag className={cn(sizeCls, tone, className)}>{children}</Tag>
}
