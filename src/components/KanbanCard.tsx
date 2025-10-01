import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, DollarSign, User, Package, Edit, Check, X, CheckCircle, Hash, Clock, FileText, MapPin, Home, CreditCard } from 'lucide-react';
import { Order } from '@/types';
import { sendWhatsAppMessage, getStatusMessage } from '@/utils/whatsapp';
import { generateInvoicePDF } from '@/utils/invoicePdfGenerator';
import { searchCep, formatCep } from '@/utils/cepService';
import { PrintInvoiceModal } from './PrintInvoiceModal';

interface KanbanCardProps {
  order: Order;
  onUpdate: (orderId: string, updatedOrder: Partial<Order>) => void;
  currentColumn: string;
  isFinalized?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  order,
  onUpdate,
  currentColumn,
  isFinalized = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: order.name,
    description: order.description,
    total: order.total.toString(),
    paymentMethod: order.paymentMethod || '',
    receivedAmount: order.receivedAmount?.toString() || '',
    change: order.change?.toString() || '',
    phone: order.phone,
    tableNumber: order.tableNumber?.toString() || '',
    cep: order.address?.cep || '',
    street: order.address?.street || '',
    number: order.address?.number || '',
    reference: order.address?.reference || ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleWhatsAppClick = () => {
    const message = getStatusMessage(currentColumn);
    sendWhatsAppMessage(order.phone, message);
  };

  const handleGenerateInvoice = () => {
    setIsPrintModalOpen(true);
  };
  const handleSaveEdit = () => {
    const total = parseFloat(editData.total);
    const receivedAmount = parseFloat(editData.receivedAmount) || undefined;
    const change = parseFloat(editData.change) || undefined;
    const paymentMethod = editData.paymentMethod as 'pix' | 'dinheiro' | 'debito' | 'credito' | undefined;
    
    if (isNaN(total) || total <= 0) {
      alert('Por favor, insira um valor válido para o total');
      return;
    }

    const address = (editData.cep || editData.street || editData.number || editData.reference) ? {
      street: editData.street,
      number: editData.number,
      cep: editData.cep,
      reference: editData.reference
    } : undefined;
    onUpdate(order.id, {
      name: editData.name,
      description: editData.description,
      total,
      paymentMethod,
      receivedAmount,
      change,
      phone: editData.phone,
      tableNumber: editData.tableNumber ? parseInt(editData.tableNumber) : undefined,
      address
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData({
      name: order.name,
      description: order.description,
      total: order.total.toString(),
      paymentMethod: order.paymentMethod || '',
      receivedAmount: order.receivedAmount?.toString() || '',
      change: order.change?.toString() || '',
      phone: order.phone,
      tableNumber: order.tableNumber?.toString() || '',
      cep: order.address?.cep || '',
      street: order.address?.street || '',
      number: order.address?.number || '',
      reference: order.address?.reference || ''
    });
    setIsEditing(false);
  };

  const calculateChange = (total: string, received: string) => {
    const totalValue = parseFloat(total) || 0;
    const receivedValue = parseFloat(received) || 0;
    
    if (receivedValue > 0 && totalValue > 0) {
      const change = receivedValue - totalValue;
      return change >= 0 ? change.toFixed(2) : '0.00';
    }
    return '';
  };

  const handleEditChange = async (field: string, value: string) => {
    // Atualizar o estado imediatamente
    const newEditData = {
      ...editData,
      [field]: value
    };

    // Calcular troco se os campos relevantes foram alterados
    if (field === 'total' || field === 'receivedAmount') {
      const total = field === 'total' ? value : editData.total;
      const received = field === 'receivedAmount' ? value : editData.receivedAmount;
      newEditData.change = calculateChange(total, received);
    }

    setEditData(newEditData);

    // Se o campo for CEP e tiver 8 dígitos, buscar o endereço
    if (field === 'cep') {
      const cleanCep = value.replace(/[^\d]/g, '');
      
      if (cleanCep.length === 8) {
        setIsLoadingCep(true);
        
        try {
          const cepData = await searchCep(cleanCep);
          
          if (cepData) {
            setEditData(prev => ({
              ...prev,
              ...newEditData,
              cep: formatCep(cleanCep),
              street: cepData.logradouro || prev.street // Agora inclui rua + bairro
            }));
          } else {
            // CEP não encontrado, apenas formatar
            setEditData(prev => ({
              ...prev,
              ...newEditData,
              cep: formatCep(cleanCep)
            }));
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
          // Em caso de erro, apenas formatar o CEP
          setEditData(prev => ({
            ...prev,
            ...newEditData,
            cep: formatCep(cleanCep)
          }));
        } finally {
          setIsLoadingCep(false);
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', order.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'dinheiro': return 'Dinheiro';
      case 'debito': return 'Cartão de Débito';
      case 'credito': return 'Cartão de Crédito';
      default: return '';
    }
  };

  const getPaymentMethodColor = (method?: string) => {
    switch (method) {
      case 'pix': return 'text-green-600';
      case 'dinheiro': return 'text-yellow-600';
      case 'debito': return 'text-blue-600';
      case 'credito': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card 
      className={`shadow-md hover:shadow-xl transition-all duration-300 border-2 animate-fade-in-up ${
        isDragging ? 'opacity-50 rotate-2 scale-105 shadow-2xl' : ''
      } ${!isEditing ? 'cursor-move' : ''} ${order.cardColor}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Badge variant="outline" className="bg-white/80 text-gray-700 font-bold border-gray-400">
              #{order.orderNumber}
            </Badge>
            {order.tableNumber && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                <Hash className="h-3 w-3 mr-1" />
                Mesa {order.tableNumber}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="text-sm font-semibold"
                placeholder="Nome do cliente"
              />
            ) : (
              <span className={`font-semibold ${isFinalized ? 'text-gray-600' : 'text-gray-800'}`}>
                {order.name}
              </span>
            )}
            {isFinalized && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {!isEditing && !isFinalized ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200 rounded-md"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
            ) : isEditing ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100 border border-green-200 transition-all duration-200 rounded-md"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200 rounded-md"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/50 rounded px-2 py-1">
          <Clock className="h-3 w-3" />
          <span>Criado: {formatDateTime(order.createdAt)}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className={`text-sm ${isFinalized ? 'text-gray-500' : 'text-gray-600'}`}>Pedido:</p>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm font-medium min-h-[60px]"
                  placeholder="Descrição do pedido"
                />
              ) : (
                <p className={`text-sm font-medium ${isFinalized ? 'text-gray-600' : 'text-gray-800'}`}>
                  {order.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className={`text-sm ${isFinalized ? 'text-gray-500' : 'text-gray-600'}`}>Valor Total:</p>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editData.total}
                  onChange={(e) => handleEditChange('total', e.target.value)}
                  className="text-lg font-bold text-green-600"
                  placeholder="0.00"
                />
              ) : (
                <p className="text-lg font-bold text-green-600">{formatCurrency(order.total)}</p>
              )}
            </div>
          </div>

          {order.paymentMethod && (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <div className="flex-1">
                <p className={`text-sm ${isFinalized ? 'text-gray-500' : 'text-gray-600'}`}>Forma de Pagamento:</p>
                {isEditing ? (
                  <Select value={editData.paymentMethod} onValueChange={(value) => setEditData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger className="text-sm font-medium">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className={`text-sm font-medium ${getPaymentMethodColor(order.paymentMethod)} ${isFinalized ? 'opacity-75' : ''}`}>
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Valor Recebido e Troco */}

          {order.tableNumber && (
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-indigo-600" />
              <div className="flex-1">
                <p className={`text-sm ${isFinalized ? 'text-gray-500' : 'text-gray-600'}`}>Mesa:</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editData.tableNumber}
                    onChange={(e) => setEditData(prev => ({ ...prev, tableNumber: e.target.value }))}
                    className="text-sm font-medium"
                    placeholder="Número da mesa"
                  />
                ) : (
                  <p className={`text-sm font-medium ${isFinalized ? 'text-gray-600' : 'text-gray-800'}`}>
                    Mesa {order.tableNumber}
                  </p>
                )}
              </div>
            </div>
          )}


          {/* Endereço de Entrega */}
          {((order.address && (order.address.cep || order.address.street || order.address.number || order.address.reference)) || (order.phone && order.phone.trim() !== '')) && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <p className={`text-sm font-medium ${isFinalized ? 'text-blue-500' : 'text-blue-600'}`}>
                  Informações de Contato e Entrega:
                </p>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    className="text-xs"
                    placeholder="Telefone"
                  />
                  <Input
                    value={editData.cep}
                    onChange={(e) => handleEditChange('cep', e.target.value)}
                    className={`text-xs ${isLoadingCep ? 'bg-blue-50' : ''}`}
                    placeholder="CEP"
                    maxLength={9}
                  />
                  <Input
                    value={editData.street}
                    onChange={(e) => handleEditChange('street', e.target.value)}
                    className={`text-xs ${isLoadingCep ? 'bg-blue-50' : ''}`}
                    placeholder="Rua/Avenida"
                    disabled={isLoadingCep}
                  />
                  {isLoadingCep && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <div className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Buscando...
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      value={editData.number}
                      onChange={(e) => handleEditChange('number', e.target.value)}
                      className="text-xs"
                      placeholder="Número"
                    />
                  </div>
                  <Input
                    value={editData.reference}
                    onChange={(e) => handleEditChange('reference', e.target.value)}
                    className="text-xs"
                    placeholder="Referência"
                  />
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {order.phone && order.phone.trim() !== '' && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-purple-500" />
                      <span className={isFinalized ? 'text-blue-500' : 'text-blue-700'}>
                        {formatPhone(order.phone)}
                      </span>
                    </div>
                  )}
                  {order.address?.cep && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-purple-500" />
                      <span className={isFinalized ? 'text-blue-500' : 'text-blue-700'}>
                        CEP: {order.address?.cep}
                      </span>
                    </div>
                  )}
                  {order.address?.street && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-blue-500" />
                      <span className={isFinalized ? 'text-blue-500' : 'text-blue-700'}>
                        {order.address?.street}
                      </span>
                    </div>
                  )}
                  {order.address?.number && (
                    <div className="flex items-center gap-2">
                      <Home className="h-3 w-3 text-green-500" />
                      <span className={isFinalized ? 'text-blue-500' : 'text-blue-700'}>
                        Nº {order.address?.number}
                      </span>
                    </div>
                  )}
                  {order.address?.reference && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-orange-500" />
                      <span className={isFinalized ? 'text-blue-500' : 'text-blue-700'}>
                        Ref: {order.address?.reference}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {isFinalized && order.completedAt && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Finalizado:</p>
                <p className="text-sm font-medium text-blue-600">{formatDateTime(order.completedAt)}</p>
              </div>
            </div>
          )}

          {isFinalized && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Status:</p>
                <p className="text-sm font-medium text-green-600">Pedido Finalizado</p>
              </div>
            </div>
          )}
        </div>

        {/* Botão Emitir Nota - apenas para pedidos na coluna "pedidos" */}
        {!isEditing && currentColumn === 'pedidos' && !isFinalized && (
          <Button
            onClick={handleGenerateInvoice}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 transform hover:scale-105 shadow-md mb-2"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Imprimir Nota
          </Button>
        )}
        {!isEditing && currentColumn !== 'pedidos' && !isFinalized && order.phone && order.phone.trim() !== '' && (
          <Button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200 transform hover:scale-105 shadow-md"
            size="sm"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar mensagem
          </Button>
        )}
      </CardContent>
      
      {/* Modal de Impressão */}
      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        order={order}
      />
    </Card>
  );
};