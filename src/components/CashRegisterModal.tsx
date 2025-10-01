import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Wallet } from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (initialAmount: number) => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose, onSave }) => {
  const [initialAmount, setInitialAmount] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const amount = parseFloat(initialAmount);
    
    if (isNaN(amount) || amount < 0) {
      setError('Por favor, insira um valor válido');
      return;
    }

    onSave(amount);
    setInitialAmount('');
    setError('');
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
    return formattedValue;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setInitialAmount(formatted);
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} className="z-50">
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            Abertura de Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Para iniciar o dia, informe o valor inicial do caixa
            </p>
            <p className="text-sm text-gray-500">
              Este valor será usado para controle financeiro diário
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount" className="flex items-center gap-2 text-base font-medium">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valor Inicial do Caixa (R$)
              </Label>
              <Input
                id="initialAmount"
                type="text"
                placeholder="0,00"
                value={initialAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg text-center font-semibold border-gray-300 focus:border-green-500"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Valor Informado:</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(parseFloat(initialAmount) || 0)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3"
              disabled={!initialAmount || parseFloat(initialAmount) < 0}
            >
              <Wallet className="h-5 w-5 mr-2" />
              Confirmar Abertura
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              O caixa será resetado automaticamente às 17h todos os dias
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};