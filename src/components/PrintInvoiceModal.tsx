import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, FileText, Download } from 'lucide-react';
import { Order } from '@/types';
import jsPDF from 'jspdf';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ isOpen, onClose, order }) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateInvoicePDF = (order: Order): jsPDF => {
    // Criar PDF com dimensões 20x29 cm (200x290 mm)
    const pdf = new jsPDF('p', 'mm', [200, 290]);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Configurações
    const margin = 15;
    let currentY = margin;
    
    // Função para formatar moeda
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    // Função para formatar telefone
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

    // Cabeçalho da empresa
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BALCÃO DIGITAL', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sistema de Gestão Gastronômica', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Título da nota
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTA DE PEDIDO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

    // Informações do pedido
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Número do pedido e data
    pdf.setFont('helvetica', 'bold');
    pdf.text('Número do Pedido:', margin, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`#${order.orderNumber}`, margin + 45, currentY);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Data:', pageWidth - margin - 50, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(order.createdAt).toLocaleDateString('pt-BR'), pageWidth - margin - 25, currentY);
    currentY += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Horário:', pageWidth - margin - 50, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), pageWidth - margin - 25, currentY);
    currentY += 15;

    // Linha separadora
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    // Dados do cliente
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO CLIENTE', margin, currentY);
    currentY += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nome:', margin, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(order.name, margin + 22, currentY);
    currentY += 7;

    if (order.phone && order.phone.trim() !== '') {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Telefone:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatPhone(order.phone), margin + 27, currentY);
      currentY += 7;
    }

    if (order.paymentMethod) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pagamento:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(getPaymentMethodLabel(order.paymentMethod), margin + 30, currentY);
      currentY += 7;
    }

    if (order.tableNumber) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mesa:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Mesa ${order.tableNumber}`, margin + 22, currentY);
      currentY += 7;
    }

    // Endereço de entrega (se houver)
    if (order.address && (order.address.cep || order.address.street || order.address.number || order.address.reference)) {
      currentY += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text('ENDEREÇO DE ENTREGA', margin, currentY);
      currentY += 8;

      if (order.address.cep) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('CEP:', margin, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(order.address.cep, margin + 18, currentY);
        currentY += 7;
      }

      if (order.address.street) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Rua/Avenida:', margin, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(order.address.street, margin + 32, currentY);
        currentY += 7;
      }

      if (order.address.number) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Número:', margin, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(order.address.number, margin + 22, currentY);
        currentY += 7;
      }

      if (order.address.reference) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Referência:', margin, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(order.address.reference, margin + 27, currentY);
        currentY += 7;
      }
    }

    currentY += 8;

    // Linha separadora
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    // Detalhes do pedido
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETALHES DO PEDIDO', margin, currentY);
    currentY += 12;

    // Cabeçalho da tabela
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Descrição', margin, currentY);
    pdf.text('Valor', pageWidth - margin - 35, currentY);
    currentY += 7;

    // Linha separadora da tabela
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Conteúdo do pedido
    pdf.setFont('helvetica', 'normal');
    const descriptionLines = pdf.splitTextToSize(order.description, pageWidth - margin - 70);
    
    descriptionLines.forEach((line: string, index: number) => {
      pdf.text(line, margin, currentY);
      if (index === 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatCurrency(order.total), pageWidth - margin - 35, currentY);
        pdf.setFont('helvetica', 'normal');
      }
      currentY += 5;
    });

    currentY += 8;

    // Linha separadora
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Seção de valores
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VALORES', margin, currentY);
    currentY += 10;

    // Valor Total
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VALOR TOTAL:', margin, currentY);
    pdf.text(formatCurrency(order.total), pageWidth - margin - 35, currentY);
    currentY += 10;

    // Valor recebido e troco (se houver)
    if (order.receivedAmount !== undefined && order.receivedAmount > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VALOR RECEBIDO:', margin, currentY);
      pdf.text(formatCurrency(order.receivedAmount), pageWidth - margin - 35, currentY);
      currentY += 8;
    }

    if (order.change !== undefined && order.change !== 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TROCO:', margin, currentY);
      
      // Definir cor baseada no valor do troco
      if (order.change < 0) {
        pdf.setTextColor(255, 0, 0); // Vermelho para troco negativo
      } else {
        pdf.setTextColor(0, 128, 0); // Verde para troco positivo
      }
      
      pdf.text(formatCurrency(order.change), pageWidth - margin - 35, currentY);
      pdf.setTextColor(0, 0, 0); // Resetar cor para preto
      currentY += 8;
    }

    currentY += 7;

    // Informações adicionais
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    currentY += 15;
    pdf.text('Esta é uma nota de pedido gerada automaticamente pelo sistema.', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    return pdf;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = generateInvoicePDF(order);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfDataUrl(pdfUrl);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    const pdf = generateInvoicePDF(order);
    pdf.save(`nota-pedido-${order.orderNumber}.pdf`);
  };

  useEffect(() => {
    if (isOpen) {
      generatePDF();
    }
    return () => {
      if (pdfDataUrl) {
        URL.revokeObjectURL(pdfDataUrl);
      }
    };
  }, [isOpen, order]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Visualizar e Imprimir Nota - Pedido #{order.orderNumber}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isGenerating || !pdfDataUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {isGenerating ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Gerando PDF...</p>
              </div>
            </div>
          ) : pdfDataUrl ? (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src={pdfDataUrl}
                className="w-full h-96"
                title="Visualização da Nota"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Erro ao carregar o PDF</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};