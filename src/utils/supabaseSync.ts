// Utilitários para gerenciamento de dados no Supabase
import { ordersService, statsService } from '@/lib/supabase';
import { Order } from '@/types';

// Verificar e realizar reset se necessário
export const checkAndPerformReset = async (userId?: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const shouldReset = await statsService.shouldPerformReset(userId);
    if (shouldReset) {
      await statsService.performDailyReset(userId);
      console.log(`Reset diário realizado para usuário ${userId} às ${new Date().toLocaleTimeString()}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro no processo de reset:', error);
    return false;
  }
};

// Atualizar estatísticas no Supabase
export const updateStatsInSupabase = async (userId?: string): Promise<void> => {
  if (!userId) return;
  
  try {
    // Buscar pedidos finalizados do dia
    const finalizedOrders = await ordersService.getTodayFinalizedOrders(userId);
    const dailyRevenue = finalizedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = finalizedOrders.length;
    
    // Verificar se já existem stats para hoje
    let todayStats = await statsService.getTodayStats(userId);
    
    if (!todayStats) {
      // Criar stats do dia
      todayStats = await statsService.createTodayStats(userId, 0);
    }
    
    const cashCurrent = todayStats.cash_initial + dailyRevenue;
    
    // Atualizar stats
    await statsService.updateStats(userId, dailyRevenue, totalOrders, cashCurrent);
    
    console.log(`Estatísticas sincronizadas: R$ ${dailyRevenue.toFixed(2)}, ${totalOrders} pedidos`);
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    throw error;
  }
};

// Carregar dados do Supabase
export const loadDataFromSupabase = async (userId?: string) => {
  if (!userId) throw new Error('User ID is required');
  
  try {
    // Carregar pedidos do usuário
    const orders = await ordersService.getUserOrders(userId);
    
    // Carregar pedidos finalizados do dia
    const finalizedOrders = await ordersService.getTodayFinalizedOrders(userId);
    
    // Carregar estatísticas do dia
    const todayStats = await statsService.getTodayStats(userId);
    
    console.log(`Carregados ${orders.length} pedidos ativos e ${finalizedOrders.length} pedidos finalizados`);
    
    return {
      orders: orders.filter(order => order.status !== 'finalizados'),
      finalizedOrders,
      todayStats
    };
  } catch (error) {
    console.error('Erro ao carregar dados do Supabase:', error);
    throw error;
  }
};