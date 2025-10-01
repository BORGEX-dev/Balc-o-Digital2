import jsPDF from 'jspdf';
import { Order } from '@/types';
import { getTotalAccumulatedRevenue } from './dailyReset';

export interface ReportData {
  dailyRevenue: number;
  totalAccumulatedRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByStatus: Record<string, number>;
  orders: Order[];
  cashRegister: {
    initialAmount: number;
    currentAmount: number;
  };
  averageProcessingTime: number;
}


export const generatePDFReport = async (data: ReportData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Configurações
  const margin = 20;
  const lineHeight = 7;
  let currentY = margin;

  // Função para adicionar nova página se necessário
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar tempo
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${remainingMinutes}min`;
  };

  // Cabeçalho
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório Diário - Balcão Digital', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;

  // Resumo Geral
  checkPageBreak(60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumo Geral', margin, currentY);
  currentY += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Receita Total Acumulada:', formatCurrency(data.totalAccumulatedRevenue)],
    ['Receita do Dia (Finalizados):', formatCurrency(data.dailyRevenue)],
    ['Pedidos Finalizados do Dia:', data.totalOrders.toString()],
    ['Ticket Médio:', formatCurrency(data.averageOrderValue)],
    ['Caixa Inicial:', formatCurrency(data.cashRegister.initialAmount)],
    ['Caixa Atual:', formatCurrency(data.cashRegister.currentAmount)],
    ['Tempo Médio de Processamento:', data.averageProcessingTime > 0 ? formatTime(data.averageProcessingTime) : '0min']
  ];

  summaryData.forEach(([label, value]) => {
    pdf.text(label, margin, currentY);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, margin + 90, currentY);
    pdf.setFont('helvetica', 'normal');
    currentY += lineHeight;
  });

  currentY += 10;

  // Informação importante sobre contabilização
  checkPageBreak(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sistema de Finalização de Pedidos', margin, currentY);
  currentY += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('• Apenas pedidos finalizados são contabilizados na receita', margin, currentY);
  currentY += 5;
  pdf.text('• Pedidos são finalizados ao serem arrastados para a coluna "Pedidos finalizados"', margin, currentY);
  currentY += 5;
  pdf.text('• Pedidos finalizados desaparecem do quadro mas são mantidos nos relatórios', margin, currentY);
  currentY += 5;
  pdf.text('• Cada pedido recebe um número sequencial para controle', margin, currentY);
  currentY += 5;
  pdf.text('• Mesas podem ser associadas aos pedidos para controle do salão', margin, currentY);
  currentY += 5;
  pdf.text('• O sistema calcula automaticamente o tempo de processamento dos pedidos', margin, currentY);
  currentY += 5;
  pdf.text('• O reset diário às 17h preserva a receita total acumulada', margin, currentY);
  currentY += 15;

  // Análise de Performance
  checkPageBreak(60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Análise de Performance do Dia', margin, currentY);
  currentY += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const finalizedCount = data.orders.length;
  const finalizedRevenue = data.dailyRevenue;
  
  if (finalizedCount > 0) {
    pdf.text(`Total de pedidos finalizados: ${finalizedCount}`, margin, currentY);
    currentY += 7;
    pdf.text(`Receita dos pedidos finalizados: ${formatCurrency(finalizedRevenue)}`, margin, currentY);
    currentY += 7;
    pdf.text(`Valor médio por pedido: ${formatCurrency(data.averageOrderValue)}`, margin, currentY);
    currentY += 15;

    // Gráfico de barras simples
    const barWidth = 120;
    const barHeight = 15;
    
    // Barra de fundo
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, currentY, barWidth, barHeight, 'F');
    
    // Barra de progresso (sempre 100% para pedidos finalizados)
    pdf.setFillColor(34, 197, 94); // Verde
    pdf.rect(margin, currentY, barWidth, barHeight, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text('100% Finalizados', margin + barWidth/2, currentY + barHeight/2 + 2, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    
    currentY += 25;
  } else {
    pdf.text('Nenhum pedido finalizado no período', margin, currentY);


    currentY += 15;
  }

  // Informações do Caixa
  checkPageBreak(30);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Controle de Caixa', margin, currentY);
  currentY += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Valor inicial do caixa: ${formatCurrency(data.cashRegister.initialAmount)}`, margin, currentY);
  currentY += 7;
  pdf.text(`Vendas do dia: ${formatCurrency(data.dailyRevenue)}`, margin, currentY);
  currentY += 7;
  pdf.text(`Total atual em caixa: ${formatCurrency(data.cashRegister.currentAmount)}`, margin, currentY);
  currentY += 15;

  // Lista Detalhada de Pedidos Finalizados
  if (data.orders.length > 0) {
    checkPageBreak(30);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detalhamento dos Pedidos Finalizados do Dia', margin, currentY);
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Cabeçalho da tabela
    pdf.setFont('helvetica', 'bold');
    pdf.text('#', margin, currentY);
    pdf.text('Cliente', margin + 15, currentY);
    pdf.text('Mesa', margin + 50, currentY);
    pdf.text('Descrição', margin + 70, currentY);
    pdf.text('Valor', margin + 110, currentY);
    pdf.text('Tempo', margin + 140, currentY);
    currentY += 7;

    // Linha separadora
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
    currentY += 2;

    pdf.setFont('helvetica', 'normal');
    
    data.orders.forEach((order, index) => {
      checkPageBreak(7);
      
      const name = order.name.length > 12 ? order.name.substring(0, 12) + '...' : order.name;
      const description = order.description.length > 15 ? order.description.substring(0, 15) + '...' : order.description;
      const date = new Date(order.createdAt).toLocaleDateString('pt-BR');
      const time = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const processingTime = order.completedAt 
        ? formatTime(new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime())
        : '-';
      
      // Alternar cor de fundo para melhor legibilidade
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(margin - 2, currentY - 3, pageWidth - 2 * margin + 4, 6, 'F');
      }
      
      pdf.text(`#${order.orderNumber}`, margin, currentY);
      pdf.text(name, margin + 15, currentY);
      pdf.text(order.tableNumber ? `${order.tableNumber}` : '-', margin + 50, currentY);
      pdf.text(description, margin + 70, currentY);
      pdf.text(formatCurrency(order.total), margin + 110, currentY);
      pdf.text(processingTime, margin + 140, currentY);
      currentY += 6;
    });

    // Total final
    currentY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL GERAL:', margin + 110, currentY);
    pdf.text(formatCurrency(finalizedRevenue), margin + 140, currentY);
  }

  // Rodapé com informações do sistema
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('Balcão Digital - Sistema de Gestão de Pedidos', pageWidth / 2, pageHeight - 5, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
  }

  // Salvar o PDF
  const fileName = `relatorio-diario-balcao-digital-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};