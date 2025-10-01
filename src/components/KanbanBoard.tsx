import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Utensils } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from './ThemeToggle';
import { KanbanColumn } from './KanbanColumn';
import { AddOrderForm } from './AddOrderForm';
import { TableManagement } from './TableManagement';
import { Dashboard } from './Dashboard';
import { RevenueModal } from './RevenueModal';
import { CashRegisterModal } from './CashRegisterModal';
import { Order, Column } from '@/types';
import { checkAndPerformReset, updateStatsInSupabase, loadDataFromSupabase } from '@/utils/supabaseSync';
import { ordersService, statsService } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/utils/whatsapp';

const initialColumns: Column[] = [
  { 
    id: 'pedidos', 
    title: 'Pedidos', 
    color: 'bg-blue-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    textColor: 'text-blue-800'
  },
  { 
    id: 'preparando', 
    title: 'Preparando', 
    color: 'bg-orange-500',
    bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
    textColor: 'text-orange-800'
  },
  { 
    id: 'pronto', 
    title: 'Pronto para entrega', 
    color: 'bg-green-500',
    bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
    textColor: 'text-green-800'
  },
  { 
    id: 'finalizados', 
    title: 'Pedidos finalizados', 
    color: 'bg-gray-500',
    bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
    textColor: 'text-gray-800'
  }
];

interface KanbanBoardProps {
  onLogout: () => void;
  currentUser: { id: string; email: string; firstName: string; lastName: string } | null;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onLogout, currentUser }) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [orders, setOrders] = useState<Order[]>([]);
  const [finalizedOrders, setFinalizedOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);
  const [fadingOrders, setFadingOrders] = useState<Set<string>>(new Set());
  const [orderCounter, setOrderCounter] = useState(1);
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Carregar dados do Supabase ao inicializar
  useEffect(() => {
    if (currentUser) {
      loadSupabaseData();
    }
  }, []);

  // Carregar dados do Supabase
  const loadSupabaseData = async () => {
    if (!currentUser) return;
    
    setIsLoadingData(true);
    try {
      const data = await loadDataFromSupabase(currentUser.id);
      
      // Converter datas
      const convertedOrders = data.orders.map(order => ({
        ...order,
        createdAt: new Date(order.created_at),
        completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
        column: order.status,
        change: order.change_amount,
        receivedAmount: order.received_amount,
        tableNumber: order.table_number,
        paymentMethod: order.payment_method as any,
        cardColor: order.card_color || 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
      }));
      
      const convertedFinalizedOrders = data.finalizedOrders.map(order => ({
        ...order,
        createdAt: new Date(order.created_at),
        completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
        column: order.status,
        change: order.change_amount,
        receivedAmount: order.received_amount,
        tableNumber: order.table_number,
        paymentMethod: order.payment_method as any,
        cardColor: order.card_color || 'bg-gradient-to-br from-green-100 to-green-200 border-green-300'
      }));
      
      setOrders(convertedOrders);
      setFinalizedOrders(convertedFinalizedOrders);
      
      // Atualizar contador de pedidos
      const maxOrderNumber = Math.max(
        ...convertedOrders.map(o => o.orderNumber || 0),
        ...convertedFinalizedOrders.map(o => o.orderNumber || 0),
        0
      );
      setOrderCounter(maxOrderNumber + 1);
      
      // Verificar se precisa abrir modal do caixa
      if (data.todayStats) {
        // Se já tem stats do dia, não precisa abrir modal
        setIsCashRegisterModalOpen(false);
      } else {
        // Se não tem stats, precisa configurar caixa
        setIsCashRegisterModalOpen(true);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
      // Em caso de erro, abrir modal do caixa
      setIsCashRegisterModalOpen(true);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Verificar reset diário a cada minuto
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      checkAndPerformReset(currentUser.id).then(wasReset => {
        if (wasReset) {
          // Recarregar dados após reset
          loadSupabaseData();
        }
      }).catch(error => {
        console.error('Erro ao verificar reset:', error);
      });
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [currentUser]);

  // Atualizar estatísticas no Supabase periodicamente
  useEffect(() => {
    if (!currentUser || isLoadingData) return;
    
    const updateInterval = setInterval(async () => {
      try {
        await updateStatsInSupabase(currentUser.id);
      } catch (error) {
        console.error('Erro na atualização automática:', error);
      }
    }, 30000); // Atualizar a cada 30 segundos
    
    return () => clearInterval(updateInterval);
  }, [orders, finalizedOrders, currentUser, isLoadingData]);

  const addOrder = (orderData: {
    name: string;
    description: string;
    total: number;
    paymentMethod?: 'pix' | 'dinheiro' | 'debito' | 'credito';
    phone: string;
    tableNumber?: number;
    receivedAmount?: number;
    change?: number;
    address?: {
      street: string;
      number: string;
      cep: string;
      reference: string;
    };
  }) => {
    if (!currentUser) return;

    // Se uma mesa foi selecionada, marcar como ocupada
    if (orderData.tableNumber) {
      setTables(prev => 
        prev.map(table => 
          table.number === orderData.tableNumber 
            ? { ...table, status: 'occupied' }
            : table
        )
      );
    }

    const cardColors = [
      'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300',
      'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300',
      'bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300',
      'bg-gradient-to-br from-cyan-100 to-cyan-200 border-cyan-300',
      'bg-gradient-to-br from-teal-100 to-teal-200 border-teal-300',
      'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300',
      'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300',
      'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300'
    ];

    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: orderCounter,
      ...orderData,
      column: 'pedidos',
      createdAt: new Date(),
      cardColor: cardColors[Math.floor(Math.random() * cardColors.length)]
    };

    setOrders(prev => [...prev, newOrder]);
    setOrderCounter(prev => prev + 1);
    
    // Salvar no Supabase
    if (currentUser) {
      ordersService.saveOrder(newOrder, currentUser.id).catch(error => {
        console.error('Erro ao salvar novo pedido:', error);
      });
    }
  };

  const moveOrder = async (orderId: string, targetColumn: string) => {
    if (!currentUser) return;

    const orderToMove = orders.find(order => order.id === orderId);
    if (!orderToMove) return;

    console.log(`Movendo pedido ${orderId} para coluna ${targetColumn}`);

    // Enviar mensagem do WhatsApp baseada na coluna de destino e condições específicas
    if (targetColumn === 'finalizados' && orderToMove.phone && orderToMove.phone.trim() !== '') {
      // Verificar se tem mesa selecionada - se tiver, não envia mensagem
      if (!orderToMove.tableNumber) {
        // Verificar se tem endereço completo
        const hasAddress = orderToMove.address && 
          (orderToMove.address.street || orderToMove.address.number || 
           orderToMove.address.cep || orderToMove.address.reference);
        
        if (hasAddress) {
          // Condição 1: Tem telefone e endereço - mensagem de entrega
          sendWhatsAppMessage(orderToMove.phone, 'Seu pedido foi e em instantes estará na sua casa, bom apetite!');
        } else {
          // Condição 2: Só tem telefone - mensagem de retirada
          sendWhatsAppMessage(orderToMove.phone, 'Seu pedido está pronto, já pode vir retirar');
        }
        // Condição 3: Se tiver mesa, não envia mensagem (já tratado no if acima)
      }
    }

    // Se está movendo para a coluna de finalizados
    if (targetColumn === 'finalizados') {
      // Liberar mesa se o pedido tinha uma mesa associada
      if (orderToMove.tableNumber) {
        setTables(prevTables => 
          prevTables.map(table => 
            table.number === orderToMove.tableNumber 
              ? { ...table, status: 'free' }
              : table
          )
        );
      }

      setFadingOrders(prevFading => new Set(prevFading).add(orderId));
      
      // Após a animação, mover o pedido para finalizedOrders e remover de orders
      setTimeout(async () => {
        const finalizedOrder = { 
          ...orderToMove, 
          column: 'finalizados',
          completedAt: new Date()
        };
        
        try {
          // Atualizar no Supabase PRIMEIRO
          await ordersService.updateOrder(orderId, finalizedOrder, currentUser.id);
          
          // Só depois atualizar o estado local
          setFinalizedOrders(prevFinalized => [...prevFinalized, finalizedOrder]);
          setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
          
          // Atualizar estatísticas após finalizar pedido
          await updateStatsInSupabase(currentUser.id);
          
          console.log(`Pedido #${orderToMove.orderNumber} finalizado com sucesso`);
        } catch (error) {
          console.error('Erro ao finalizar pedido no Supabase:', error);
          // Em caso de erro, reverter o estado
          alert('Erro ao finalizar pedido. Tente novamente.');
        }
        
        setFadingOrders(prevFading => {
          const newSet = new Set(prevFading);
          newSet.delete(orderId);
          return newSet;
        });
      }, 500); // Duração da animação
      
    } else {
      // Movimento normal entre outras colunas
      const updatedOrder = { ...orderToMove, column: targetColumn };
      
      try {
        // Atualizar no Supabase primeiro
        await ordersService.updateOrder(orderId, updatedOrder, currentUser.id);
        
        // Só depois atualizar estado local
        setOrders(prev => prev.map(order =>
          order.id === orderId ? updatedOrder : order
        ));
        
        console.log(`Pedido ${orderId} movido para ${targetColumn} com sucesso`);
      } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        alert('Erro ao mover pedido. Tente novamente.');
      }
    }
  };

  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
    if (!currentUser) return;

    // Atualizar estado local imediatamente
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, ...updatedOrder }
          : order
      )
    );
    
    try {
      // Atualizar no Supabase em background
      await ordersService.updateOrder(orderId, updatedOrder, currentUser.id);
      console.log(`Pedido ${orderId} atualizado com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      // Recarregar dados em caso de erro
      loadSupabaseData();
    }
  };

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    setColumns(prev =>
      prev.map(column =>
        column.id === columnId
          ? { ...column, title: newTitle }
          : column
      )
    );
  };

  const handleCashRegisterSave = (initialAmount: number) => {
    if (!currentUser) return;
    
    // Criar estatísticas do dia no Supabase
    statsService.createTodayStats(currentUser.id, initialAmount).catch(error => {
      console.error('Erro ao criar estatísticas do dia:', error);
    });
    
    setIsCashRegisterModalOpen(false);
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden transition-colors duration-300">
      
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="relative">
                <img 
                  src="https://i.imgur.com/cwg06jT.png" 
                  alt="Balcão Digital Logo" 
                  className="w-14 h-14 rounded-2xl shadow-lg object-cover border-2 border-white"
                  onError={(e) => {
                    // Fallback para ícone se a imagem não carregar
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg">
                  <Utensils className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                  Balcão Digital
                </h1>
                <p className="text-sm text-orange-600 font-medium">Sistema de Gestão Gastronômica</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              <span className="text-gray-600 dark:text-gray-300">Gerencie seus pedidos com eficiência!</span>
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <User className="h-4 w-4 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{currentUser.firstName} {currentUser.lastName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{currentUser.email}</p>
                </div>
              </div>
            )}
            <ThemeToggle />
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Dashboard - mostra apenas pedidos finalizados */}
        <Dashboard 
          orders={finalizedOrders} 
          onRevenueClick={() => setIsRevenueModalOpen(true)}
        />

        {/* Tabs */}
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
              <TabsTrigger value="orders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                Gestão de Pedidos
              </TabsTrigger>
              <TabsTrigger value="tables" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                Controle de Mesas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="space-y-6 mt-6">
              {/* Add Order Form */}
              <AddOrderForm onAddOrder={addOrder} tables={tables} />

              {/* Kanban Board */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 text-center">
                  Quadro de Pedidos
                </h2>
                
                <div className="w-full overflow-x-auto">
                  <div className="flex gap-4 sm:gap-6 pb-4 min-w-max">
                    {columns.map((column, index) => (
                      <div
                        key={column.id}
                        className="flex-shrink-0"
                        style={{ animationDelay: `${600 + index * 100}ms` }}
                      >
                        <KanbanColumn
                          column={column}
                          orders={column.id === 'finalizados' ? [] : orders}
                          finalizedOrders={finalizedOrders}
                          onMove={moveOrder}
                          onUpdate={updateOrder}
                          onUpdateTitle={updateColumnTitle}
                          fadingOrders={fadingOrders}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tables" className="mt-6">
              <TableManagement tables={tables} setTables={setTables} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Revenue Modal - mostra pedidos finalizados */}
        <RevenueModal
          isOpen={isRevenueModalOpen}
          onClose={() => setIsRevenueModalOpen(false)}
          orders={finalizedOrders}
        />

        {/* Cash Register Modal */}
        <CashRegisterModal
          isOpen={isCashRegisterModalOpen}
          onClose={() => setIsCashRegisterModalOpen(false)}
          onSave={handleCashRegisterSave}
        />
      </div>
    </div>
  );
};