import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, User, Package, DollarSign, Phone, Hash, MapPin, Home, CreditCard } from 'lucide-react';
import { searchCep, formatCep } from '@/utils/cepService';

interface AddOrderFormProps {
  onAddOrder: (order: {
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
  }) => void;
  tables: any[];
}

export const AddOrderForm: React.FC<AddOrderFormProps> = ({ onAddOrder, tables }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total: '',
    paymentMethod: '',
    receivedAmount: '',
    change: '',
    phone: '',
    tableNumber: '',
    cep: '',
    street: '',
    number: '',
    reference: ''
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    

    if (!formData.name || !formData.description || !formData.total) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    const total = parseFloat(formData.total);
    if (isNaN(total) || total <= 0) {
      alert('Por favor, insira um valor válido para o total');
      return;
    }

    const address = (formData.street || formData.number || formData.cep || formData.reference) ? {
      street: formData.street,
      number: formData.number,
      cep: formData.cep,
      reference: formData.reference
    } : undefined;
    
    const receivedAmount = parseFloat(formData.receivedAmount) || undefined;
    const change = parseFloat(formData.change) || undefined;
    const paymentMethod = formData.paymentMethod as 'pix' | 'dinheiro' | 'debito' | 'credito' | undefined;
    
    onAddOrder({
      name: formData.name,
      description: formData.description,
      total,
      paymentMethod,
      receivedAmount,
      change,
      phone: formData.phone,
      tableNumber: formData.tableNumber ? parseInt(formData.tableNumber) : undefined,
      address
    });

    setFormData({
      name: '',
      description: '',
      total: '',
      paymentMethod: '',
      receivedAmount: '',
      change: '',
      phone: '',
      tableNumber: '',
      cep: '',
      street: '',
      number: '',
      reference: ''
    });
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

  const handleChange = async (field: string, value: string) => {
    // Define updatedFormData in outer scope
    const updatedFormData = {
      ...formData,
      [field]: value
    };

    // Calculate change if relevant fields were altered
    if (field === 'total' || field === 'receivedAmount') {
      const total = field === 'total' ? value : formData.total;
      const received = field === 'receivedAmount' ? value : formData.receivedAmount;
      updatedFormData.change = calculateChange(total, received);
    }

    // Update state with the calculated form data
    setFormData(updatedFormData);

    // Handle CEP search logic
    if (field === 'cep') {
      const cleanCep = value.replace(/[^\d]/g, '');
      
      if (cleanCep.length === 8) {
        setIsLoadingCep(true);
        
        try {
          const cepData = await searchCep(cleanCep);
          
          if (cepData) {
            setFormData(prev => ({
              ...prev,
              cep: formatCep(cleanCep),
              street: cepData.logradouro || prev.street // Agora inclui rua + bairro
            }));
          } else {
            // CEP not found, just format
            setFormData(prev => ({
              ...prev,
              cep: formatCep(cleanCep)
            }));
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
          // On error, just format the CEP
          setFormData(prev => ({
            ...prev,
            cep: formatCep(cleanCep)
          }));
        } finally {
          setIsLoadingCep(false);
        }
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg border-0 dark:border dark:border-gray-700">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Novo Pedido
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-red-600">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-red-600 dark:text-red-400">Nome do Cliente *</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite o nome do cliente"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4 text-purple-600" />
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+55 (11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Seção de Endereço */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Endereço de Entrega (Opcional)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Hash className="h-4 w-4 text-purple-600" />
                  CEP
                </Label>
                <Input
                  id="cep"
                  type="text"
                  placeholder="Digite o CEP para buscar automaticamente"
                  value={formData.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  className={`border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 ${isLoadingCep ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  maxLength={9}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  O endereço será preenchido automaticamente
                </p>
                {isLoadingCep && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Buscando endereço...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="street" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Rua/Avenida
                </Label>
                <Input
                  id="street"
                  type="text"
                  placeholder="Nome da rua ou avenida"
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className={`border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 ${isLoadingCep ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  disabled={isLoadingCep}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number" className="flex items-center gap-2 text-sm font-medium">
                  <Home className="h-4 w-4 text-green-600" />
                  Número/Apartamento
                </Label>
                <Input
                  id="number"
                  type="text"
                  placeholder="Número da casa ou apartamento"
                  value={formData.number}
                  onChange={(e) => handleChange('number', e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="reference" className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  Referência
                </Label>
                <Input
                  id="reference"
                  type="text"
                  placeholder="Ponto de referência"
                  value={formData.reference}
                  onChange={(e) => handleChange('reference', e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tableNumber" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              <Hash className="h-4 w-4 text-indigo-600" />
              Mesa (Opcional)
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {tables.map((table) => {
                const isSelected = formData.tableNumber === table.number.toString();
                const getTableColor = () => {
                  if (isSelected) return 'bg-blue-500 text-white border-blue-600 shadow-lg transform scale-105';
                  if (table.status === 'free') return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400 hover:shadow-md hover:scale-105';
                  if (table.status === 'occupied') return 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-60';
                  return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 hover:border-yellow-400 hover:shadow-md hover:scale-105';
                };
                
                return (
                  <Button
                    key={table.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={table.status === 'occupied'}
                    className={`h-14 text-xs font-medium transition-all duration-300 border-2 rounded-xl ${getTableColor()}`}
                    onClick={() => {
                      if (table.status !== 'occupied') {
                        handleChange('tableNumber', isSelected ? '' : table.number.toString());
                      }
                    }}
                  >
                    <div className="text-center">
                      <div className="font-bold text-sm mb-1">Mesa {table.number}</div>
                      <div className="text-xs opacity-80">
                        {table.status === 'free' ? 'Livre' : 
                         table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                      </div>
                      {table.status === 'occupied' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse"></div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
                      )}
                    </div>
                  </Button>
                );
              })}
              {tables.length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                  Nenhuma mesa cadastrada
                </div>
              )}
            </div>
            {formData.tableNumber && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                Mesa {formData.tableNumber} selecionada
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <Package className="h-4 w-4 text-orange-600" />
              Descrição do Pedido *
            </Label>
            <Textarea
              id="description"
              placeholder="Digite a descrição do pedido"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-200 min-h-[100px]"
              required
            />
          </div>

          {/* Seção de Valores */}
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Valores do Pedido</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total" className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Valor Total *
                </Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.total}
                  onChange={(e) => handleChange('total', e.target.value)}
                  className="border-gray-300 focus:border-green-500 text-lg font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  Forma de Pagamento
                </Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleChange('paymentMethod', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-indigo-500">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receivedAmount" className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Valor Recebido
                </Label>
                <Input
                  id="receivedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.receivedAmount}
                  onChange={(e) => handleChange('receivedAmount', e.target.value)}
                  className="border-gray-300 focus:border-blue-500 text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="change" className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  Troco
                </Label>
                <Input
                  id="change"
                  type="text"
                  value={formData.change ? `R$ ${formData.change}` : ''}
                  className="border-gray-300 bg-purple-50 text-lg font-bold text-purple-700"
                  readOnly
                  placeholder="Calculado automaticamente"
                />
              </div>
            </div>

            {/* Resumo visual */}
            {formData.total && (formData.receivedAmount || formData.paymentMethod) && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Valor do pedido:</span>
                  <span className="font-semibold text-green-600">R$ {parseFloat(formData.total || '0').toFixed(2)}</span>
                </div>
                {formData.paymentMethod && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Forma de pagamento:</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.paymentMethod === 'pix' ? 'PIX' :
                       formData.paymentMethod === 'dinheiro' ? 'Dinheiro' :
                       formData.paymentMethod === 'debito' ? 'Cartão de Débito' :
                       formData.paymentMethod === 'credito' ? 'Cartão de Crédito' : ''}
                    </span>
                  </div>
                )}
                {formData.receivedAmount && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Valor recebido:</span>
                    <span className="font-semibold text-blue-600">R$ {parseFloat(formData.receivedAmount || '0').toFixed(2)}</span>
                  </div>
                )}
                <hr className="my-2" />
                {formData.receivedAmount && (
                  <>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-purple-700">Troco:</span>
                      <span className={`${parseFloat(formData.change || '0') >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                        R$ {formData.change || '0.00'}
                      </span>
                    </div>
                    {parseFloat(formData.change || '0') < 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Valor recebido é menor que o total do pedido
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300">
            Adicionar Pedido
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};