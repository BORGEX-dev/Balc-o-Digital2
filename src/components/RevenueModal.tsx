import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Package, TrendingUp, Calendar, X, Clock, Download, Wallet } from 'lucide-react';
import { Order } from '@/types';
import { getTotalAccumulatedRevenue } from '@/utils/dailyReset';
import { generatePDFReport, ReportData } from '@/utils/pdfGenerator';

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const RevenueModal: React.FC<RevenueModalProps> = ({ isOpen, onClose, orders }) => {
  const dailyRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalAccumulatedRevenue = dailyRevenue; // Agora vem direto do Supabase
  const totalOrders = orders.length;
  
  // Dados do caixa serão obtidos do Supabase
  const initialCashAmount = 0; // Será obtido do Supabase
  const currentCashAmount = initialCashAmount + dailyRevenue;
  
  // Calcular tempo médio de processamento
  const averageProcessingTime = orders.length > 0
    ? orders.reduce((sum, order) => {
        if (order.completedAt) {
          const processingTime = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
          return sum + processingTime;
        }
        return sum;
      }, 0) / orders.length
    : 0;

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${remainingMinutes}min`;
  };

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.column] = (acc[order.column] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenueByStatus = orders.reduce((acc, order) => {
    acc[order.column] = (acc[order.column] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const averageOrderValue = totalOrders > 0 ? dailyRevenue / totalOrders : 0;

  const statusLabels = {
    pedidos: 'Pedidos',
    preparando: 'Preparando',
    pronto: 'Pronto para entrega'
  };

  const statusColors = {
    pedidos: 'text-blue-600 bg-blue-50',
    preparando: 'text-orange-600 bg-orange-50',
    pronto: 'text-green-600 bg-green-50'
  };

  const handleDownloadReport = async () => {
    const reportData: ReportData = {
      dailyRevenue,
      totalAccumulatedRevenue,
      totalOrders,
      averageOrderValue,
      ordersByStatus,
      revenueByStatus,
      orders,
      cashRegister: { initialAmount: initialCashAmount, currentAmount: currentCashAmount },
      averageProcessingTime
    };

    try {
      await generatePDFReport(reportData);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white text-gray-900 border-gray-200">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Dashboard de Receitas
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleDownloadReport}
                className="bg-green-600 hover:bg-green-700 text-white border-0"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Relatório Diário
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-700 border-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 border-gray-200">
              <CardContent className="p-6 text-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita Total Acumulada</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAccumulatedRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">Nunca reseta</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-gray-200">
              <CardContent className="p-6 text-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita do Dia</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(dailyRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">Reseta às 17h</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 border-gray-200">
              <CardContent className="p-6 text-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pedidos do Dia</p>
                    <p className="text-2xl font-bold text-purple-600">{totalOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">Reseta às 17h</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50 border-gray-200">
              <CardContent className="p-6 text-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Caixa Atual</p>
                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(currentCashAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">Inicial: {formatCurrency(initialCashAmount)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-indigo-100">
                    <Wallet className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 border-gray-200">
              <CardContent className="p-6 text-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {averageProcessingTime > 0 ? formatTime(averageProcessingTime) : '0min'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Processamento</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Caixa */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-400 border-gray-200">
            <CardContent className="p-4 text-gray-900">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className="font-semibold text-indigo-800">Controle de Caixa</h4>
                  <p className="text-sm text-indigo-700">
                    Valor inicial: {formatCurrency(initialCashAmount)} | 
                    Vendas do dia: {formatCurrency(dailyRevenue)} | 
                    Total atual: {formatCurrency(currentCashAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informação sobre Reset Diário */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-400 border-gray-200">
            <CardContent className="p-4 text-gray-900">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Reset Automático Diário</h4>
                  <p className="text-sm text-yellow-700">
                    Todos os dias às 17h, os pedidos do dia são resetados automaticamente. 
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por Status */}
          <Card className="border-0 shadow-md bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Detalhamento por Status (Dia Atual)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className={`p-4 rounded-lg ${statusColors[status as keyof typeof statusColors]}`}>
                    <h4 className="font-semibold mb-2">{label}</h4>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Pedidos:</span> {ordersByStatus[status] || 0}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Receita:</span> {formatCurrency(revenueByStatus[status] || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pedidos */}
          {orders.length > 0 && (
            <Card className="border-0 shadow-md bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Pedidos do Dia Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-gray-900">
                      <div className="flex-1">
                            <Badge variant="outline" className="bg-white text-gray-700 font-bold">
                              #{order.orderNumber}
                            </Badge>
                            <span className="font-medium text-gray-800">{order.name}</span>
                            {order.tableNumber && (
                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                                Mesa {order.tableNumber}
                              </Badge>
                            )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{order.name}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.column as keyof typeof statusColors]}`}>
                            {statusLabels[order.column as keyof typeof statusLabels]}
                          </span>
                          {order.completedAt && (
                            <p className="text-xs text-gray-500">
                              Tempo de processamento: {formatTime(
                                new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime()
                              )}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{order.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};