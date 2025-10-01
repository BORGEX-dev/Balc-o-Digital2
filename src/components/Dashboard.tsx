import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Clock, CircleCheck as CheckCircle, Wallet } from 'lucide-react';
import { Order } from '@/types';

interface DashboardProps {
  orders: Order[];
  onRevenueClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, onRevenueClick }) => {
  // Orders são apenas os pedidos finalizados do dia atual
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  
  // Dados do caixa serão obtidos do Supabase via props ou context
  const initialCashAmount = 0; // Será obtido do Supabase
  const currentCashAmount = initialCashAmount + totalRevenue;
  
  // Calcular tempo médio de processamento (apenas pedidos do dia atual)
  const averageProcessingTime = totalOrders > 0
    ? orders.reduce((sum, order) => {
        if (order.completedAt) {
          const processingTime = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
          return sum + processingTime;
        }
        return sum;
      }, 0) / totalOrders
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    {
      title: 'Receita Total',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      clickable: true,
      onClick: onRevenueClick
    },
    {
      title: 'Pedidos Finalizados',
      value: totalOrders.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      clickable: false
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(averageOrderValue),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      clickable: false
    },
    {
      title: 'Caixa Atual',
      value: formatCurrency(currentCashAmount),
      icon: Wallet,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      clickable: false
    },
    {
      title: 'Tempo Médio',
      value: averageProcessingTime > 0 ? formatTime(averageProcessingTime) : '0min',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      clickable: false
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`border-0 shadow-md transition-all duration-200 hover:shadow-lg animate-fade-in-up dark:bg-gray-800 dark:border-gray-700 ${
            stat.clickable ? 'cursor-pointer hover:scale-105 transform' : ''
          }`}
          onClick={stat.clickable ? stat.onClick : undefined}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className={`p-4 sm:p-6 ${stat.bgColor} dark:bg-gray-700/50`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{stat.title}</p>
                <p className={`text-lg sm:text-2xl font-bold ${stat.color} truncate`}>{stat.value}</p>
                {stat.clickable && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clique para ver detalhes</p>
                )}
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor} dark:bg-gray-600/50 border border-gray-200 dark:border-gray-600 transition-transform duration-200 hover:scale-110 flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};