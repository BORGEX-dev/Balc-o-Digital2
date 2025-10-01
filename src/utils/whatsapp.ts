export const sendWhatsAppMessage = (phone: string, message: string) => {
  // Remove all non-digit characters from phone
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Ensure phone starts with 55 (Brazil country code)
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappUrl, '_blank');
};

export const getStatusMessage = (status: string): string => {
  switch (status) {
    case 'preparando':
      return 'Seu pedido está em preparo, em momentos estará pronto 😊';
    case 'pronto':
      return 'Seu pedido foi embalado 📦';
    default:
      return 'Obrigado pelo seu pedido!';
  }
};