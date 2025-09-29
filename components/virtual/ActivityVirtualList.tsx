'use client'

import { useRef, useEffect, useState, useMemo } from 'react'

interface VirtualListProps<T> {
  items: T[]
  rowHeight?: number
  containerHeight?: number
  render: (item: T, index: number) => JSX.Element
  overscan?: number
  className?: string
}

/**
 * Virtual list component for efficient rendering of large datasets
 * Only renders visible items plus overscan buffer
 */
export default function ActivityVirtualList<T extends { id?: string }>({
  items,
  rowHeight = 64,
  containerHeight = 600,
  render,
  overscan = 5,
  className = ''
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * rowHeight
  const visibleCount = Math.ceil(containerHeight / rowHeight)
  
  // Calculate visible range with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2)
  
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    // Use passive listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Scroll to top when items change significantly
  useEffect(() => {
    const container = containerRef.current
    if (container && container.scrollTop > totalHeight) {
      container.scrollTop = Math.max(0, totalHeight - containerHeight)
    }
  }, [items.length, totalHeight, containerHeight])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      role="list"
      aria-label="Activity feed"
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            position: 'absolute',
            top: startIndex * rowHeight,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index
            return (
              <div
                key={item.id ?? `item-${actualIndex}`}
                style={{ height: rowHeight }}
                role="listitem"
              >
                {render(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Specialized version for Signal events
export function SignalVirtualList({ 
  signals, 
  renderSignal, 
  ...props 
}: Omit<VirtualListProps<any>, 'items' | 'render'> & {
  signals: any[]
  renderSignal: (signal: any, index: number) => JSX.Element
}) {
  return (
    <ActivityVirtualList
      items={signals}
      render={renderSignal}
      {...props}
    />
  )
}

// Grid virtualization for recognition badges/cards
interface VirtualGridProps<T> {
  items: T[]
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  gap?: number
  render: (item: T, index: number) => JSX.Element
  className?: string
}

export function VirtualGrid<T extends { id?: string }>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  gap = 16,
  render,
  className = ''
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap))
  const rowCount = Math.ceil(items.length / itemsPerRow)
  const totalHeight = rowCount * (itemHeight + gap) - gap

  const visibleRowCount = Math.ceil(containerHeight / (itemHeight + gap)) + 1
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)))
  const endRow = Math.min(rowCount, startRow + visibleRowCount)

  const visibleItems = useMemo(() => {
    const startIndex = startRow * itemsPerRow
    const endIndex = Math.min(items.length, endRow * itemsPerRow)
    return items.slice(startIndex, endIndex)
  }, [items, startRow, endRow, itemsPerRow])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight, width: containerWidth }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startRow * (itemHeight + gap),
            left: 0,
            right: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${itemsPerRow}, ${itemWidth}px)`,
              gap: `${gap}px`,
              justifyContent: 'start'
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startRow * itemsPerRow + index
              return (
                <div
                  key={item.id ?? `grid-item-${actualIndex}`}
                  style={{ width: itemWidth, height: itemHeight }}
                >
                  {render(item, actualIndex)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}