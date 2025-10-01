import jsPDF from 'jspdf';
import { Order } from '@/types';

export const generateInvoicePDF = (order: Order) => {
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
  // Mostrar troco apenas se existir
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
  pdf.text('Mantenha este documento para controle do pedido.', pageWidth / 2, currentY, { align: 'center' });
  
  // Rodapé
  const footerY = pageHeight - 15;
  pdf.text('Balcão Digital - Sistema de Gestão Gastronômica', pageWidth / 2, footerY, { align: 'center' });
  pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Salvar o PDF
  const fileName = `nota-pedido-${order.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};