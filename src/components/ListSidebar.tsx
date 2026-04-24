import { useState } from 'react'
import { Plus, Archive, ChevronRight, Trash2 } from 'lucide-react'
import type { ShoppingList } from '../types'
import { createList, deleteList } from '../lib/api'
import toast from 'react-hot-toast'

interface Props {
  lists: ShoppingList[]
  activeListId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
}

export default function ListSidebar({ lists, activeListId, onSelect, onRefresh }: Props) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    try {
      const list = await createList(name)
      onSelect(list.id)
      onRefresh()
      setCreating(false)
      setNewName('')
    } catch (err: any) {
      toast.error('Could not create list')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this list?')) return
    try {
      await deleteList(id)
      onRefresh()
    } catch {
      toast.error('Could not delete list')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-brand-600">🛒 Grabbit</h1>
          <button
            onClick={() => setCreating(true)}
            className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400">My Lists</p>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="p-3 border-b border-gray-100 bg-brand-50">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="List name..."
            className="w-full bg-white border border-brand-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="flex-1 bg-brand-500 text-white rounded-lg py-1.5 text-sm font-semibold">
              Create
            </button>
            <button type="button" onClick={() => setCreating(false)} className="px-3 text-gray-500 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {lists.map(list => (
          <button
            key={list.id}
            onClick={() => onSelect(list.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-50 transition-colors group ${
              activeListId === list.id ? 'bg-brand-50' : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{list.is_default ? '🏠' : '📋'}</span>
            <span className={`flex-1 text-[15px] font-medium truncate ${activeListId === list.id ? 'text-brand-700' : 'text-gray-800'}`}>
              {list.name}
            </span>
            <button
              onClick={e => handleDelete(e, list.id)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
            {activeListId === list.id && <ChevronRight size={16} className="text-brand-400" />}
          </button>
        ))}

        {lists.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Archive size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No lists yet</p>
            <p className="text-xs mt-1">Create your first list!</p>
          </div>
        )}
      </div>
    </div>
  )
}
