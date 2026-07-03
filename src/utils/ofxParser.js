export const parseOFX = (ofxText) => {
  const transactions = [];
  
  // Limpar quebras de linha para facilitar regex de blocos
  const cleanText = ofxText.replace(/\r?\n|\r/g, ' ');
  
  // Expressão regular para achar os blocos <STMTTRN>...</STMTTRN>
  // Pode ser maiúsculo ou minúsculo
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  
  while ((match = stmttrnRegex.exec(cleanText)) !== null) {
    const block = match[1];
    
    // Extratores auxiliares para pegar tags sem tag de fechamento (padrão SGML do OFX)
    const getTagValue = (tag) => {
      const regex = new RegExp(`<${tag}>([^<\\n\\r]*)`, 'i');
      const tagMatch = regex.exec(block);
      return tagMatch ? tagMatch[1].trim() : '';
    };

    const trntype = getTagValue('TRNTYPE'); // DEBIT ou CREDIT
    const dtpostedRaw = getTagValue('DTPOSTED'); // YYYYMMDD...
    const trnamtRaw = getTagValue('TRNAMT'); // Valor
    const fitid = getTagValue('FITID'); // ID Único
    const memo = getTagValue('MEMO') || getTagValue('NAME'); // Descrição

    if (!trnamtRaw || !dtpostedRaw) continue;

    // Formatar data: YYYYMMDD -> YYYY-MM-DD
    const year = dtpostedRaw.substring(0, 4);
    const month = dtpostedRaw.substring(4, 6);
    const day = dtpostedRaw.substring(6, 8);
    const date = `${year}-${month}-${day}`;

    // Valor da transação
    const amount = parseFloat(trnamtRaw);

    // Tipo de transação (receita se for positivo, despesa se for negativo)
    const type = amount >= 0 ? 'income' : 'expense';

    transactions.push({
      fitid,
      description: memo || (type === 'income' ? 'Transferência Recebida' : 'Compra Extrato'),
      amount: Math.abs(amount),
      date,
      type,
      rawAmount: amount, // Mantém sinal para referência
    });
  }

  return transactions;
};

// Algoritmo de Conciliação Automática
export const reconcileTransactions = (ofxTransactions, existingTransactions, accountId, cardId) => {
  const reconciled = [];
  const unmatched = [];

  // Criar uma cópia dos lançamentos existentes para poder "consumir" os matches (evitar ligar o mesmo lançamento manual a duas transações do banco de mesmo valor)
  const availableManuals = [...existingTransactions];

  for (const ofxTx of ofxTransactions) {
    let matchedId = null;
    
    // Procurar por correspondência de valor e data próxima (tolerância de até 2 dias)
    const matchIndex = availableManuals.findIndex((manual) => {
      // Deve ser do mesmo tipo (receita/despesa) e ter valor muito próximo
      const sameType = manual.type === ofxTx.type;
      const sameAmount = Math.abs(manual.amount - ofxTx.amount) < 0.01;
      
      if (sameType && sameAmount) {
        // Calcular diferença em dias
        const manualDate = new Date(manual.date);
        const ofxDate = new Date(ofxTx.date);
        const diffTime = Math.abs(manualDate - ofxDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Se for na mesma conta/cartão (se especificado)
        const sameDestination = 
          (accountId && manual.accountId === accountId) || 
          (cardId && manual.cardId === cardId) ||
          (!accountId && !cardId);

        return diffDays <= 2 && sameDestination;
      }
      return false;
    });

    if (matchIndex !== -1) {
      // Encontrou match! Registrar
      const matchedManual = availableManuals[matchIndex];
      matchedId = matchedManual.id;
      
      // Remover dos manuais disponíveis para não duplicar matches
      availableManuals.splice(matchIndex, 1);

      reconciled.push({
        ...ofxTx,
        status: 'reconciled',
        matchedWith: matchedManual,
        accountId: accountId || null,
        cardId: cardId || null,
      });
    } else {
      // Não encontrou match, precisa ser criada
      // Deduzir categoria inteligente
      const category = suggestCategory(ofxTx.description, ofxTx.type);

      unmatched.push({
        ...ofxTx,
        status: 'new',
        category,
        accountId: accountId || null,
        cardId: cardId || null,
      });
    }
  }

  return { reconciled, unmatched };
};

// Sugerir categoria por estabelecimento
const suggestCategory = (description, type) => {
  if (type === 'income') return 'Rendimentos';

  const normalized = description.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const mappings = {
    'Alimentação': ['padaria', 'mercado', 'supermercado', 'restaurante', 'ifood', 'lanche', 'pizza', 'comida', 'pao', 'cafe', 'carrefour', 'pao de acucar', 'extra', 'assai', 'atacadao'],
    'Transporte': ['posto', 'combustivel', 'gasolina', 'shell', 'ipiranga', 'br', 'uber', '99app', 'taxi', 'pedagio', 'sem parar', 'concessionaria', 'estacionamento'],
    'Assinaturas': ['netflix', 'spotify', 'prime', 'disney', 'hbo', 'google', 'apple', 'microsoft', 'adobe', 'crunchyroll'],
    'Lazer': ['bar', 'cerveja', 'pub', 'cinema', 'ingresso', 'hotel', 'airbnb', 'viagem', 'show', 'churrasco'],
    'Saúde': ['farmacia', 'drogaria', 'drogasil', 'pague menos', 'raia', 'medico', 'hospital', 'consulta', 'exame'],
    'Educação': ['escola', 'faculdade', 'curso', 'udemy', 'livraria', 'mensalidade'],
    'Vestuário': ['renner', 'riachuelo', 'c&a', 'zara', 'nike', 'adidas', 'loja', 'sapato', 'tenis'],
  };

  for (const [category, keywords] of Object.entries(mappings)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category;
    }
  }

  return 'Outros';
};
