// Serviço para busca de CEP usando a API ViaCEP
export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const searchCep = async (cep: string): Promise<CepData | null> => {
  try {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/[^\d]/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) {
      return null;
    }
    
    // Faz a requisição para a API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      return null;
    }
    
    const data: CepData = await response.json();
    
    // Verifica se houve erro na busca
    if (data.erro) {
      return null;
    }
    
    // Combinar logradouro com bairro para criar endereço completo
    if (data.logradouro && data.bairro) {
      data.logradouro = `${data.logradouro}, ${data.bairro}`;
    } else if (data.bairro && !data.logradouro) {
      data.logradouro = data.bairro;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

export const formatCep = (cep: string): string => {
  const cleanCep = cep.replace(/[^\d]/g, '');
  if (cleanCep.length === 8) {
    return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
  }
  return cep;
};