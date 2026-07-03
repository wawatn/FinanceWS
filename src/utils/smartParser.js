import { getTodayString, getYesterdayString } from './formatters';

export const parseSmartInput = (text, accounts = [], cards = []) => {
  if (!text || text.trim() === '') return null;

  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  // 1. Extrair Valor (Amount)
  // Procura padrões como "R$ 150,50", "150.50", "150 reais", "150,00"
  let amount = 0;
  const valueRegex = /(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/gi;
  const matches = [...normalized.matchAll(valueRegex)];
  
  // Vamos filtrar números que parecem ser datas ou apenas ID de conta, e pegar o valor mais provável
  let foundValue = false;
  for (const match of matches) {
    const valStr = match[1].replace(',', '.');
    const val = parseFloat(valStr);
    
    // Evitar pegar o dia de ontem/hoje ou números pequenos que aparecem isolados como data
    if (!isNaN(val) && val > 0) {
      // Se a palavra anterior for "dia", talvez seja data, mas se tiver "reais" ou "real" depois, é valor
      const index = match.index;
      const precedingText = normalized.substring(Math.max(0, index - 10), index);
      const proceedingText = normalized.substring(index + match[0].length, index + match[0].length + 15);
      
      if (precedingText.includes('dia ') && !proceedingText.includes('real') && !proceedingText.includes('reais') && val <= 31) {
        continue; // Provavelmente é um dia do mês (ex: "dia 15")
      }
      
      amount = val;
      foundValue = true;
      break;
    }
  }

  // 2. Determinar Tipo (Receita vs Despesa)
  let type = 'expense';
  const incomeKeywords = ['recebi', 'salario', 'receita', 'ganhei', 'pix recebido', 'rendimento', 'deposito', 'entrada', 'reembolso'];
  if (incomeKeywords.some(keyword => normalized.includes(keyword))) {
    type = 'income';
  }

  // 3. Determinar Data (Date)
  let date = getTodayString();
  if (normalized.includes('ontem')) {
    date = getYesterdayString();
  } else {
    // Verificar dia específico (ex: "dia 15", "dia 8")
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
  let category = type === 'income' ? 'Rendimentos' : 'Outros';
  
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

  // 5. Determinar Conta ou Cartão (Account / Card)
  let selectedAccount = null;
  let selectedCard = null;

  // Primeiro checar cartões de crédito se houver palavra "cartao" ou "credito"
  const isCredit = normalized.includes('cartao') || normalized.includes('credito') || normalized.includes('fatura');

  // Procurar por nomes de cartões
  for (const card of cards) {
    const cardNorm = card.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(cardNorm)) {
      selectedCard = card.id;
      break;
    }
  }

  // Procurar por nomes de contas
  for (const acc of accounts) {
    const accNorm = acc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(accNorm)) {
      selectedAccount = acc.id;
      break;
    }
  }

  // Atalhos de bancos populares se não achar exatamente pelo nome
  if (!selectedAccount && !selectedCard) {
    if (normalized.includes('nubank') || normalized.includes('nu')) {
      const nuCard = cards.find(c => c.name.toLowerCase().includes('nubank'));
      const nuAcc = accounts.find(a => a.name.toLowerCase().includes('nubank'));
      if (isCredit && nuCard) selectedCard = nuCard.id;
      else if (nuAcc) selectedAccount = nuAcc.id;
    } else if (normalized.includes('itau')) {
      const itauCard = cards.find(c => c.name.toLowerCase().includes('itau'));
      const itauAcc = accounts.find(a => a.name.toLowerCase().includes('itau'));
      if (isCredit && itauCard) selectedCard = itauCard.id;
      else if (itauAcc) selectedAccount = itauAcc.id;
    } else if (normalized.includes('inter')) {
      const interCard = cards.find(c => c.name.toLowerCase().includes('inter'));
      const interAcc = accounts.find(a => a.name.toLowerCase().includes('inter'));
      if (isCredit && interCard) selectedCard = interCard.id;
      else if (interAcc) selectedAccount = interAcc.id;
    } else if (normalized.includes('carteira') || normalized.includes('dinheiro') || normalized.includes('especie') || normalized.includes('maos')) {
      const walletAcc = accounts.find(a => a.name.toLowerCase().includes('carteira') || a.name.toLowerCase().includes('dinheiro'));
      if (walletAcc) selectedAccount = walletAcc.id;
    }
  }

  // Fallbacks razoáveis
  if (!selectedAccount && !selectedCard) {
    if (isCredit && cards.length > 0) {
      selectedCard = cards[0].id;
    } else if (accounts.length > 0) {
      // Preferir conta corrente ou carteira
      const preferred = accounts.find(a => a.name.toLowerCase().includes('carteira') || a.name.toLowerCase().includes('corrente'));
      selectedAccount = preferred ? preferred.id : accounts[0].id;
    }
  }

  // 6. Criar a Descrição (Description)
  // Remover valor, palavras-chave de data, conta e categoria para sobrar a descrição limpa
  let description = text;
  
  // Limpar valores monetários
  description = description.replace(/(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/gi, '');
  
  // Limpar palavras de tempo
  description = description.replace(/\b(hoje|ontem|amanha|dia\s+\d{1,2})\b/gi, '');
  
  // Limpar palavras de transação/banco/cartão
  description = description.replace(/\b(no|na|em|de|reais|real|paguei|gastei|recebi|salario|ganhei|compras?|cartao|credito|dinheiro|carteira|nubank|itau|inter|banco|pagamento|pix)\b/gi, '');

  // Limpar espaços extras
  description = description.replace(/\s+/g, ' ').trim();
  
  // Se sobrou pouca coisa, capitalizar o nome da categoria ou usar a palavra original sem o valor
  if (description.length < 3) {
    // Tenta achar palavras que identifiquem o estabelecimento no texto original
    const words = text.split(' ').filter(w => {
      const wNorm = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return w.length > 2 && 
             !wNorm.match(/^\d/) && 
             !['reais', 'real', 'cartao', 'credito', 'dinheiro', 'hoje', 'ontem', 'nubank', 'itau', 'inter', 'paguei', 'gastei', 'recebi'].includes(wNorm);
    });
    description = words.length > 0 ? words.join(' ') : (type === 'income' ? 'Receita Extra' : category);
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
    type,
    status: 'confirmed'
  };
};
