import { getTodayString, getYesterdayString } from './formatters';

export const parseSmartInput = (text, accounts = [], cards = []) => {
  if (!text || text.trim() === '') return null;

  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  // 1. Extrair Valor (Amount)
  let amount = 0;
  const valueRegex = /(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/gi;
  const matches = [...normalized.matchAll(valueRegex)];
  
  let foundValue = false;
  for (const match of matches) {
    const valStr = match[1].replace(',', '.');
    const val = parseFloat(valStr);
    
    if (!isNaN(val) && val > 0) {
      const index = match.index;
      const precedingText = normalized.substring(Math.max(0, index - 10), index);
      const proceedingText = normalized.substring(index + match[0].length, index + match[0].length + 15);
      
      // Evitar pegar o dia do mês isolado (ex: "dia 15") ou parcelas (ex: "3x")
      if (precedingText.includes('dia ') && !proceedingText.includes('real') && !proceedingText.includes('reais') && val <= 31) {
        continue;
      }
      
      // Checar se o número é parte de um indicador de parcelamento (ex: "3 x", "3 vezes")
      const isInstallmentIndicator = proceedingText.match(/^\s*(?:x|vezes|parcelas)/i);
      if (isInstallmentIndicator && val <= 48) {
        continue; // Provavelmente é quantidade de parcelas, não o valor
      }
      
      amount = val;
      foundValue = true;
      break;
    }
  }

  // 2. Determinar Tipo (Receita vs Despesa vs Transferência)
  let type = 'expense';
  const incomeKeywords = ['recebi', 'salario', 'receita', 'ganhei', 'pix recebido', 'rendimento', 'deposito', 'entrada', 'reembolso'];
  const transferKeywords = ['transferir', 'transferencia', 'enviar para', 'passar para', 'pix para'];

  if (transferKeywords.some(keyword => normalized.includes(keyword))) {
    type = 'transfer';
  } else if (incomeKeywords.some(keyword => normalized.includes(keyword))) {
    type = 'income';
  }

  // 3. Determinar Data (Date)
  let date = getTodayString();
  if (normalized.includes('ontem')) {
    date = getYesterdayString();
  } else if (normalized.includes('amanha')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
  } else {
    // Dia do mês (ex: "dia 15", "dia 8")
    const dayMatch = normalized.match(/dia\s+(\d{1,2})/i);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      if (day >= 1 && day <= 31) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        date = `${year}-${month}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // 4. Determinar Categoria (Category)
  let category = type === 'income' ? 'Rendimentos' : (type === 'transfer' ? 'Outros' : 'Outros');
  
  const categoryMappings = {
    'Alimentação': ['padaria', 'mercado', 'almoco', 'jantar', 'lanche', 'restaurante', 'comida', 'pizza', 'ifood', 'supermercado', 'cafe', 'pao', 'doces', 'acai', 'churrascaria'],
    'Transporte': ['gasolina', 'combustivel', 'uber', 'taxi', 'onibus', 'pedagio', 'metro', 'posto', 'estacionamento', 'passagem'],
    'Moradia': ['aluguel', 'luz', 'agua', 'energia', 'internet', 'gas', 'condominio', 'reforma', 'moveis'],
    'Lazer': ['cinema', 'cerveja', 'show', 'bar', 'viagem', 'festa', 'churrasco', 'jogo', 'praia', 'hotel', 'balada', 'boteco'],
    'Educação': ['curso', 'escola', 'faculdade', 'livro', 'mensalidade', 'copia', 'material escolar'],
    'Saúde': ['farmacia', 'remedio', 'medico', 'consulta', 'dentista', 'hospital', 'exame', 'psicologo'],
    'Assinaturas': ['netflix', 'spotify', 'prime', 'disney', 'youtube', 'hbo', 'crunchyroll', 'cloud', 'mensalidade app'],
    'Vestuário': ['roupa', 'sapato', 'tenis', 'camisa', 'calca', 'loja', 'shopping', 'vestido', 'acessorios'],
    'Beleza': ['salao', 'cabelo', 'barba', 'barbearia', 'cosmetico', 'perfume', 'manicure'],
  };

  if (type === 'expense') {
    for (const [catName, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        category = catName;
        break;
      }
    }
  }

  // 5. Determinar Contas, Cartões ou Transferência (Origem / Destino)
  let selectedAccount = null;
  let selectedCard = null;
  let selectedDestinationAccount = null;

  const isCredit = normalized.includes('cartao') || normalized.includes('credito') || normalized.includes('fatura');

  // Função auxiliar para achar conta/cartão a partir de um fragmento de texto
  const findAccountOrCard = (searchTerm) => {
    // 1. Procurar em cartões
    for (const card of cards) {
      const cardNorm = card.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (searchTerm.includes(cardNorm)) return { id: card.id, isCard: true };
    }
    // 2. Procurar em contas
    for (const acc of accounts) {
      const accNorm = acc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (searchTerm.includes(accNorm)) return { id: acc.id, isCard: false };
    }

    // Atalhos comuns de bancos
    if (searchTerm.includes('nubank') || searchTerm.includes('nu')) {
      const card = cards.find(c => c.name.toLowerCase().includes('nubank'));
      const acc = accounts.find(a => a.name.toLowerCase().includes('nubank'));
      return isCredit && card ? { id: card.id, isCard: true } : (acc ? { id: acc.id, isCard: false } : null);
    }
    if (searchTerm.includes('itau')) {
      const card = cards.find(c => c.name.toLowerCase().includes('itau'));
      const acc = accounts.find(a => a.name.toLowerCase().includes('itau'));
      return isCredit && card ? { id: card.id, isCard: true } : (acc ? { id: acc.id, isCard: false } : null);
    }
    if (searchTerm.includes('inter')) {
      const card = cards.find(c => c.name.toLowerCase().includes('inter'));
      const acc = accounts.find(a => a.name.toLowerCase().includes('inter'));
      return isCredit && card ? { id: card.id, isCard: true } : (acc ? { id: acc.id, isCard: false } : null);
    }
    if (searchTerm.includes('carteira') || searchTerm.includes('dinheiro') || searchTerm.includes('carteira') || searchTerm.includes('dinheiro')) {
      const acc = accounts.find(a => a.name.toLowerCase().includes('carteira') || a.name.toLowerCase().includes('dinheiro'));
      if (acc) return { id: acc.id, isCard: false };
    }
    return null;
  };

  if (type === 'transfer') {
    // Tenta extrair padrões do tipo: "transferir do nubank para o itau" ou "de carteira para nubank"
    const fromMatch = normalized.match(/(?:de|do|da)\s+(\w+)/i);
    const toMatch = normalized.match(/(?:para|para o|para a)\s+(\w+)/i);

    if (fromMatch) {
      const res = findAccountOrCard(fromMatch[1]);
      if (res && !res.isCard) selectedAccount = res.id;
    }
    if (toMatch) {
      const res = findAccountOrCard(toMatch[1]);
      if (res && !res.isCard) selectedDestinationAccount = res.id;
    }

    // Fallbacks para transferência se não achou pelo regex estruturado, mas os nomes estão soltos
    if (!selectedAccount || !selectedDestinationAccount) {
      const foundAccounts = [];
      for (const acc of accounts) {
        const accNorm = acc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(accNorm)) {
          foundAccounts.push(acc.id);
        }
      }
      if (foundAccounts.length >= 2) {
        // Assume que a primeira citada é origem, a segunda é destino
        const firstIndex = normalized.indexOf(accounts.find(a => a.id === foundAccounts[0]).name.toLowerCase());
        const secondIndex = normalized.indexOf(accounts.find(a => a.id === foundAccounts[1]).name.toLowerCase());
        if (firstIndex < secondIndex) {
          selectedAccount = foundAccounts[0];
          selectedDestinationAccount = foundAccounts[1];
        } else {
          selectedAccount = foundAccounts[1];
          selectedDestinationAccount = foundAccounts[0];
        }
      }
    }
  } else {
    // Despesa ou Receita comum: Achar apenas uma conta ou cartão
    const matched = findAccountOrCard(normalized);
    if (matched) {
      if (matched.isCard) selectedCard = matched.id;
      else selectedAccount = matched.id;
    }

    // Fallbacks
    if (!selectedAccount && !selectedCard) {
      if (isCredit && cards.length > 0) {
        selectedCard = cards[0].id;
      } else if (accounts.length > 0) {
        const preferred = accounts.find(a => a.name.toLowerCase().includes('carteira') || a.name.toLowerCase().includes('corrente'));
        selectedAccount = preferred ? preferred.id : accounts[0].id;
      }
    }
  }

  // 6. Extrair Quantidade de Parcelas (Installments)
  let isInstallment = false;
  let installmentCount = 1;
  // Procura por "em 3x", "em 3 vezes", "parcelado em 5 parcelas", "dividido em 12 vezes", etc.
  const installmentRegex = /(?:parcelado|dividido)?\s*(?:em)?\s*(\d+)\s*(?:x|vezes|parcelas)/gi;
  const installmentMatch = installmentRegex.exec(normalized);
  if (installmentMatch) {
    const count = parseInt(installmentMatch[1]);
    if (count > 1 && count <= 60) {
      isInstallment = true;
      installmentCount = count;
    }
  }

  // 7. Determinar Status (Pago vs Não Pago / Pendente)
  let status = 'confirmed'; // Pago por padrão
  const pendingKeywords = ['nao pago', 'pendente', 'a pagar', 'para pagar', 'nao recebi', 'receber futura', 'planejada', 'agendada'];
  if (pendingKeywords.some(keyword => normalized.includes(keyword))) {
    status = 'pending';
  } else {
    // Se a data for no futuro (comparada com hoje), marcar automaticamente como pendente
    const todayStr = getTodayString();
    if (date > todayStr) {
      status = 'pending';
    }
  }

  // 8. Criar a Descrição (Description) limpa
  let description = text;
  
  // Limpar valores monetários
  description = description.replace(/(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/gi, '');
  
  // Limpar indicadores de parcelas
  description = description.replace(/\b\d+\s*(?:x|vezes|parcelas)\b/gi, '');
  description = description.replace(/\b(parcelado|dividido)\s*em\b/gi, '');
  
  // Limpar palavras de tempo e status
  description = description.replace(/\b(hoje|ontem|amanha|dia\s+\d{1,2}|nao pago|pendente|para pagar|a pagar|recebido|pago|confirmado)\b/gi, '');
  
  // Limpar nomes de bancos e palavras de transação
  description = description.replace(/\b(no|na|em|de|para|do|da|reais|real|paguei|gastei|recebi|salario|ganhei|compras?|cartao|credito|dinheiro|carteira|nubank|itau|inter|banco|pagamento|pix|transferir|transferencia|enviar)\b/gi, '');

  // Limpar espaços extras
  description = description.replace(/\s+/g, ' ').trim();
  
  // Fallback se a descrição ficou vazia
  if (description.length < 3) {
    const words = text.split(' ').filter(w => {
      const wNorm = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return w.length > 2 && 
             !wNorm.match(/^\d/) && 
             !['reais', 'real', 'cartao', 'credito', 'dinheiro', 'hoje', 'ontem', 'amanha', 'nubank', 'itau', 'inter', 'paguei', 'gastei', 'recebi', 'transferir', 'transferencia'].includes(wNorm);
    });
    description = words.length > 0 ? words.join(' ') : (type === 'income' ? 'Receita Extra' : (type === 'transfer' ? 'Transferência' : category));
  }

  // Capitalizar primeira letra
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    description,
    amount,
    date,
    category,
    accountId: selectedAccount,
    cardId: selectedCard,
    destinationAccountId: selectedDestinationAccount,
    type,
    status,
    isInstallment,
    installmentCount
  };
};
