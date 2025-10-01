export interface Order {
  id: string;
  orderNumber: number;
  name: string;
  description: string;
  total: number;
  receivedAmount?: number;
  change?: number;
  paymentMethod?: 'pix' | 'dinheiro' | 'debito' | 'credito';
  phone: string;
  tableNumber?: number;
  address?: {
    street: string;
    number: string;
    cep: string;
    reference: string;
  };
  column: string;
  createdAt: Date;
  completedAt?: Date;
  cardColor: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface KanbanState {
  columns: Column[];
  orders: Order[];
  total: number;
}

export interface CashRegister {
  initialAmount: number;
  currentAmount: number;
  date: string;
}