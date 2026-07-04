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
  const [deletedTransactions, setDeletedTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem('mobills_deleted_transactions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mobills_theme') || 'dark';
  });
  const [defaultAccountId, setDefaultAccountId] = useState('');

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

      const stored = localStorage.getItem('mobills_default_account_id_' + activeSpaceUserId);
      setDefaultAccountId(stored || '');
    }
  }, [user, activeSpaceUserId]);

  // 3. Sincronização em tempo real (Supabase Realtime)
  useEffect(() => {
    if (!user || !activeSpaceUserId) return;

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
      const { data: accData, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', spaceId)
        .order('name');
      
      const { data: crdData, error: crdErr } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', spaceId)
        .order('name');

      const { data: bdgtData, error: bdgtErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', spaceId);

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
      
      const formattedTxs = (txData || []).map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
        date: tx.date,
        category: tx.category,
        accountId: tx.account_id,
        cardId: tx.card_id,
        destinationAccountId: tx.destination_account_id,
        type: tx.type,
        status: tx.status,
        installmentNumber: tx.installment_number,
        totalInstallments: tx.total_installments,
        isFixed: tx.is_fixed
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
      const { data: myShares } = await supabase
        .from('shared_access')
        .select('*')
        .eq('owner_id', user.id);
      setMySharedUsers(myShares || []);

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
      owner_email: user.email
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

  // Ajustar saldos locais e em nuvem no espaço ativo
  const adjustAccountOrCardBalance = async (tx, isAdding) => {
    if (!activeSpaceUserId) return;
    const multiplier = isAdding ? 1 : -1;
    
    // CASO 1: TRANSFERÊNCIA ENTRE CONTAS
    if (tx.type === 'transfer') {
      if (tx.status !== 'confirmed') return; // Transferências pendentes não movem saldo!
      const amount = tx.amount * multiplier;

      // Debitar da origem
      if (tx.accountId) {
        setAccounts(prev => prev.map(acc => acc.id === tx.accountId ? { ...acc, balance: Number((acc.balance - amount).toFixed(2)) } : acc));
        const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.accountId).single();
        if (acc) {
          await supabase.from('accounts').update({ balance: Number((acc.balance - amount).toFixed(2)) }).eq('id', tx.accountId);
        }
      }
      // Creditar no destino
      if (tx.destinationAccountId) {
        setAccounts(prev => prev.map(acc => acc.id === tx.destinationAccountId ? { ...acc, balance: Number((acc.balance + amount).toFixed(2)) } : acc));
        const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.destinationAccountId).single();
        if (acc) {
          await supabase.from('accounts').update({ balance: Number((acc.balance + amount).toFixed(2)) }).eq('id', tx.destinationAccountId);
        }
      }
      return;
    }

    // CASO 2: DESPESA OU RECEITA
    const diff = (tx.type === 'income' ? tx.amount : -tx.amount) * multiplier;

    if (tx.accountId) {
      // Se for conta corrente/dinheiro, SÓ atualiza o saldo se a transação estiver CONFIRMADA (Pago/Recebido)
      if (tx.status !== 'confirmed') return;

      setAccounts(prev => prev.map(acc => {
        if (acc.id === tx.accountId) {
          return { ...acc, balance: Number((acc.balance + diff).toFixed(2)) };
        }
        return acc;
      }));

      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.accountId).single();
      if (acc) {
        await supabase.from('accounts').update({ balance: Number((acc.balance + diff).toFixed(2)) }).eq('id', tx.accountId);
      }
    } else if (tx.cardId) {
      // Cartões de crédito sempre atualizam a fatura imediatamente (reflete a cobrança lançada na fatura)
      const cardDiff = (tx.type === 'expense' ? tx.amount : -tx.amount) * multiplier;

      setCards(prev => prev.map(card => {
        if (card.id === tx.cardId) {
          return { ...card, invoice: Number((card.invoice + cardDiff).toFixed(2)) };
        }
        return card;
      }));

      const { data: card } = await supabase.from('cards').select('invoice').eq('id', tx.cardId).single();
      if (card) {
        await supabase.from('cards').update({ invoice: Number((card.invoice + cardDiff).toFixed(2)) }).eq('id', tx.cardId);
      }
    }
  };

  // ADICIONAR TRANSAÇÃO (salva no espaço ativo, com suporte a parcelas e transferências)
  const addTransaction = async (newTx) => {
    if (!activeSpaceUserId) return;

    // Se for parcelado, rodar o laço de inserção de parcelas
    if (newTx.isInstallment && newTx.installmentCount > 1) {
      const count = newTx.installmentCount;
      const typeOfInstallment = newTx.installmentType || 'divide'; // 'divide' ou 'repeat'
      const baseAmount = typeOfInstallment === 'divide' 
        ? Number((newTx.amount / count).toFixed(2)) 
        : newTx.amount;

      const txsToInsert = [];
      for (let i = 1; i <= count; i++) {
        // Calcular data: somar (i-1) meses
        const baseDate = new Date(newTx.date + 'T00:00:00');
        baseDate.setMonth(baseDate.getMonth() + (i - 1));
        const installmentDate = baseDate.toISOString().split('T')[0];

        // A primeira parcela pode ficar como 'confirmed' (pago) se o usuário selecionou, 
        // mas as parcelas futuras devem sempre ficar como 'pending' (não pago) por segurança
        const installmentStatus = i === 1 ? newTx.status : 'pending';

        txsToInsert.push({
          user_id: activeSpaceUserId,
          description: `${newTx.description} (${i}/${count})`,
          amount: baseAmount,
          date: installmentDate,
          category: newTx.category,
          account_id: newTx.accountId || null,
          card_id: newTx.cardId || null,
          destination_account_id: newTx.destinationAccountId || null,
          type: newTx.type,
          status: installmentStatus,
          installment_number: i,
          total_installments: count
        });
      }

      const { data, error } = await supabase.from('transactions').insert(txsToInsert).select();
      if (error) {
        console.error('Erro ao adicionar transações parceladas:', error.message);
        return;
      }

      // Adicionar e atualizar saldos de cada uma
      const formattedInserted = data.map(item => ({
        id: item.id,
        description: item.description,
        amount: Number(item.amount),
        date: item.date,
        category: item.category,
        accountId: item.account_id,
        cardId: item.card_id,
        destinationAccountId: item.destination_account_id,
        type: item.type,
        status: item.status,
        installmentNumber: item.installment_number,
        totalInstallments: item.total_installments
      }));

      setTransactions(prev => [...formattedInserted, ...prev]);

      for (const tx of formattedInserted) {
        await adjustAccountOrCardBalance(tx, true);
      }

    } else if (newTx.isFixed) {
      // Criar 12 lançamentos recorrentes (mensais)
      const txsToInsert = [];
      for (let i = 1; i <= 12; i++) {
        const baseDate = new Date(newTx.date + 'T00:00:00');
        baseDate.setMonth(baseDate.getMonth() + (i - 1));
        const fixedDate = baseDate.toISOString().split('T')[0];

        // A primeira ocorrência fica com o status escolhido, as outras 11 ficam como pendente
        const fixedStatus = i === 1 ? newTx.status : 'pending';

        txsToInsert.push({
          user_id: activeSpaceUserId,
          description: newTx.description,
          amount: newTx.amount,
          date: fixedDate,
          category: newTx.category,
          account_id: newTx.accountId || null,
          card_id: newTx.cardId || null,
          destination_account_id: newTx.destinationAccountId || null,
          type: newTx.type,
          status: fixedStatus,
          is_fixed: true
        });
      }

      const { data, error } = await supabase.from('transactions').insert(txsToInsert).select();
      if (error) {
        console.error('Erro ao adicionar transações fixas:', error.message);
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
        destinationAccountId: item.destination_account_id,
        type: item.type,
        status: item.status,
        isFixed: item.is_fixed
      }));

      setTransactions(prev => [...formattedInserted, ...prev]);

      for (const tx of formattedInserted) {
        await adjustAccountOrCardBalance(tx, true);
      }

    } else {
      // Lançamento normal de única parcela ou transferência
      const txPayload = {
        user_id: activeSpaceUserId,
        description: newTx.description,
        amount: newTx.amount,
        date: newTx.date,
        category: newTx.category,
        account_id: newTx.accountId || null,
        card_id: newTx.cardId || null,
        destination_account_id: newTx.destinationAccountId || null,
        type: newTx.type,
        status: newTx.status || 'confirmed',
        is_fixed: newTx.isFixed || false
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
        destinationAccountId: data[0].destination_account_id,
        type: data[0].type,
        status: data[0].status,
        installmentNumber: data[0].installment_number,
        totalInstallments: data[0].total_installments,
        isFixed: data[0].is_fixed
      };

      setTransactions(prev => [insertedTx, ...prev]);
      await adjustAccountOrCardBalance(insertedTx, true);
    }
  };

  // EDITAR TRANSAÇÃO
  const editTransaction = async (id, updatedTx) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;
    
    // Reverter saldo antigo
    await adjustAccountOrCardBalance(oldTx, false);

    const txPayload = {
      description: updatedTx.description,
      amount: updatedTx.amount,
      date: updatedTx.date,
      category: updatedTx.category,
      account_id: updatedTx.accountId || null,
      card_id: updatedTx.cardId || null,
      destination_account_id: updatedTx.destinationAccountId || null,
      type: updatedTx.type,
      status: updatedTx.status || 'confirmed',
    };

    const { error } = await supabase.from('transactions').update(txPayload).eq('id', id);
    if (error) {
      console.error('Erro ao editar transação:', error.message);
      // Destruição de reversão se falhar (re-debitar transação antiga)
      await adjustAccountOrCardBalance(oldTx, true);
      return;
    }

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
      // Devolver saldo se falhar
      await adjustAccountOrCardBalance(oldTx, true);
      return;
    }
    
    // Salvar na lixeira local
    const txWithTime = { ...oldTx, deletedAt: new Date().toISOString() };
    const updatedTrash = [txWithTime, ...deletedTransactions];
    setDeletedTransactions(updatedTrash);
    localStorage.setItem('mobills_deleted_transactions', JSON.stringify(updatedTrash));

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // RESTAURAR TRANSAÇÃO DA LIXEIRA
  const restoreTransaction = async (tx) => {
    if (!activeSpaceUserId) return;

    const txPayload = {
      user_id: activeSpaceUserId,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      category: tx.category,
      account_id: tx.accountId || null,
      card_id: tx.cardId || null,
      destination_account_id: tx.destinationAccountId || null,
      type: tx.type,
      status: tx.status || 'confirmed',
      installment_number: tx.installmentNumber || null,
      total_installments: tx.totalInstallments || null,
      is_fixed: tx.isFixed || false
    };

    const { data, error } = await supabase.from('transactions').insert([txPayload]).select();
    if (error) {
      console.error('Erro ao restaurar transação:', error.message);
      alert('Erro ao restaurar transação no banco de dados.');
      return;
    }

    const restored = {
      id: data[0].id,
      description: data[0].description,
      amount: Number(data[0].amount),
      date: data[0].date,
      category: data[0].category,
      accountId: data[0].account_id,
      cardId: data[0].card_id,
      destinationAccountId: data[0].destination_account_id,
      type: data[0].type,
      status: data[0].status,
      installmentNumber: data[0].installment_number,
      totalInstallments: data[0].total_installments,
      isFixed: data[0].is_fixed
    };

    // Re-aplicar saldo
    await adjustAccountOrCardBalance(restored, true);

    // Adicionar de volta localmente
    setTransactions(prev => [restored, ...prev]);

    // Remover da lixeira
    const updatedTrash = deletedTransactions.filter(t => t.id !== tx.id);
    setDeletedTransactions(updatedTrash);
    localStorage.setItem('mobills_deleted_transactions', JSON.stringify(updatedTrash));
  };

  // EXCLUIR DEFINITIVAMENTE DA LIXEIRA
  const permanentlyDeleteTransaction = (id) => {
    const updatedTrash = deletedTransactions.filter(t => t.id !== id);
    setDeletedTransactions(updatedTrash);
    localStorage.setItem('mobills_deleted_transactions', JSON.stringify(updatedTrash));
  };

  // ESVAZIAR LIXEIRA
  const emptyTrash = () => {
    setDeletedTransactions([]);
    localStorage.removeItem('mobills_deleted_transactions');
  };

  // INTERRUPTOR RÁPIDO DE STATUS: CONFIRMAR PAGAMENTO (PAGO/PENDENTE)
  const toggleTransactionStatus = async (id) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const newStatus = oldTx.status === 'confirmed' ? 'pending' : 'confirmed';

    // Se estiver confirmando: precisamos somar/debitar o saldo.
    // Se estiver pendenciando: precisamos reverter o saldo.
    if (newStatus === 'confirmed') {
      await adjustAccountOrCardBalance({ ...oldTx, status: 'confirmed' }, true);
    } else {
      await adjustAccountOrCardBalance(oldTx, false);
    }

    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Erro ao alternar status da transação:', error.message);
      // Reverter alteração local de saldo se falhar no banco
      if (newStatus === 'confirmed') {
        await adjustAccountOrCardBalance({ ...oldTx, status: 'confirmed' }, false);
      } else {
        await adjustAccountOrCardBalance(oldTx, true);
      }
      return;
    }

    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
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

  // EXCLUIR CONTA BANCÁRIA
  const deleteAccount = async (accountId) => {
    if (!activeSpaceUserId) return;
    
    // 1. Excluir lançamentos associados no banco de dados para evitar erro de chave estrangeira
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('account_id', accountId);
      
    if (txError) {
      console.error('Erro ao excluir lançamentos da conta:', txError.message);
      alert('Erro ao excluir os lançamentos associados a esta conta.');
      return;
    }

    // 2. Excluir a conta em si
    const { error: accError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (accError) {
      console.error('Erro ao excluir conta:', accError.message);
      alert('Erro ao excluir a conta.');
      return;
    }

    // 3. Atualizar estados locais
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    setTransactions(prev => prev.filter(tx => tx.accountId !== accountId));
  };

  // EXCLUIR CARTÃO DE CRÉDITO
  const deleteCard = async (cardId) => {
    if (!activeSpaceUserId) return;

    // 1. Excluir lançamentos associados no banco de dados para evitar erro de chave estrangeira
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('card_id', cardId);

    if (txError) {
      console.error('Erro ao excluir lançamentos do cartão:', txError.message);
      alert('Erro ao excluir os lançamentos associados a este cartão.');
      return;
    }

    // 2. Excluir o cartão em si
    const { error: cardError } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (cardError) {
      console.error('Erro ao excluir cartão:', cardError.message);
      alert('Erro ao excluir o cartão.');
      return;
    }

    // 3. Sincronizar estados locais
    setCards(prev => prev.filter(card => card.id !== cardId));
    setTransactions(prev => prev.filter(tx => tx.cardId !== cardId));
  };

  // DEFINIR CONTA PRINCIPAL PADRÃO
  const changeDefaultAccount = (accountId) => {
    if (!activeSpaceUserId) return;
    localStorage.setItem('mobills_default_account_id_' + activeSpaceUserId, accountId);
    setDefaultAccountId(accountId);
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
        destinationAccountId: item.destination_account_id,
        type: item.type,
        status: item.status
      }));

      setTransactions(prev => [...formattedInserted, ...prev]);

      for (const tx of formattedInserted) {
        await adjustAccountOrCardBalance(tx, true);
      }
    }

    const reconciledIds = reconciledList.map(item => item.matchedWith.id);
    if (reconciledIds.length > 0) {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'confirmed' })
        .in('id', reconciledIds);

      if (error) {
        console.error('Erro ao atualizar transações conciliadas:', error.message);
      } else {
        // Para cada transação alterada de pendente para confirmado, atualiza saldos
        const updatedTxs = transactions.filter(t => reconciledIds.includes(t.id) && t.status !== 'confirmed');
        for (const tx of updatedTxs) {
          await adjustAccountOrCardBalance({ ...tx, status: 'confirmed' }, true);
        }

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
    deletedTransactions,
    defaultAccountId,
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
    toggleTransactionStatus,
    restoreTransaction,
    permanentlyDeleteTransaction,
    emptyTrash,
    addAccount,
    editAccount,
    deleteAccount,
    addCard,
    editCard,
    deleteCard,
    changeDefaultAccount,
    updateBudget,
    importOfxTransactions,
    inviteUser,
    removeInvite,
    switchSpace,
  };
};
