import { getTodayString, getYesterdayString } from './formatters';

// Função para tratar e converter valores falados ou colados contendo separadores (ex: "5.650" -> 5650.00, "1.250,50" -> 1250.50)
const parseRawValue = (str) => {
  if (!str) return 0;
  
  // Se tiver tanto ponto quanto vírgula (ex: "1.250,50" ou "1,250.50")
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Ponto é milhar, vírgula é decimal -> "1.250,50"
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      // Vírgula é milhar, ponto é decimal -> "1,250.50"
      return parseFloat(str.replace(/,/g, '').replace(/\./g, '.')) || 0;
    }
  }
  
  // Se tiver apenas vírgula
  if (str.includes(',')) {
    const parts = str.split(',');
    if (parts[1] && parts[1].length === 3) {
      return parseFloat(str.replace(',', '')) || 0; // "5,650" (milhar)
    }
    return parseFloat(str.replace(',', '.')) || 0; // "50,50" (decimal)
  }
  
  // Se tiver apenas ponto
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts[1] && parts[1].length === 3) {
      return parseFloat(str.replace(/\./g, '')) || 0; // "5.650" (milhar)
    }
    return parseFloat(str) || 0; // "50.5" (decimal)
  }
  
  return parseFloat(str) || 0;
};

export const parseSmartInput = (text, accounts = [], cards = [], defaultAccountId = '') => {
  if (!text || text.trim() === '') return null;

  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  const isCredit = normalized.includes('cartao') || normalized.includes('credito') || normalized.includes('fatura') || normalized.includes('samsung pay') || normalized.includes('wallet');

  // Auxiliar para encontrar conta ou cartão pelo nome na frase
  const findAccountOrCard = (searchTerm) => {
    for (const card of cards) {
      const cardNorm = card.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (searchTerm.includes(cardNorm)) return { id: card.id, isCard: true };
    }
    for (const acc of accounts) {
      const accNorm = acc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (searchTerm.includes(accNorm)) return { id: acc.id, isCard: false };
    }

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
    if (searchTerm.includes('carteira') || searchTerm.includes('dinheiro')) {
      const acc = accounts.find(a => a.name.toLowerCase().includes('carteira') || a.name.toLowerCase().includes('dinheiro'));
      if (acc) return { id: acc.id, isCard: false };
    }
    return null;
  };

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

  // ==========================================
  // A. RECONHECIMENTO DE NOTIFICAÇÕES BANCÁRIAS (Colagem direta)
  // ==========================================
  const notificationPatterns = [
    // 1. Pix Recebido / Depósito / Receita
    {
      regex: /(?:pix recebido|recebeu um pix|recebeu um deposito|deposito recebido|transferencia recebida)\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(?:de|do|da|por)\s+([^,.\n]+)/i,
      type: 'income',
      category: 'Rendimentos',
      handler: (match) => {
        const amount = parseFloat(match[1].replace(',', '.'));
        const rawDesc = match[2].trim();
        // Limpar termos adicionais comuns do fim
        const description = rawDesc.replace(/\b(no seu cartao|no Nubank|no Itau|no Inter|pelo pix|final \d+|em sua conta)\b/gi, '').trim();
        return {
          amount,
          description: `Pix - ${description}`,
          type: 'income',
          category: 'Rendimentos'
        };
      }
    },
    // 2. Compra no Cartão / Débito (Despesa)
    {
      regex: /(?:compra de|gastou|compra aprovada|transacao aprovada|pagamento de|compra no valor de)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(?:no estabelecimento|no|na|em)\s+([^,.\n]+)/i,
      type: 'expense',
      handler: (match) => {
        const amount = parseFloat(match[1].replace(',', '.'));
        const rawDesc = match[2].trim();
        // Limpar sufixos de aprovação de cartão comuns nas notificações
        const description = rawDesc.replace(/\b(no seu cartao|com final \d+|aprovada|no Nubank|no Itau|no Inter|no credito|no debito|com o cartao)\b/gi, '').trim();
        return {
          amount,
          description: description,
          type: 'expense'
        };
      }
    }
  ];

  for (const pattern of notificationPatterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      const parsed = pattern.handler(match);
      if (parsed) {
        // Refinar categoria
        let category = parsed.category || 'Outros';
        if (parsed.type === 'expense') {
          for (const [catName, keywords] of Object.entries(categoryMappings)) {
            const descNorm = parsed.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (keywords.some(keyword => descNorm.includes(keyword))) {
              category = catName;
              break;
            }
          }
        }

        // Determinar conta/cartão
        let selectedAccount = null;
        let selectedCard = null;
        const matchedSource = findAccountOrCard(normalized);
        if (matchedSource) {
          if (matchedSource.isCard) selectedCard = matchedSource.id;
          else selectedAccount = matchedSource.id;
        }

        if (!selectedAccount && !selectedCard) {
          if (isCredit && cards.length > 0) {
            selectedCard = cards[0].id;
          } else if (accounts.length > 0) {
            const hasDefault = defaultAccountId && accounts.some(a => a.id === defaultAccountId);
            selectedAccount = hasDefault ? defaultAccountId : accounts[0].id;
          }
        }

        const finalDescription = parsed.description.charAt(0).toUpperCase() + parsed.description.slice(1).replace(/\s+/g, ' ').trim();

        return {
          description: finalDescription,
          amount: parsed.amount,
          date: getTodayString(),
          category,
          accountId: selectedAccount,
          cardId: selectedCard,
          destinationAccountId: null,
          type: parsed.type,
          status: 'confirmed',
          isInstallment: false,
          installmentCount: 1,
          isFixed: false
        };
      }
    }
  }

  // ==========================================
  // B. REGULAR PARSER (HEURÍSTICAS DE FALA)
  // ==========================================

  // 1. Extrair Valor (Amount)
  let amount = 0;
  let foundValue = false;

  // Detectar padrão de fala: "cinco e noventa e nove" que transcreve como "5 e 99"
  // Também detecta "cinco reais e noventa e nove" ou "5 reais e 99"
  const spokenValueRegex = /(\d+)\s*(?:reais|real)?\s*e\s*(\d{1,2})\b/i;
  const spokenMatch = normalized.match(spokenValueRegex);
  if (spokenMatch) {
    const integers = spokenMatch[1];
    let cents = spokenMatch[2];
    if (cents.length === 1) {
      cents = '0' + cents; // "5 e 9" -> "5,09"
    }
    amount = parseFloat(integers + '.' + cents);
    foundValue = true;
  }

  if (!foundValue) {
    const valueRegex = /(?:r\$\s*)?(\d+(?:[.,]\d+)?)/gi;
    const matches = [...normalized.matchAll(valueRegex)];
    
    for (const match of matches) {
      const val = parseRawValue(match[1]);
      
      if (!isNaN(val) && val > 0) {
        const index = match.index;
        const precedingText = normalized.substring(Math.max(0, index - 10), index);
        const proceedingText = normalized.substring(index + match[0].length, index + match[0].length + 15);
        
        if (precedingText.includes('dia ') && !proceedingText.includes('real') && !proceedingText.includes('reais') && val <= 31) {
          continue;
        }
        
        const isInstallmentIndicator = proceedingText.match(/^\s*(?:x|vezes|parcelas)/i);
        if (isInstallmentIndicator && val <= 48) {
          continue; 
        }
        
        amount = val;
        foundValue = true;
        break;
      }
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

  if (type === 'transfer') {
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

    if (!selectedAccount || !selectedDestinationAccount) {
      const foundAccounts = [];
      for (const acc of accounts) {
        const accNorm = acc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(accNorm)) {
          foundAccounts.push(acc.id);
        }
      }
      if (foundAccounts.length >= 2) {
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
    const matched = findAccountOrCard(normalized);
    if (matched) {
      if (matched.isCard) selectedCard = matched.id;
      else selectedAccount = matched.id;
    }

    if (!selectedAccount && !selectedCard) {
      if (isCredit && cards.length > 0) {
        selectedCard = cards[0].id;
      } else if (accounts.length > 0) {
        const hasDefault = defaultAccountId && accounts.some(a => a.id === defaultAccountId);
        const preferred = accounts.find(a => a.name.toLowerCase().includes('carteira') || a.name.toLowerCase().includes('corrente'));
        selectedAccount = hasDefault ? defaultAccountId : (preferred ? preferred.id : accounts[0].id);
      }
    }
  }

  // 6. Extrair Quantidade de Parcelas (Installments)
  let isInstallment = false;
  let installmentCount = 1;
  const installmentRegex = /(?:parcelado|dividido)?\s*(?:em)?\s*(\d+)\s*(?:x|vezes|parcelas)/gi;
  const installmentMatch = installmentRegex.exec(normalized);
  if (installmentMatch) {
    const count = parseInt(installmentMatch[1]);
    if (count > 1 && count <= 60) {
      isInstallment = true;
      installmentCount = count;
    }
  }

  // 7. Extrair Lançamento Fixo (Fixed Recurrence)
  let isFixed = false;
  const fixedKeywords = ['fixo', 'fixa', 'mensal', 'recorrente', 'assinatura'];
  if (fixedKeywords.some(keyword => normalized.includes(keyword)) && type !== 'transfer') {
    isFixed = true;
  }

  // 8. Determinar Status (Pago vs Não Pago / Pendente)
  let status = 'confirmed'; 
  const pendingKeywords = ['nao pago', 'pendente', 'a pagar', 'para pagar', 'nao recebi', 'receber futura', 'planejada', 'agendada'];
  if (pendingKeywords.some(keyword => normalized.includes(keyword))) {
    status = 'pending';
  } else {
    const todayStr = getTodayString();
    if (date > todayStr) {
      status = 'pending';
    }
  }

  // 9. Criar a Descrição (Description) limpa
  let description = text;
  
  // 1. Limpar parcelas primeiro (ex: "12 vezes" -> "" em vez de remover "12" primeiro e sobrar "vezes")
  description = description.replace(/\b\d+\s*(?:x|vezes|parcelas)\b/gi, '');
  description = description.replace(/\b(parcelado|dividido)\s*em\b/gi, '');

  // 2. Limpar valores numéricos gerais (ex: "5.650" ou "49,90")
  description = description.replace(/(?:r\$\s*)?\d+(?:[.,]\d+)?/gi, '');
  
  // 3. Filtrar termos e conectivos usando array para evitar bugs de limite de palavras (\b) com acentos (ex: "alimentação" -> "alimentaçã")
  if (description.trim().length > 0) {
    const stopWords = [
      'no', 'na', 'em', 'de', 'para', 'do', 'da', 'dos', 'das', 'nos', 'nas', 
      'reais', 'real', 'paguei', 'gastei', 'recebi', 'salario', 'ganhei', 'compra', 'compras', 
      'cartao', 'credito', 'dinheiro', 'carteira', 'nubank', 'itau', 'inter', 'banco', 
      'pagamento', 'pix', 'transferir', 'transferencia', 'enviar', 'com', 'um', 'uma', 
      'o', 'a', 'os', 'as', 'meu', 'minha', 'adiciona', 'adicionar', 'lanca', 'lancar', 
      'cadastra', 'cadastrar', 'inclui', 'incluir', 'registra', 'registrar', 'valor', 
      'fixo', 'fixa', 'mensal', 'recorrente', 'assinatura', 'hoje', 'ontem', 'amanha', 
      'dia', 'nao', 'pago', 'pendente', 'confirmado', 'recebido', 'pagar'
    ];

    const descWords = description.split(/\s+/);
    
    // Lista de palavras banidas dos nomes de contas/cartões
    const bannedWords = [];
    for (const acc of accounts) {
      const parts = acc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
      bannedWords.push(...parts);
    }
    for (const card of cards) {
      const parts = card.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
      bannedWords.push(...parts);
    }

    // Filtra as palavras
    const filteredWords = descWords.filter(word => {
      const wordNorm = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      if (!wordNorm) return false;
      // Remove se for stop-word ou se for parte de nome de conta/cartão
      return !stopWords.includes(wordNorm) && !bannedWords.includes(wordNorm);
    });

    description = filteredWords.join(' ').replace(/\s+/g, ' ').trim();
  }
  
  if (description.length < 3) {
    const words = text.split(' ').filter(w => {
      const wNorm = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return w.length > 2 && 
             !wNorm.match(/^\d/) && 
             !['reais', 'real', 'cartao', 'credito', 'dinheiro', 'hoje', 'ontem', 'amanha', 'nubank', 'itau', 'inter', 'paguei', 'gastei', 'recebi', 'transferir', 'transferencia', 'fixo', 'fixa', 'mensal'].includes(wNorm);
    });
    description = words.length > 0 ? words.join(' ') : (type === 'income' ? 'Receita Extra' : (type === 'transfer' ? 'Transferência' : category));
  }

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
    installmentCount,
    isFixed
  };
};
