import React, { useState, useRef } from 'react'
import { Check } from 'lucide-react'
import type { ListItem } from '../types'
import { toggleItem, deleteItem } from '../lib/api'

interface Props {
  item: ListItem
  onChange: () => void
}

export default function ItemRow({ item, onChange }: Props) {
  const [deleting, setDeleting] = useState(false)
  const startX = useRef<number | null>(null)
  const el = useRef<HTMLDivElement>(null)

  const handleToggle = async () => {
    await toggleItem(item)
    onChange()
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteItem(item.id)
    onChange()
  }

  // Swipe to delete
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }
  const onTouchEnd = async (e: React.TouchEvent) => {
    if (startX.current === null) return
    const dx = startX.current - e.changedTouches[0].clientX
    if (dx > 80) {
      await handleDelete()
    }
    startX.current = null
  }

  return (
    <div
      ref={el}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 transition-opacity ${deleting ? 'opacity-30' : ''}`}
    >
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.is_checked
            ? 'bg-brand-500 border-brand-500'
            : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        {item.is_checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-[17px] leading-snug block truncate ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.name}
        </span>
        {item.quantity && (
          <span className="text-sm text-gray-400">{item.quantity}</span>
        )}
      </div>
      {item.photo_url && (
        <img src={item.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      )}
      <button
        onClick={handleDelete}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
      >
        ×
      </button>
    </div>
  )
}
