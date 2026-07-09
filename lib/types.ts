// Généré manuellement depuis le schéma 0001_init_nathy_food.sql
// Remplace avec : npx supabase gen types typescript --project-id pxnqthmudmwybvuoizxh > lib/types.ts

export type SpiceLevel = 'doux' | 'moyen' | 'fort' | 'pili_pili_a_part'
export type OrderStatus = 'recue' | 'confirmee' | 'en_cuisine' | 'en_livraison' | 'livree' | 'annulee'
export type OrderType = 'livraison' | 'emporter'

export type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
}

export type DishOption = {
  id: string
  dish_id: string
  name: string
  extra_price_cents: number
  sort_order: number
}

export type Dish = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string
  price_cents: number
  image_url: string | null
  region: string | null
  is_available: boolean
  spice_customizable: boolean
  lead_time_hours: number
  available_days: number[] | null
  sort_order: number
  created_at: string
  dish_options?: DishOption[]
}

export type Story = {
  id: string
  dish_id: string
  title: string
  body: string
  audio_url: string | null
}

export type DishWithStory = Dish & { stories: Story | null }

export type DeliveryZone = {
  id: string
  postal_code: string
  city: string
  fee_cents: number
  min_order_cents: number
  is_active: boolean
}

export type DeliverySlot = {
  id: string
  slot_date: string   // 'YYYY-MM-DD'
  start_time: string  // 'HH:MM:SS'
  end_time: string    // 'HH:MM:SS'
  max_orders: number
  orders_count: number
  is_active: boolean
}

export type OrderItem = {
  id: string
  order_id: string
  dish_id: string | null
  dish_name: string
  unit_price_cents: number
  quantity: number
  spice: SpiceLevel | null
  options: { name: string; extra_price_cents?: number }[]
}

export type Order = {
  id: string
  public_token: string
  customer_name: string
  phone: string
  email: string | null
  type: OrderType
  status: OrderStatus
  address: string | null
  postal_code: string | null
  slot_id: string | null
  subtotal_cents: number
  delivery_fee_cents: number
  total_cents: number
  notes: string | null
  stripe_session_id: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

// Placeholder pour le générique Supabase.
// Pour regénérer : npx supabase gen types typescript --project-id <project-id> > lib/types.ts
// Le type Database doit inclure Relationships: [] sur chaque table pour satisfaire GenericTable.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rel = any[]

type DishRow = Omit<Dish, 'dish_options'>
type OrderRow = Omit<Order, 'order_items'> & { stripe_payment_intent: string | null }

export type Database = {
  public: {
    Tables: {
      categories: {
        Row:           Category
        Insert:        Omit<Category, 'id'>
        Update:        Partial<Category>
        Relationships: Rel
      }
      dishes: {
        Row:           DishRow
        Insert:        Omit<DishRow, 'id' | 'created_at'>
        Update:        Partial<DishRow>
        Relationships: Rel
      }
      dish_options: {
        Row:           DishOption
        Insert:        Omit<DishOption, 'id'>
        Update:        Partial<DishOption>
        Relationships: Rel
      }
      stories: {
        Row:           Story
        Insert:        Omit<Story, 'id'>
        Update:        Partial<Story>
        Relationships: Rel
      }
      delivery_zones: {
        Row:           DeliveryZone
        Insert:        Omit<DeliveryZone, 'id'>
        Update:        Partial<DeliveryZone>
        Relationships: Rel
      }
      delivery_slots: {
        Row:           DeliverySlot
        Insert:        Omit<DeliverySlot, 'id'>
        Update:        Partial<DeliverySlot>
        Relationships: Rel
      }
      orders: {
        Row:           OrderRow
        Insert:        Omit<OrderRow, 'id' | 'created_at' | 'updated_at'>
        Update:        Partial<OrderRow>
        Relationships: Rel
      }
      order_items: {
        Row:           OrderItem
        Insert:        Omit<OrderItem, 'id'>
        Update:        Partial<OrderItem>
        Relationships: Rel
      }
    }
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums: {
      spice_level:  SpiceLevel
      order_status: OrderStatus
      order_type:   OrderType
    }
  }
}
