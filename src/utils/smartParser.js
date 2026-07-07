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

// Função para converter números escritos por extenso em dígitos (ex: "trinta e cinco" -> "35")
const translateWrittenNumbers = (text) => {
  if (!text) return '';
  
  const numberWordsMap = {
    'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'quatro': 4,
    'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
    'onze': 11, 'doze': 12, 'treze': 13, 'catorze': 14, 'quatorze': 14, 'quinze': 15,
    'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19, 'vinte': 20,
    'trinta': 30, 'quarenta': 40, 'cinquenta': 50, 'sessenta': 60, 'setenta': 70,
    'oitenta': 80, 'noventa': 90, 'cem': 100, 'cento': 100, 'duzentos': 200,
    'trezentos': 300, 'quatrocentos': 400, 'quinhentos': 500, 'seiscentos': 600,
    'setecentos': 700, 'oitocentos': 800, 'novecentos': 900, 'mil': 1000
  };

  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const tokens = normalized.split(/(\s+)/);
  const result = [];
  
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i].trim();
    
    if (numberWordsMap[token] !== undefined) {
      const numberSequence = [token];
      let j = i + 1;
      
      while (j < tokens.length) {
        const nextToken = tokens[j].trim();
        if (nextToken === '') {
          j++;
          continue;
        }
        if (nextToken === 'e') {
          let nextVal = undefined;
          let k = j + 1;
          while (k < tokens.length) {
            const lookahead = tokens[k].trim();
            if (lookahead === '') {
              k++;
              continue;
            }
            nextVal = numberWordsMap[lookahead];
            break;
          }
          
          if (nextVal !== undefined) {
            let tempGroup = 0;
            for (const w of numberSequence) {
              if (w === 'e') continue;
              const val = numberWordsMap[w];
              if (val !== undefined && val !== 1000) tempGroup += val;
            }
            if (nextVal !== 1000 && tempGroup > 0 && nextVal >= tempGroup) {
              break;
            }
            numberSequence.push(nextToken);
            j++;
          } else {
            break;
          }
        } else if (numberWordsMap[nextToken] !== undefined) {
          const nextVal = numberWordsMap[nextToken];
          let tempGroup = 0;
          for (const w of numberSequence) {
            if (w === 'e') continue;
            const val = numberWordsMap[w];
            if (val !== undefined && val !== 1000) tempGroup += val;
          }
          if (nextVal !== 1000 && tempGroup > 0 && nextVal >= tempGroup) {
            break;
          }
          numberSequence.push(nextToken);
          j++;
        } else {
          break;
        }
      }

      // Voltar j se terminar em espaço para não perder o espaço
      while (j > i && tokens[j - 1].trim() === '') {
        j--;
      }
      
      // Limpar conectivos "e" no final e voltar j
      while (numberSequence.length > 0 && numberSequence[numberSequence.length - 1] === 'e') {
        numberSequence.pop();
        j--;
        while (j > i && tokens[j - 1].trim() === '') {
          j--;
        }
      }
      
      if (numberSequence.length > 0) {
        let total = 0;
        let currentGroup = 0;
        
        for (const w of numberSequence) {
          if (w === 'e') continue;
          const val = numberWordsMap[w];
          if (val !== undefined) {
            if (val === 1000) {
              if (currentGroup === 0) currentGroup = 1;
              total += currentGroup * 1000;
              currentGroup = 0;
            } else {
              currentGroup += val;
            }
          }
        }
        const finalValue = total + currentGroup;
        result.push(finalValue.toString());
        i = j;
      } else {
        result.push(tokens[i]);
        i++;
      }
    } else {
      result.push(tokens[i]);
      i++;
    }
  }
  
  return result.join('');
};

export const parseSmartInput = (text, accounts = [], cards = [], defaultAccountId = '') => {
  if (!text || text.trim() === '') return null;

  // Pré-processar para converter números escritos por extenso em dígitos
  const preProcessedText = translateWrittenNumbers(text);

  const normalized = preProcessedText.toLowerCase()
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

  // 1. Extrair Valor (Amount) com priorização e desempate por posição
  let amount = 0;
  let foundValue = false;

  // a) Mapear índices de números que representam parcelas ou datas para excluí-los dos candidatos a valor
  const excludedIndices = [];
  
  // Excluir números de parcelas (ex: "em 12 vezes", "12x", "12 parcelas")
  const instFindRegex = /(?:parcelado|dividido)?\s*(?:em)?\s*(\d+)\s*(?:x|vezes|parcelas)\b/gi;
  let instMatch;
  while ((instMatch = instFindRegex.exec(normalized)) !== null) {
    const numStr = instMatch[1];
    const numIndex = instMatch.index + instMatch[0].indexOf(numStr);
    excludedIndices.push({ start: numIndex, end: numIndex + numStr.length });
  }

  // Excluir números de data (ex: "dia 15", "dia 5")
  const dateFindRegex = /\bdia\s+(\d{1,2})\b/gi;
  let dateMatch;
  while ((dateMatch = dateFindRegex.exec(normalized)) !== null) {
    const numStr = dateMatch[1];
    const numIndex = dateMatch.index + dateMatch[0].indexOf(numStr);
    excludedIndices.push({ start: numIndex, end: numIndex + numStr.length });
  }

  // b) Tentar primeiro o padrão de centavos falados com "e" (ex: "5 e 99", "15 reais e 50")
  const spokenFindRegex = /(\d+)\s*(?:reais|real)?\s*e\s*(\d{1,2})\b/gi;
  let spokenMatch;
  const spokenCandidates = [];
  
  while ((spokenMatch = spokenFindRegex.exec(normalized)) !== null) {
    const start = spokenMatch.index;
    const end = spokenMatch.index + spokenMatch[0].length;
    
    // Verifica se coincide com exclusões
    const isExcluded = excludedIndices.some(exc => {
      return (start >= exc.start && start <= exc.end) || (end >= exc.start && end <= exc.end);
    });
    if (isExcluded) continue;
    
    const integers = spokenMatch[1];
    let cents = spokenMatch[2];
    if (cents.length === 1) {
      cents = '0' + cents; // "5 e 9" -> "5,09"
    }
    const val = parseFloat(integers + '.' + cents);
    if (!isNaN(val) && val > 0) {
      spokenCandidates.push({
        value: val,
        index: start
      });
    }
  }

  if (spokenCandidates.length > 0) {
    // Se houver mais de um, escolhe o último da frase
    spokenCandidates.sort((a, b) => b.index - a.index);
    amount = spokenCandidates[0].value;
    foundValue = true;
  }

  // c) Se não achou centavos falados, coleta todos os candidatos numéricos gerais
  if (!foundValue) {
    const valueRegex = /(?:r\$\s*)?(\d+(?:[.,]\d+)?)/gi;
    let numMatch;
    const candidates = [];
    
    while ((numMatch = valueRegex.exec(normalized)) !== null) {
      const matchedText = numMatch[0];
      const numberStr = numMatch[1];
      const start = numMatch.index;
      const end = numMatch.index + matchedText.length;
      
      // Ignora índices excluídos (dia ou parcelas)
      const isExcluded = excludedIndices.some(exc => {
        return (start >= exc.start && start <= exc.end) || (end >= exc.start && end <= exc.end);
      });
      if (isExcluded) continue;
      
      const val = parseRawValue(numberStr);
      if (isNaN(val) || val <= 0) continue;
      
      // Definir prioridades
      let priority = 1;
      
      // Tem prefixo "r$" ou sufixo "real/reais"
      const precedingText = normalized.substring(Math.max(0, start - 5), start);
      const proceedingText = normalized.substring(end, Math.min(normalized.length, end + 10));
      
      if (precedingText.includes('r$') || proceedingText.match(/^\s*(?:reais|real)\b/i)) {
        priority = 2;
      }
      
      candidates.push({
        value: val,
        index: start,
        priority: priority
      });
    }

    if (candidates.length > 0) {
      // Ordena por Prioridade (alta primeiro) e depois por Posição (último na frase primeiro)
      candidates.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.index - a.index; // Maior index = último na frase
      });
      
      amount = candidates[0].value;
      foundValue = true;
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
