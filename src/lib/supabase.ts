import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para pedidos
export interface UserOrder {
  id: string
  user_id: string
  order_number: number
  name: string
  description: string
  total: number
  payment_method?: string
  phone?: string
  table_number?: number
  received_amount?: number
  change_amount?: number
  address?: any
  status: string
  card_color?: string
  created_at: string
  completed_at?: string
}

// Tipos para estatísticas diárias
export interface UserDailyStats {
  id: string
  user_id: string
  date: string
  daily_revenue: number
  total_orders: number
  cash_initial: number
  cash_current: number
  last_reset_at: string
  created_at: string
  updated_at: string
}

// Tipos para o usuário
export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

// Funções de autenticação
export const authService = {
  // Cadastro
  async signUp(email: string, password: string, firstName: string, lastName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    })
    
    if (error) throw error
    return data
  },

  // Login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error && error.message !== 'Auth session missing!') throw error
    return user
  },

  // Obter perfil do usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  },

  // Criar ou atualizar perfil do usuário
  async upsertUserProfile(userId: string, firstName: string, lastName: string, email: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Funções para gerenciar pedidos no Supabase
export const ordersService = {
  // Salvar pedido
  async saveOrder(order: any, userId: string) {
    const { data, error } = await supabase
      .from('user_orders')
      .insert({
        user_id: userId,
        order_number: order.orderNumber,
        name: order.name,
        description: order.description,
        total: order.total,
        payment_method: order.paymentMethod,
        phone: order.phone,
        table_number: order.tableNumber,
        received_amount: order.receivedAmount,
        change_amount: order.change,
        address: order.address,
        status: order.column,
        card_color: order.cardColor,
        created_at: order.createdAt,
        completed_at: order.completedAt
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Atualizar pedido
  async updateOrder(orderId: string, updates: any, userId: string) {
    console.log(`Atualizando pedido ${orderId} para status: ${updates.column}`);
    
    const { data, error } = await supabase
      .from('user_orders')
      .update({
        name: updates.name,
        description: updates.description,
        total: updates.total,
        payment_method: updates.paymentMethod,
        phone: updates.phone,
        table_number: updates.tableNumber,
        received_amount: updates.receivedAmount,
        change_amount: updates.change,
        address: updates.address,
        status: updates.column,
        completed_at: updates.completedAt,
      })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar pedido no Supabase:', error);
      throw error;
    }
    
    console.log(`Pedido ${orderId} atualizado com sucesso no Supabase`);
    return data
  },

  // Buscar pedidos do usuário
  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('user_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Buscar pedidos finalizados do dia
  async getTodayFinalizedOrders(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'finalizados')
      .gte('completed_at', `${today}T00:00:00.000Z`)
      .lt('completed_at', `${today}T23:59:59.999Z`)
      .order('completed_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Deletar pedidos do dia (reset às 17h)
  async resetDailyOrders(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('user_orders')
      .delete()
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
    
    if (error) throw error
  }
}

// Funções para estatísticas diárias
export const statsService = {
  // Obter ou criar estatísticas do dia
  async getTodayStats(userId: string): Promise<UserDailyStats | null> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  // Criar estatísticas do dia
  async createTodayStats(userId: string, initialCash: number = 0) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_daily_stats')
      .insert({
        user_id: userId,
        date: today,
        cash_initial: initialCash,
        cash_current: initialCash,
        daily_revenue: 0,
        total_orders: 0
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Atualizar estatísticas
  async updateStats(userId: string, revenue: number, orderCount: number, cashCurrent: number) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_daily_stats')
      .update({
        daily_revenue: revenue,
        total_orders: orderCount,
        cash_current: cashCurrent,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('date', today)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Reset diário (às 17h) - apenas dados do dia atual
  async performDailyReset(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    // Deletar apenas pedidos do dia atual (não finalizados)
    const { error: deleteOrdersError } = await supabase
      .from('user_orders')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'pedidos')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
    
    if (deleteOrdersError) throw deleteOrdersError
    
    // Deletar pedidos em preparação e prontos do dia atual
    const { error: deletePreparingError } = await supabase
      .from('user_orders')
      .delete()
      .eq('user_id', userId)
      .in('status', ['preparando', 'pronto'])
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
    
    if (deletePreparingError) throw deletePreparingError
    
    // Resetar estatísticas do dia (manter pedidos finalizados)
    const { error: resetStatsError } = await supabase
      .from('user_daily_stats')
      .update({
        daily_revenue: 0,
        total_orders: 0,
        cash_current: 0,
        last_reset_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('date', today)
    
    if (resetStatsError) throw resetStatsError
  },

  // Verificar se precisa fazer reset
  async shouldPerformReset(userId: string): Promise<boolean> {
    const now = new Date()
    const currentHour = now.getHours()
    
    // Só faz reset se for após as 17h
    if (currentHour < 17) {
      return false
    }
    
    const todayStats = await this.getTodayStats(userId)
    
    if (!todayStats) {
      return false // Se não tem stats do dia, não precisa resetar
    }
    
    const lastReset = new Date(todayStats.last_reset_at)
    const today = new Date()
    
    // Verificar se o último reset foi hoje após as 17h
    const todayResetTime = new Date(today)
    todayResetTime.setHours(17, 0, 0, 0)
    
    return lastReset < todayResetTime
  }
}