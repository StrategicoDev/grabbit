import { useState, useEffect, useCallback } from 'react'
import { Share2, Trash2, Coins, MoreVertical, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getItems, addItem, clearCheckedItems, createInvite, getCreditBalance } from '../lib/api'
import type { ShoppingList, ListItem } from '../types'
import ItemRow from './ItemRow'
import AddItemBar from './AddItemBar'
import toast from 'react-hot-toast'

interface Props {
  list: ShoppingList
  userId?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ShoppingListView({ list, userId: _userId }: Props) {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    const data = await getItems(list.id)
    setItems(data)
    setLoading(false)
  }, [list.id])

  useEffect(() => {
    setLoading(true)
    loadItems()

    // Load credits
    getCreditBalance().then(setCredits)

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`list-${list.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'list_items',
        filter: `list_id=eq.${list.id}`,
      }, () => {
        loadItems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [list.id, loadItems])

  const handleAdd = async (names: string[]) => {
    for (const name of names) {
      await addItem(list.id, name)
    }
    await loadItems()
  }

  const handleClearChecked = async () => {
    await clearCheckedItems(list.id)
    await loadItems()
  }

  const handleShare = async () => {
    try {
      const invite = await createInvite(list.id)
      const url = `${window.location.origin}/join/${invite.invite_code}`
      setInviteCode(url)
      
      if (navigator.share) {
        await navigator.share({
          title: `Join "${list.name}" on Grabbit`,
          text: 'Tap to join my shopping list',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Invite link copied!')
      }
    } catch {
      // User cancelled share
    }
  }

  const checkedCount = items.filter(i => i.is_checked).length
  const uncheckedCount = items.filter(i => !i.is_checked).length

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{list.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} left
              {checkedCount > 0 ? ` · ${checkedCount} done` : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-brand-50 px-2.5 py-1.5 rounded-full">
              <Coins size={14} className="text-brand-500" />
              <span className="text-xs font-semibold text-brand-700">{credits}</span>
            </div>
            
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Share2 size={16} className="text-gray-600" />
            </button>
            
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <MoreVertical size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-4 top-16 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 min-w-[180px]">
          {checkedCount > 0 && (
            <button
              onClick={() => { handleClearChecked(); setShowMenu(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              <span className="text-[15px]">Clear {checkedCount} done</span>
            </button>
          )}
          <button
            onClick={() => setShowMenu(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <X size={16} />
            <span className="text-[15px]">Close</span>
          </button>
        </div>
      )}

      {/* Add bar */}
      <AddItemBar listId={list.id} onAdd={handleAdd} creditBalance={credits} />

      {/* Invite code display */}
      {inviteCode && (
        <div className="bg-brand-50 px-4 py-3 flex items-center gap-3 border-b border-brand-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-700 font-semibold">Invite link (7 days)</p>
            <p className="text-xs text-brand-600 truncate font-mono">{inviteCode}</p>
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(inviteCode)
              toast.success('Copied!')
            }}
            className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg font-semibold"
          >
            Copy
          </button>
          <button onClick={() => setInviteCode(null)} className="text-brand-400">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-8">
            <span className="text-5xl mb-4">🛒</span>
            <p className="text-lg font-medium text-gray-600">List is empty</p>
            <p className="text-sm text-center mt-1">Type an item above, or use the camera to scan a photo or barcode</p>
          </div>
        ) : (
          <>
            {items.filter(i => !i.is_checked).map(item => (
              <ItemRow key={item.id} item={item} onChange={loadItems} />
            ))}
            
            {checkedCount > 0 && (
              <>
                <div className="px-4 py-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Done ({checkedCount})</p>
                  <button
                    onClick={handleClearChecked}
                    className="text-xs text-red-400 hover:text-red-500 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                {items.filter(i => i.is_checked).map(item => (
                  <ItemRow key={item.id} item={item} onChange={loadItems} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
