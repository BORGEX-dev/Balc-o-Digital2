import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Trash2, Check, X, Hash } from 'lucide-react';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved';
}

interface TableManagementProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
}

export const TableManagement: React.FC<TableManagementProps> = ({ tables, setTables }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [maxTables, setMaxTables] = useState('');

  const handleAddTables = () => {

    const numberOfTables = parseInt(maxTables);
    
    if (isNaN(numberOfTables) || numberOfTables <= 0 || numberOfTables > 100) {
      alert('Por favor, insira um número válido entre 1 e 100');
      return;
    }

    // Limpar mesas existentes e criar novas
    const newTables: Table[] = [];
    for (let i = 1; i <= numberOfTables; i++) {
      newTables.push({
        id: `table-${Date.now()}-${i}`,
        number: i,
        capacity: 4, // Capacidade padrão
        status: 'free'
      });
    }

    setTables(newTables);
    setMaxTables('');
    setIsAdding(false);
  };

  const handleDeleteAllTables = () => {

    if (confirm('Tem certeza que deseja excluir todas as mesas?')) {
      setTables([]);
    }
  };

  const handleStatusChange = (id: string, status: Table['status']) => {

    // Não permitir mudança manual para ocupada - isso será automático
    if (status === 'occupied') return;
    
    setTables(prev => 
      prev.map(table => 
        table.id === id ? { ...table, status } : table
      )
    );
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 hover:border-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: Table['status']) => {
    switch (status) {
      case 'free':
        return 'Livre';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      default:
        return 'Desconhecido';
    }
  };

  const statusStats = tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{tables.length}</p>
              <p className="text-sm text-blue-800">Total de Mesas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{statusStats.free || 0}</p>
              <p className="text-sm text-green-800">Mesas Livres</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{statusStats.occupied || 0}</p>
              <p className="text-sm text-red-800">Mesas Ocupadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{statusStats.reserved || 0}</p>
              <p className="text-sm text-yellow-800">Mesas Reservadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciar Mesas */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Gerenciar Mesas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!isAdding ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Configurar Mesas
              </Button>
              {tables.length > 0 && (
                <Button
                  onClick={handleDeleteAllTables}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Todas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxTables" className="text-base font-medium">
                  Número Total de Mesas
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="maxTables"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Ex: 20"
                    value={maxTables}
                    onChange={(e) => setMaxTables(e.target.value)}
                    className="border-gray-300 focus:border-orange-500 flex-1 text-black dark:text-black bg-white dark:bg-white"
                  />
                  <Button
                    onClick={handleAddTables}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Criar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAdding(false);
                      setMaxTables('');
                    }}
                    className="bg-white hover:bg-gray-100 text-black border border-gray-300 px-6"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Isso criará mesas numeradas de 1 até o número informado. As mesas existentes serão substituídas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layout das Mesas */}
      {tables.length > 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Layout do Salão
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                    ${getStatusColor(table.status)}
                    ${table.status === 'occupied' ? '' : 'cursor-pointer'}
                    animate-fade-in-up
                  `}
                  style={{ 
                    animationDelay: `${(table.number - 1) * 50}ms`,
                    minHeight: '80px'
                  }}
                  onClick={() => {
                    if (table.status !== 'occupied') {
                      const newStatus = table.status === 'free' ? 'reserved' : 'free';
                      handleStatusChange(table.id, newStatus);
                    }
                  }}
                >
                  {/* Número da Mesa */}
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">
                      {table.number}
                    </div>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-1 ${
                        table.status === 'free' ? 'bg-green-50 border-green-300 text-green-700' :
                        table.status === 'occupied' ? 'bg-red-50 border-red-300 text-red-700' :
                        'bg-yellow-50 border-yellow-300 text-yellow-700'
                      }`}
                    >
                      {getStatusLabel(table.status)}
                    </Badge>
                  </div>

                  {/* Indicador de Ocupação */}
                  {table.status === 'occupied' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                  
                  {/* Indicador de Reserva */}
                  {table.status === 'reserved' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                <span className="text-sm text-gray-600">Livre (clique para reservar)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                <span className="text-sm text-gray-600">Reservada (clique para liberar)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                <span className="text-sm text-gray-600">Ocupada (automático)</span>
              </div>
            </div>

            {/* Informações sobre Automação */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Sistema Automatizado</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Quando uma mesa é selecionada em um pedido, ela fica automaticamente ocupada (vermelha)</li>
                    <li>• Mesas ocupadas não podem ser selecionadas para novos pedidos</li>
                    <li>• Quando o pedido é finalizado, a mesa volta automaticamente para livre (verde)</li>
                    <li>• Você pode reservar mesas manualmente clicando nelas (amarelo)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tables.length === 0 && (
        <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
          <CardContent className="p-12 text-center">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma mesa configurada</h3>
            <p className="text-gray-500 mb-4">Configure o número de mesas do seu estabelecimento</p>
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configurar Mesas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};