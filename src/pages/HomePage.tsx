import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getLists, createList } from '../lib/api'
import type { ShoppingList } from '../types'
import ListSidebar from '../components/ListSidebar'
import ShoppingListView from '../components/ShoppingListView'
import AuthPage from './AuthPage'
import { signOut } from '../lib/auth'
import toast from 'react-hot-toast'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchParams] = useSearchParams()

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load lists after auth
  useEffect(() => {
    if (!user) return
    loadLists()
  }, [user])

  const loadLists = async () => {
    try {
      const data = await getLists()
      setLists(data)
      
      // Handle ?list= param
      const paramListId = searchParams.get('list')
      if (paramListId && data.find(l => l.id === paramListId)) {
        setActiveListId(paramListId)
        return
      }

      // Select default or first
      if (data.length > 0 && !activeListId) {
        const def = data.find(l => l.is_default) || data[0]
        setActiveListId(def.id)
      }

      // Auto-create first list
      if (data.length === 0) {
        const list = await createList('My List', true)
        setLists([list])
        setActiveListId(list.id)
      }
    } catch {
      toast.error('Could not load lists')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onAuth={() => supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user))} />
  }

  const activeList = lists.find(l => l.id === activeListId)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0 border-r border-gray-200">
        <ListSidebar
          lists={lists}
          activeListId={activeListId}
          onSelect={id => setActiveListId(id)}
          onRefresh={loadLists}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 h-full shadow-2xl">
            <ListSidebar
              lists={lists}
              activeListId={activeListId}
              onSelect={id => { setActiveListId(id); setShowSidebar(false) }}
              onRefresh={loadLists}
            />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setShowSidebar(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile header */}
        <div className="md:hidden bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <Menu size={18} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-brand-600 flex-1">🛒 Grabbit</h1>
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <LogOut size={16} className="text-gray-500" />
          </button>
        </div>

        {activeList ? (
          <ShoppingListView list={activeList} userId={user.id} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 p-8">
            <span className="text-5xl mb-4">🛒</span>
            <p className="text-lg font-medium text-gray-600">Select a list</p>
            <p className="text-sm text-center mt-1 text-gray-400">
              {lists.length === 0 ? 'Loading your lists...' : 'Choose from the sidebar'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
