export interface ShoppingList {
  id: string
  name: string
  owner_id: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ListMember {
  id: string
  list_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface ListItem {
  id: string
  list_id: string
  name: string
  quantity?: string
  category?: string
  is_checked: boolean
  checked_by?: string
  checked_at?: string
  photo_url?: string
  barcode?: string
  added_by?: string
  created_at: string
  sort_order: number
}

export interface ListInvite {
  id: string
  list_id: string
  invite_code: string
  created_by: string
  expires_at: string
  created_at: string
}
