import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useFinanceData = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  
  // Controle de Espaço Ativo (Multi-Workspace)
  const [activeSpaceUserId, setActiveSpaceUserId] = useState(null);
  const [activeSpaceOwnerEmail, setActiveSpaceOwnerEmail] = useState('Meu Espaço');
  const [sharedSpaces, setSharedSpaces] = useState([]); // Espaços onde sou Guest
  const [mySharedUsers, setMySharedUsers] = useState([]); // Guests que convidei
  
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mobills_theme') || 'dark';
  });

  // 1. Escutar a sessão de login do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setActiveSpaceUserId(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setActiveSpaceUserId(session.user.id);
      } else {
        setAccounts([]);
        setCards([]);
        setTransactions([]);
        setBudgets([]);
        setSharedSpaces([]);
        setMySharedUsers([]);
        setActiveSpaceUserId(null);
        setActiveSpaceOwnerEmail('Meu Espaço');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Carregar dados do usuário e configurações de compartilhamento
  useEffect(() => {
    if (user && activeSpaceUserId) {
      fetchUserData(false, activeSpaceUserId);
      fetchSharedConfiguration();
    }
  }, [user, activeSpaceUserId]);

  // 3. Sincronização em tempo real (Supabase Realtime)
  useEffect(() => {
    if (!user || !activeSpaceUserId) return;

    // Escutar mudanças no espaço atual que estou visualizando
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${activeSpaceUserId}` },
        () => fetchUserData(true, activeSpaceUserId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${activeSpaceUserId}` },
        () => fetchUserData(true, activeSpaceUserId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${activeSpaceUserId}` },
        () => fetchUserData(true, activeSpaceUserId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${activeSpaceUserId}` },
        () => fetchUserData(true, activeSpaceUserId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeSpaceUserId]);

  // Escutar atualizações na lista de compartilhamentos em si
  useEffect(() => {
    if (!user) return;

    const shareChannel = supabase
      .channel('share-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_access' },
        () => fetchSharedConfiguration()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shareChannel);
    };
  }, [user]);

  // Tema local
  useEffect(() => {
    localStorage.setItem('mobills_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchUserData = async (silent = false, spaceId = activeSpaceUserId) => {
    if (!spaceId) return;
    if (!silent) setLoading(true);

    try {
      // Buscar contas filtrando pelo espaço ativo
      const { data: accData, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', spaceId)
        .order('name');
      
      // Buscar cartões filtrando pelo espaço ativo
      const { data: crdData, error: crdErr } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', spaceId)
        .order('name');

      // Buscar orçamentos filtrando pelo espaço ativo
      const { data: bdgtData, error: bdgtErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', spaceId);

      // Buscar transações filtrando pelo espaço ativo
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', spaceId)
        .order('date', { ascending: false });

      if (accErr || crdErr || bdgtErr || txErr) {
        throw new Error('Falha ao carregar dados do espaço');
      }

      setAccounts(accData || []);
      setCards(crdData || []);
      setBudgets(bdgtData || []);
      
      // Mapear os dados das transações vindas do banco formatando adequadamente
      const formattedTxs = (txData || []).map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
        date: tx.date,
        category: tx.category,
        accountId: tx.account_id,
        cardId: tx.card_id,
        type: tx.type,
        status: tx.status
      }));
      setTransactions(formattedTxs);
    } catch (err) {
      console.error('Erro ao buscar dados:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar configurações de compartilhamento
  const fetchSharedConfiguration = async () => {
    if (!user) return;
    try {
      // 1. Sou dono: buscar quem convidei
      const { data: myShares } = await supabase
        .from('shared_access')
        .select('*')
        .eq('owner_id', user.id);
      setMySharedUsers(myShares || []);

      // 2. Sou convidado: buscar espaços que me convidaram
      const { data: guestShares } = await supabase
        .from('shared_access')
        .select('*')
        .eq('guest_email', user.email);
      setSharedSpaces(guestShares || []);
    } catch (err) {
      console.error('Erro ao carregar compartilhamentos:', err);
    }
  };

  // Convidar outro e-mail
  const inviteUser = async (guestEmail) => {
    if (!user) return;
    const payload = {
      owner_id: user.id,
      guest_email: guestEmail,
      owner_email: user.email // Salvar email para mostrar no dropdown do convidado
    };

    const { error } = await supabase.from('shared_access').insert([payload]);
    if (error) {
      alert(`Erro ao compartilhar: ${error.message}`);
      throw error;
    }
    fetchSharedConfiguration();
  };

  // Revogar acesso de um e-mail
  const removeInvite = async (guestEmail) => {
    if (!user) return;
    const { error } = await supabase
      .from('shared_access')
      .delete()
      .eq('owner_id', user.id)
      .eq('guest_email', guestEmail);
    
    if (error) {
      alert(`Erro ao remover compartilhamento: ${error.message}`);
      return;
    }
    fetchSharedConfiguration();
  };

  // Trocar de Espaço de Visualização
  const switchSpace = (spaceId, ownerEmail = 'Meu Espaço') => {
    setActiveSpaceUserId(spaceId);
    setActiveSpaceOwnerEmail(ownerEmail);
  };

  // Semear dados mockados iniciais no banco de dados para novos usuários no seu próprio espaço
  const seedInitialData = async () => {
    if (!user) return;
    
    // Contas
    const defaultAccs = [
      { user_id: user.id, name: 'Nubank (Conta)', type: 'checking', balance: 2450.80, color: '#8A05BE' },
      { user_id: user.id, name: 'Itaú Uniclass', type: 'checking', balance: 5820.00, color: '#EC7000' },
      { user_id: user.id, name: 'Carteira (Dinheiro)', type: 'cash', balance: 180.00, color: '#2E7D32' },
    ];
    const { data: createdAccs } = await supabase.from('accounts').insert(defaultAccs).select();

    // Cartões
    const defaultCards = [
      { user_id: user.id, name: 'Nubank Mastercard', limit: 5000.00, invoice: 890.50, closingDay: 3, dueDay: 10, color: '#8A05BE' },
      { user_id: user.id, name: 'Itaú Visa Click', limit: 12000.00, invoice: 1540.20, closingDay: 8, dueDay: 15, color: '#004B87' },
    ];
    const { data: createdCards } = await supabase.from('cards').insert(defaultCards).select();

    // Orçamentos
    const defaultBudgets = [
      { user_id: user.id, category: 'Alimentação', limit: 1000.00 },
      { user_id: user.id, category: 'Transporte', limit: 400.00 },
      { user_id: user.id, category: 'Lazer', limit: 500.00 },
      { user_id: user.id, category: 'Moradia', limit: 2500.00 },
      { user_id: user.id, category: 'Assinaturas', limit: 200.00 },
    ];
    await supabase.from('budgets').insert(defaultBudgets);

    // Mapeamento de IDs para transações iniciais
    const nuAcc = createdAccs?.find(a => a.name.includes('Nubank'))?.id || null;
    const itauAcc = createdAccs?.find(a => a.name.includes('Itaú'))?.id || null;
    const walletAcc = createdAccs?.find(a => a.name.includes('Carteira'))?.id || null;
    const nuCard = createdCards?.find(c => c.name.includes('Nubank'))?.id || null;
    const itauCard = createdCards?.find(c => c.name.includes('Itaú'))?.id || null;

    const getRecentDate = (daysAgo) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    // Transações iniciais
    const defaultTxs = [
      { user_id: user.id, description: 'Salário Principal', amount: 9800.00, date: getRecentDate(3), category: 'Rendimentos', account_id: itauAcc, card_id: null, type: 'income', status: 'confirmed' },
      { user_id: user.id, description: 'Supermercado Pão de Açúcar', amount: 382.40, date: getRecentDate(2), category: 'Alimentação', account_id: null, card_id: nuCard, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Posto Shell Combustível', amount: 150.00, date: getRecentDate(1), category: 'Transporte', account_id: null, card_id: nuCard, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Netflix Assinatura', amount: 55.90, date: getRecentDate(5), category: 'Assinaturas', account_id: null, card_id: nuCard, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Jantar Restaurante Japonês', amount: 180.00, date: getRecentDate(4), category: 'Lazer', account_id: nuAcc, card_id: null, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Uber para o Aeroporto', amount: 45.90, date: getRecentDate(0), category: 'Transporte', account_id: nuAcc, card_id: null, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Rendimento Poupança', amount: 35.50, date: getRecentDate(4), category: 'Rendimentos', account_id: nuAcc, card_id: null, type: 'income', status: 'confirmed' },
      { user_id: user.id, description: 'Farmácia Drogasil', amount: 72.80, date: getRecentDate(6), category: 'Saúde', account_id: null, card_id: itauCard, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Aluguel do Apartamento', amount: 2200.00, date: getRecentDate(7), category: 'Moradia', account_id: itauAcc, card_id: null, type: 'expense', status: 'confirmed' },
      { user_id: user.id, description: 'Padaria de Manhã', amount: 15.60, date: getRecentDate(0), category: 'Alimentação', account_id: walletAcc, card_id: null, type: 'expense', status: 'confirmed' },
    ];

    await supabase.from('transactions').insert(defaultTxs);
    
    // Atualizar estado
    const { data: accountsList } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('name');
    const { data: cardsList } = await supabase.from('cards').select('*').eq('user_id', user.id).order('name');
    const { data: budgetsList } = await supabase.from('budgets').select('*').eq('user_id', user.id);
    const { data: transactionsList } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });

    setAccounts(accountsList || []);
    setCards(cardsList || []);
    setBudgets(budgetsList || []);
    
    const formatted = (transactionsList || []).map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: Number(tx.amount),
      date: tx.date,
      category: tx.category,
      accountId: tx.account_id,
      cardId: tx.card_id,
      type: tx.type,
      status: tx.status
    }));
    setTransactions(formatted);
  };

  // Ajustar saldos locais e em nuvem no espaço ativo
  const adjustAccountOrCardBalance = async (tx, isAdding, isRollback = false) => {
    if (!activeSpaceUserId) return;
    const multiplier = (isAdding ? 1 : -1) * (isRollback ? -1 : 1);
    const diff = (tx.type === 'income' ? tx.amount : -tx.amount) * multiplier;

    if (tx.accountId) {
      // 1. Atualizar localmente
      setAccounts(prev => prev.map(acc => {
        if (acc.id === tx.accountId) {
          return { ...acc, balance: Number((acc.balance + diff).toFixed(2)) };
        }
        return acc;
      }));

      // 2. Atualizar no Supabase
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.accountId).single();
      if (acc) {
        await supabase.from('accounts').update({ balance: Number((acc.balance + diff).toFixed(2)) }).eq('id', tx.accountId);
      }
    } else if (tx.cardId) {
      // Despesas de cartão aumentam a fatura, receitas (estorno) reduzem
      const cardDiff = (tx.type === 'expense' ? tx.amount : -tx.amount) * multiplier;

      // 1. Atualizar localmente
      setCards(prev => prev.map(card => {
        if (card.id === tx.cardId) {
          return { ...card, invoice: Number((card.invoice + cardDiff).toFixed(2)) };
        }
        return card;
      }));

      // 2. Atualizar no Supabase
      const { data: card } = await supabase.from('cards').select('invoice').eq('id', tx.cardId).single();
      if (card) {
        await supabase.from('cards').update({ invoice: Number((card.invoice + cardDiff).toFixed(2)) }).eq('id', tx.cardId);
      }
    }
  };

  // ADICIONAR TRANSAÇÃO (salva no espaço ativo)
  const addTransaction = async (newTx) => {
    if (!activeSpaceUserId) return;

    const txPayload = {
      user_id: activeSpaceUserId, // vincula ao dono do espaço
      description: newTx.description,
      amount: newTx.amount,
      date: newTx.date,
      category: newTx.category,
      account_id: newTx.accountId || null,
      card_id: newTx.cardId || null,
      type: newTx.type,
      status: newTx.status || 'confirmed',
    };

    const { data, error } = await supabase.from('transactions').insert([txPayload]).select();
    
    if (error) {
      console.error('Erro ao adicionar transação:', error.message);
      return;
    }

    const insertedTx = {
      id: data[0].id,
      description: data[0].description,
      amount: Number(data[0].amount),
      date: data[0].date,
      category: data[0].category,
      accountId: data[0].account_id,
      cardId: data[0].card_id,
      type: data[0].type,
      status: data[0].status,
    };

    setTransactions(prev => [insertedTx, ...prev]);
    adjustAccountOrCardBalance(insertedTx, true);
  };

  // EDITAR TRANSAÇÃO
  const editTransaction = async (id, updatedTx) => {
    // Reverter saldo antigo
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;
    
    await adjustAccountOrCardBalance(oldTx, false, true);

    const txPayload = {
      description: updatedTx.description,
      amount: updatedTx.amount,
      date: updatedTx.date,
      category: updatedTx.category,
      account_id: updatedTx.accountId || null,
      card_id: updatedTx.cardId || null,
      type: updatedTx.type,
      status: updatedTx.status || 'confirmed',
    };

    const { error } = await supabase.from('transactions').update(txPayload).eq('id', id);
    if (error) {
      console.error('Erro ao editar transação:', error.message);
      return;
    }

    // Salvar transação nova localmente
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedTx } : t));

    // Aplicar saldo novo
    await adjustAccountOrCardBalance({ ...oldTx, ...updatedTx }, true);
  };

  // DELETAR TRANSAÇÃO
  const deleteTransaction = async (id) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // Reverter saldo
    await adjustAccountOrCardBalance(oldTx, false);

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir transação:', error.message);
      await adjustAccountOrCardBalance(oldTx, true);
      return;
    }
    
    // Remover localmente
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // GERENCIAR CONTAS
  const addAccount = async (acc) => {
    if (!activeSpaceUserId) return;
    const payload = {
      user_id: activeSpaceUserId,
      name: acc.name,
      balance: Number(acc.balance || 0),
      type: acc.type,
      color: acc.color
    };
    const { data, error } = await supabase.from('accounts').insert([payload]).select();
    if (error) {
      console.error('Erro ao criar conta:', error.message);
      return;
    }
    setAccounts(prev => [...prev, data[0]]);
  };

  const editAccount = async (id, updatedAcc) => {
    const { error } = await supabase.from('accounts').update(updatedAcc).eq('id', id);
    if (error) {
      console.error('Erro ao editar conta:', error.message);
      return;
    }
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updatedAcc } : acc));
  };

  // GERENCIAR CARTÕES
  const addCard = async (card) => {
    if (!activeSpaceUserId) return;
    const payload = {
      user_id: activeSpaceUserId,
      name: card.name,
      limit: Number(card.limit || 0),
      invoice: Number(card.invoice || 0),
      closing_day: parseInt(card.closingDay),
      due_day: parseInt(card.dueDay),
      color: card.color
    };
    const { data, error } = await supabase.from('cards').insert([payload]).select();
    if (error) {
      console.error('Erro ao criar cartão:', error.message);
      return;
    }
    setCards(prev => [...prev, data[0]]);
  };

  const editCard = async (id, updatedCard) => {
    const payload = {
      name: updatedCard.name,
      limit: Number(updatedCard.limit || 0),
      closing_day: parseInt(updatedCard.closingDay),
      due_day: parseInt(updatedCard.dueDay),
      color: updatedCard.color
    };
    const { error } = await supabase.from('cards').update(payload).eq('id', id);
    if (error) {
      console.error('Erro ao editar cartão:', error.message);
      return;
    }
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updatedCard } : c));
  };

  // GERENCIAR ORÇAMENTOS
  const updateBudget = async (category, limit) => {
    if (!activeSpaceUserId) return;
    const payload = {
      user_id: activeSpaceUserId,
      category,
      limit: Number(limit)
    };
    const { error } = await supabase.from('budgets').upsert([payload]);
    if (error) {
      console.error('Erro ao atualizar orçamento:', error.message);
      return;
    }
    setBudgets(prev => {
      const exists = prev.find(b => b.category === category);
      if (exists) {
        return prev.map(b => b.category === category ? { ...b, limit: Number(limit) } : b);
      } else {
        return [...prev, { category, limit: Number(limit) }];
      }
    });
  };

  // CONCILIAÇÃO OFX EM LOTE NO SUPABASE
  const importOfxTransactions = async (reconciledList, unmatchedList, accountId, cardId) => {
    if (!activeSpaceUserId) return;
    
    // 1. Processar os novos (não conciliados)
    const newTxsPayload = unmatchedList.map(item => ({
      user_id: activeSpaceUserId,
      description: item.description,
      amount: item.amount,
      date: item.date,
      category: item.category || 'Outros',
      account_id: accountId || null,
      card_id: cardId || null,
      type: item.type,
      status: 'confirmed',
    }));

    if (newTxsPayload.length > 0) {
      const { data, error } = await supabase.from('transactions').insert(newTxsPayload).select();
      if (error) {
        console.error('Erro ao importar lote OFX:', error.message);
        return;
      }
      
      const formattedInserted = data.map(item => ({
        id: item.id,
        description: item.description,
        amount: Number(item.amount),
        date: item.date,
        category: item.category,
        accountId: item.account_id,
        cardId: item.card_id,
        type: item.type,
        status: item.status
      }));

      // Adicionar localmente
      setTransactions(prev => [...formattedInserted, ...prev]);

      // Atualizar saldos de todas as transações novas
      for (const tx of formattedInserted) {
        await adjustAccountOrCardBalance(tx, true);
      }
    }

    // 2. Processar os conciliados
    const reconciledIds = reconciledList.map(item => item.matchedWith.id);
    if (reconciledIds.length > 0) {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'confirmed' })
        .in('id', reconciledIds);

      if (error) {
        console.error('Erro ao atualizar transações conciliadas:', error.message);
      } else {
        setTransactions(prev => prev.map(t => {
          if (reconciledIds.includes(t.id)) {
            return { ...t, status: 'confirmed' };
          }
          return t;
        }));
      }
    }
  };

  return {
    user,
    session,
    accounts,
    cards,
    budgets,
    transactions,
    theme,
    loading,
    activeSpaceUserId,
    activeSpaceOwnerEmail,
    sharedSpaces,
    mySharedUsers,
    toggleTheme,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addAccount,
    editAccount,
    addCard,
    editCard,
    updateBudget,
    importOfxTransactions,
    inviteUser,
    removeInvite,
    switchSpace,
  };
};
