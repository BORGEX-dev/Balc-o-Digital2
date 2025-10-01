import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Check, X, CheckCircle, Clock } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import { Order, Column } from '@/types';

interface KanbanColumnProps {
  column: Column;
  orders: Order[];
  finalizedOrders?: Order[];
  onMove: (orderId: string, targetColumn: string) => void;
  onUpdate: (orderId: string, updatedOrder: Partial<Order>) => void;
  onUpdateTitle: (columnId: string, newTitle: string) => void;
  fadingOrders?: Set<string>;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  orders,
  finalizedOrders = [],
  onMove,
  onUpdate,
  onUpdateTitle,
  fadingOrders = new Set()
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdateTitle(column.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(column.title);
    setIsEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId) {
      onMove(orderId, column.id);
    }
  };

  const columnOrders = orders.filter(order => order.column === column.id);
  const isFinalizadosColumn = column.id === 'finalizados';
  
  const displayOrders = isFinalizadosColumn ? [] : columnOrders;
  const orderCount = isFinalizadosColumn ? finalizedOrders.length : columnOrders.length;
  const columnTotal = isFinalizadosColumn 
    ? finalizedOrders.reduce((sum, order) => sum + order.total, 0)
    : 0;

  // Calcular tempo médio de processamento para pedidos finalizados
  const averageProcessingTime = isFinalizadosColumn && finalizedOrders.length > 0
    ? finalizedOrders.reduce((sum, order) => {
        if (order.completedAt) {
          const processingTime = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
          return sum + processingTime;
        }
        return sum;
      }, 0) / finalizedOrders.length
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

  return (
    <Card 
      className={`w-80 sm:w-[320px] border-0 shadow-lg transition-all duration-300 animate-fade-in-up ${
        isDragOver ? (isFinalizadosColumn ? 'bg-red-50 border-2 border-red-300 border-dashed transform scale-105' : 'bg-blue-50 border-2 border-blue-300 border-dashed transform scale-105') : ''
      } ${column.bgColor}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold bg-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
              />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleSaveTitle} 
                className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-md flex-shrink-0"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleCancelEdit} 
                className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-md flex-shrink-0"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-4 h-4 rounded-full ${column.color} animate-pulse flex-shrink-0 shadow-md`}></div>
              <h3 className={`text-lg font-bold truncate ${
                column.id === 'pedidos' ? 'text-blue-800 dark:text-blue-600' :
                column.id === 'preparando' ? 'text-orange-800 dark:text-orange-600' :
                column.id === 'pronto' ? 'text-green-800 dark:text-green-600' :
                'text-gray-800 dark:text-gray-600'
              }`}>{column.title}</h3>
              {isFinalizadosColumn && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="ml-auto bg-white/70 hover:bg-white border border-gray-300 transition-all duration-200 rounded-md flex-shrink-0"
              >
                <Edit className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          )}
        </div>
        
        <div className={`flex items-center justify-between text-sm font-medium ${
          column.id === 'pedidos' ? 'text-blue-700 dark:text-blue-400' :
          column.id === 'preparando' ? 'text-orange-700 dark:text-orange-400' :
          column.id === 'pronto' ? 'text-green-700 dark:text-green-400' :
          'text-gray-700 dark:text-gray-400'
        }`}>
          <span>{orderCount} pedidos{isFinalizadosColumn ? ' finalizados' : ''}</span>
          {isFinalizadosColumn && (
            <span className="font-bold text-green-700">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(columnTotal)}
            </span>
          )}
        </div>

        {isFinalizadosColumn && averageProcessingTime > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
            <Clock className="h-4 w-4" />
            <span>Tempo médio: {formatTime(averageProcessingTime)}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
        {isDragOver && (
          <div className={`border-2 border-dashed rounded-lg p-8 text-center animate-bounce ${
            isFinalizadosColumn 
              ? 'border-red-300 text-red-600 bg-red-50' 
              : 'border-blue-300 text-blue-600 bg-blue-50'
          }`}>
            <div className="text-lg font-semibold">
              {isFinalizadosColumn ? 'Finalizar pedido' : 'Solte o card aqui'}
            </div>
            <div className="text-sm">
              {isFinalizadosColumn ? 'O pedido será finalizado e contabilizado' : `Mover para ${column.title}`}
            </div>
          </div>
        )}
        
        {displayOrders.length === 0 && !isDragOver ? (
          <div className="text-center py-12 text-gray-600 animate-fade-in">
            <div className="text-lg font-medium">
              {isFinalizadosColumn ? 'Pedidos finalizados' : 'Nenhum pedido'}
            </div>
            <p className="text-sm mt-2">
              {isFinalizadosColumn 
                ? `${orderCount} pedidos já foram finalizados` 
                : 'Arraste cards para esta coluna'
              }
            </p>
            {isFinalizadosColumn && orderCount > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">
                  Total faturado: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(columnTotal)}
                </p>
                {averageProcessingTime > 0 && (
                  <p className="text-xs text-green-700 mt-1">
                    Tempo médio de processamento: {formatTime(averageProcessingTime)}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          displayOrders.map((order, index) => (
            <div
              key={order.id}
              className={`transition-all duration-500 ${
                fadingOrders.has(order.id) 
                  ? 'opacity-0 transform scale-95 translate-y-2' 
                  : 'opacity-100 transform scale-100 translate-y-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <KanbanCard
                order={order}
                onUpdate={onUpdate}
                currentColumn={column.id}
                isFinalized={false}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};