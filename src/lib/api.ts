import { supabase, APP_ID } from './supabase'
import type { ShoppingList, ListItem, ListInvite } from '../types'

// ---- Lists ----

export async function getLists(): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createList(name: string, isDefault = false): Promise<ShoppingList> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ name, owner_id: user.id, is_default: isDefault })
    .select()
    .single()
  if (error) throw error

  // Auto-add as member
  await supabase.from('list_members').insert({
    list_id: data.id,
    user_id: user.id,
    role: 'owner'
  })

  return data
}

export async function renameList(id: string, name: string) {
  const { error } = await supabase
    .from('shopping_lists')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteList(id: string) {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ---- Items ----

export async function getItems(listId: string): Promise<ListItem[]> {
  const { data, error } = await supabase
    .from('list_items')
    .select('*')
    .eq('list_id', listId)
    .order('is_checked', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addItem(listId: string, name: string, extras?: Partial<ListItem>): Promise<ListItem> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, name, added_by: user?.id, ...extras })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleItem(item: ListItem) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('list_items')
    .update({
      is_checked: !item.is_checked,
      checked_by: !item.is_checked ? user?.id : null,
      checked_at: !item.is_checked ? new Date().toISOString() : null,
    })
    .eq('id', item.id)
  if (error) throw error
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('list_items').delete().eq('id', id)
  if (error) throw error
}

export async function clearCheckedItems(listId: string) {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('is_checked', true)
  if (error) throw error
}

// ---- Invites ----

export async function createInvite(listId: string): Promise<ListInvite> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('list_invites')
    .insert({ list_id: listId, created_by: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function joinViaInvite(inviteCode: string): Promise<string | null> {
  // Look up the invite
  const { data: invite, error } = await supabase
    .from('list_invites')
    .select('*')
    .eq('invite_code', inviteCode)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (error || !invite) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Add as member (ignore duplicate)
  await supabase
    .from('list_members')
    .upsert({ list_id: invite.list_id, user_id: user.id, role: 'member' })

  return invite.list_id
}

// ---- AI Features (Edge Functions) ----

async function callAI(fnName: string, body: object) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ app_id: APP_ID, ...body }),
    }
  )

  if (res.status === 402) {
    throw new Error('NO_CREDITS')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function ocrPhoto(imageBase64: string): Promise<string[]> {
  const result = await callAI('shopping-ocr', { image: imageBase64 })
  return result.items || []
}

export async function lookupBarcode(barcode: string): Promise<string | null> {
  const result = await callAI('shopping-barcode', { barcode })
  return result.name || null
}

export async function getSuggestions(listId: string): Promise<string[]> {
  const result = await callAI('shopping-suggest', { list_id: listId })
  return result.suggestions || []
}

export async function getCreditBalance(): Promise<number> {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('subscription_credits, one_off_credits, bonus_credits')
    .single()
  if (error) return 0
  return (data.subscription_credits || 0) + (data.one_off_credits || 0) + (data.bonus_credits || 0)
}
