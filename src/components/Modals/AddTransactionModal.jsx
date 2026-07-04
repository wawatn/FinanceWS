import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, CreditCard, Wallet, FileText, Check, Mic, MicOff, Sparkles, Send, RefreshCw } from 'lucide-react';
import { parseSmartInput } from '../../utils/smartParser';

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Assinaturas',
  'Saúde',
  'Educação',
  'Vestuário',
  'Beleza',
  'Rendimentos',
  'Outros'
];

export const AddTransactionModal = ({ isOpen, onClose, onSave, editingTransaction, accounts, cards }) => {
  // Estados do Formulário
  const [type, setType] = useState('expense'); // 'expense', 'income' ou 'transfer'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [paymentType, setPaymentType] = useState('account'); // 'account' ou 'card'
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [status, setStatus] = useState('confirmed'); // 'confirmed' (pago) ou 'pending' (não pago)

  // Estados de Recorrência (Único, Parcelado ou Fixo)
  const [recurrenceType, setRecurrenceType] = useState('single'); // 'single', 'installment' ou 'fixed'
  const [installmentCount, setInstallmentCount] = useState(2);
  const [installmentType, setInstallmentType] = useState('divide'); // 'divide' ou 'repeat'

  // Estados do Lançamento Inteligente por Voz/Texto
  const [smartText, setSmartText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [smartError, setSmartError] = useState('');

  // Inicializar Reconhecimento de Voz (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'pt-BR';
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setSmartError('');
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSmartError('Permissão para microfone negada. Ative nas configurações do seu navegador.');
        } else {
          setSmartError('Erro ao escutar a voz. Tente digitar.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSmartText(transcript);
        handleProcessSmartText(transcript);
      };

      setRecognition(rec);
    }
  }, []);

  // Sincronizar com transação de edição se fornecida
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setAmount(
        editingTransaction.amount 
          ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(editingTransaction.amount)
          : ''
      );
      setDate(editingTransaction.date || '');
      setDescription(editingTransaction.description || '');
      setCategory(editingTransaction.category || 'Alimentação');
      setStatus(editingTransaction.status || 'confirmed');
      
      if (editingTransaction.type === 'transfer') {
        setAccountId(editingTransaction.accountId || '');
        setDestinationAccountId(editingTransaction.destinationAccountId || '');
        setCardId('');
      } else {
        if (editingTransaction.cardId) {
          setPaymentType('card');
          setCardId(editingTransaction.cardId);
          setAccountId('');
        } else {
          setPaymentType('account');
          setAccountId(editingTransaction.accountId || '');
          setCardId('');
        }
      }

      setRecurrenceType(editingTransaction.isFixed ? 'fixed' : 'single');
      setSmartText('');
      setSmartError('');
    } else {
      // Valores padrão para nova transação
      setType('expense');
      setAmount('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setDescription('');
      setCategory('Alimentação');
      setStatus('confirmed');
      setPaymentType('account');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setCardId(cards.length > 0 ? cards[0].id : '');
      setDestinationAccountId(accounts.length > 1 ? accounts[1].id : '');
      setRecurrenceType('single');
      setInstallmentCount(2);
      setInstallmentType('divide');
      setSmartText('');
      setSmartError('');
    }
  }, [editingTransaction, isOpen, accounts, cards]);

  // Alerta de status pendente para datas futuras
  useEffect(() => {
    if (!editingTransaction && date) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (date > todayStr) {
        setStatus('pending'); // Se a data for futura, marcar por padrão como Não Pago
      } else {
        setStatus('confirmed');
      }
    }
  }, [date, editingTransaction]);

  // Sincronizações de tipo de transação
  useEffect(() => {
    if (type === 'income') {
      setPaymentType('account');
      if (category === 'Alimentação' || category === 'Transporte' || category === 'Moradia') {
        setCategory('Rendimentos');
      }
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
    } else if (type === 'transfer') {
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
      if (accounts.length > 1 && !destinationAccountId) {
        setDestinationAccountId(accounts[1].id);
      }
    } else {
      if (category === 'Rendimentos') {
        setCategory('Alimentação');
      }
    }
  }, [type, accounts]);

  if (!isOpen) return null;

  // Gravação de Voz (microfone)
  const toggleListening = () => {
    if (!recognition) {
      setSmartError('Reconhecimento de voz não suportado neste navegador. Digite seu lançamento.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setSmartText('');
      setSmartError('');
      recognition.start();
    }
  };

  // Processar texto inteligente e preencher o formulário
  const handleProcessSmartText = (text) => {
    if (!text.trim()) return;

    const parsed = parseSmartInput(text, accounts, cards);
    if (parsed && parsed.amount > 0) {
      setAmount(
        parsed.amount 
          ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsed.amount)
          : ''
      );
      setDescription(parsed.description);
      setDate(parsed.date);
      setCategory(parsed.category);
      setType(parsed.type);
      setStatus(parsed.status);
      
      if (parsed.type === 'transfer') {
        if (parsed.accountId) setAccountId(parsed.accountId);
        if (parsed.destinationAccountId) setDestinationAccountId(parsed.destinationAccountId);
      } else {
        if (parsed.cardId) {
          setPaymentType('card');
          setCardId(parsed.cardId);
          setAccountId('');
        } else if (parsed.accountId) {
          setPaymentType('account');
          setAccountId(parsed.accountId);
          setCardId('');
        }
        
        // Configurar Recorrência
        if (parsed.isInstallment) {
          setRecurrenceType('installment');
          setInstallmentCount(parsed.installmentCount);
        } else if (parsed.isFixed) {
          setRecurrenceType('fixed');
        } else {
          setRecurrenceType('single');
        }
      }
      setSmartError('');
    } else {
      setSmartError('Não identifiquei o valor. Diga ou digite ex: "Padaria 15 reais no dinheiro ontem"');
    }
  };

  const handleSmartSubmit = (e) => {
    e.preventDefault();
    handleProcessSmartText(smartText);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setAmount('');
      return;
    }
    const numericValue = parseFloat(digits) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
    setAmount(formatted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description || !date) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (type === 'transfer' && accountId === destinationAccountId) {
      alert('A conta de origem e destino devem ser diferentes.');
      return;
    }

    const txData = {
      description,
      amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
      date,
      category: type === 'transfer' ? 'Transferência' : category,
      type,
      accountId: type === 'income' || type === 'transfer' || paymentType === 'account' ? accountId : null,
      cardId: type === 'expense' && paymentType === 'card' ? cardId : null,
      destinationAccountId: type === 'transfer' ? destinationAccountId : null,
      status,
      isInstallment: type !== 'transfer' && recurrenceType === 'installment',
      installmentCount: type !== 'transfer' && recurrenceType === 'installment' ? parseInt(installmentCount) : 1,
      installmentType: type !== 'transfer' && recurrenceType === 'installment' ? installmentType : 'divide',
      isFixed: type !== 'transfer' && recurrenceType === 'fixed'
    };

    onSave(txData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 1. BARRA INTELIGENTE (FALE OU DIGITE) NO TOPO DO MODAL */}
        {!editingTransaction && (
          <div 
            style={{ 
              padding: '1rem 1.5rem', 
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--surface-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Sparkles size={14} className="text-income" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Escreva para autopreencher os campos abaixo
              </span>
            </div>

            <form onSubmit={handleSmartSubmit} className="smart-input-container" style={{ padding: '0.25rem 1rem' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              
              <input 
                type="text" 
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                placeholder="Ex: 'Streaming 49,90 no cartão Nubank fixo'"
                className="smart-input-field"
                disabled={isListening}
                style={{ fontSize: '0.85rem', padding: '0.25rem 0' }}
              />

              <button 
                type="submit" 
                className="btn-icon" 
                style={{ borderRadius: '50%', width: '34px', height: '34px', color: 'var(--primary)' }}
                disabled={smartText.trim() === '' || isListening}
              >
                <Send size={16} />
              </button>
            </form>

            {smartError && (
              <span style={{ color: 'var(--expense)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', paddingLeft: '0.25rem' }}>
                {smartError}
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
            
            {/* Toggle Tipo: Despesa vs Receita vs Transferência */}
            <div style={{ display: 'flex', backgroundColor: 'var(--surface-secondary)', padding: '0.25rem', borderRadius: '12px' }}>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: type === 'expense' ? 'var(--expense)' : 'transparent',
                  color: type === 'expense' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  fontSize: '0.85rem'
                }}
                onClick={() => setType('expense')}
              >
                Despesa
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: type === 'income' ? 'var(--income)' : 'transparent',
                  color: type === 'income' ? '#000' : 'var(--text-secondary)',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  fontSize: '0.85rem'
                }}
                onClick={() => setType('income')}
              >
                Receita
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: type === 'transfer' ? 'var(--primary)' : 'transparent',
                  color: type === 'transfer' ? '#000' : 'var(--text-secondary)',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  fontSize: '0.85rem'
                }}
                onClick={() => setType('transfer')}
              >
                Transferência
              </button>
            </div>

            {/* Valor */}
            <div>
              <label>Valor (R$)*</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  R$
                </span>
                 <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  style={{ paddingLeft: '2.5rem', fontSize: '1.15rem', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label>Descrição*</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  required
                  placeholder={type === 'transfer' ? "ex: Transferência mensal, Ajuste..." : "ex: Padaria, Uber, Almoço..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Data e Categoria */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Data*</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {type !== 'transfer' ? (
                <div>
                  <label>Categoria</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'end' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                    Categoria automática: <strong>Transferência</strong>
                  </span>
                </div>
              )}
            </div>

            {/* SEÇÃO: DETALHES DE PAGAMENTO / TRANSFERÊNCIA */}
            {type === 'transfer' ? (
              // Modo Transferência: De Conta -> Para Conta
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--surface-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                    <Wallet size={12} className="text-expense" /> Origem (De)
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                    <Wallet size={12} className="text-income" /> Destino (Para)
                  </label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : type === 'expense' ? (
              // Modo Despesa comum: Cartão ou Conta
              <div>
                <label>Forma de Pagamento</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      padding: '0.5rem',
                      border: `1px solid ${paymentType === 'account' ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: paymentType === 'account' ? 'var(--primary-glow)' : 'transparent',
                      color: paymentType === 'account' ? 'var(--text)' : 'var(--text-secondary)',
                    }}
                    onClick={() => {
                      setPaymentType('account');
                      if (accounts.length > 0) setAccountId(accounts[0].id);
                      setCardId('');
                    }}
                  >
                    <Wallet size={16} />
                    Conta Bancária
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      padding: '0.5rem',
                      border: `1px solid ${paymentType === 'card' ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: paymentType === 'card' ? 'var(--primary-glow)' : 'transparent',
                      color: paymentType === 'card' ? 'var(--text)' : 'var(--text-secondary)',
                    }}
                    onClick={() => {
                      setPaymentType('card');
                      if (cards.length > 0) setCardId(cards[0].id);
                      setAccountId('');
                    }}
                  >
                    <CreditCard size={16} />
                    Cartão de Crédito
                  </button>
                </div>

                {paymentType === 'account' ? (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  >
                    <option value="" disabled>Selecione uma conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  >
                    <option value="" disabled>Selecione um cartão</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>{card.name} (Fat: R$ {card.invoice.toFixed(2)})</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              // Modo Receita comum: Receber na Conta
              <div>
                <label>Receber na Conta</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecione uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>
            )}

            {/* SEÇÃO: SWITCH DE STATUS PAGO/PENDENTE */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem 1rem', 
                backgroundColor: 'var(--surface-secondary)', 
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {type === 'expense' ? 'Despesa já está Paga' : (type === 'income' ? 'Receita já foi Recebida' : 'Transferência já Efetuada')}
              </span>
              <label className="theme-toggle-btn" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={status === 'confirmed'} 
                  onChange={(e) => setStatus(e.target.checked ? 'confirmed' : 'pending')}
                  style={{ 
                    opacity: 0, 
                    width: 0, 
                    height: 0 
                  }} 
                />
                <span 
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: status === 'confirmed' ? 'var(--income)' : 'rgba(255, 255, 255, 0.1)',
                    transition: '0.3s',
                    borderRadius: '24px',
                  }}
                >
                  <span 
                    style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px', width: '18px',
                      left: status === 'confirmed' ? '24px' : '4px',
                      bottom: '3px',
                      backgroundColor: status === 'confirmed' ? '#000' : '#fff',
                      transition: '0.3s',
                      borderRadius: '50%',
                    }}
                  />
                </span>
              </label>
            </div>

            {/* SEÇÃO: RECORRÊNCIA E PARCELAMENTO (Toggles Único, Parcelado ou Fixo) */}
            {type !== 'transfer' && !editingTransaction && (
              <div 
                style={{ 
                  border: '1px dashed var(--border)', 
                  borderRadius: '12px', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <label style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                  Recorrência do Lançamento
                </label>

                {/* Seletor de Tipo de Recorrência */}
                <div style={{ display: 'flex', backgroundColor: 'var(--surface)', padding: '0.2rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '8px',
                      backgroundColor: recurrenceType === 'single' ? 'var(--surface-secondary)' : 'transparent',
                      color: recurrenceType === 'single' ? 'var(--text)' : 'var(--text-secondary)',
                      boxShadow: recurrenceType === 'single' ? '0 2px 5px rgba(0,0,0,0.15)' : 'none'
                    }}
                    onClick={() => setRecurrenceType('single')}
                  >
                    Único
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '8px',
                      backgroundColor: recurrenceType === 'installment' ? 'var(--surface-secondary)' : 'transparent',
                      color: recurrenceType === 'installment' ? 'var(--text)' : 'var(--text-secondary)',
                      boxShadow: recurrenceType === 'installment' ? '0 2px 5px rgba(0,0,0,0.15)' : 'none'
                    }}
                    onClick={() => setRecurrenceType('installment')}
                  >
                    Parcelado
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '8px',
                      backgroundColor: recurrenceType === 'fixed' ? 'var(--surface-secondary)' : 'transparent',
                      color: recurrenceType === 'fixed' ? 'var(--text)' : 'var(--text-secondary)',
                      boxShadow: recurrenceType === 'fixed' ? '0 2px 5px rgba(0,0,0,0.15)' : 'none'
                    }}
                    onClick={() => setRecurrenceType('fixed')}
                  >
                    Fixo Mensal
                  </button>
                </div>

                {/* Opções específicas para Parcelado */}
                {recurrenceType === 'installment' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem', animation: 'fadeIn 0.2s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nº de Parcelas</label>
                        <input
                          type="number"
                          min="2"
                          max="60"
                          value={installmentCount}
                          onChange={(e) => setInstallmentCount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tipo</label>
                        <select
                          value={installmentType}
                          onChange={(e) => setInstallmentType(e.target.value)}
                        >
                          <option value="divide">Dividir valor total (1/N)</option>
                          <option value="repeat">Repetir valor cheio mensal</option>
                        </select>
                      </div>
                    </div>
                    
                    {amount && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Criação de {installmentCount} lançamentos mensais de{' '}
                        <strong>
                          R${' '}
                          {(installmentType === 'divide'
                            ? parseFloat(amount) / installmentCount
                            : parseFloat(amount)
                          ).toFixed(2)}
                        </strong>{' '}
                        cada.
                      </span>
                    )}
                  </div>
                )}

                {/* Confirmação para Fixo Mensal */}
                {recurrenceType === 'fixed' && (
                  <div style={{ padding: '0.25rem 0', animation: 'fadeIn 0.2s' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.4 }}>
                      Este lançamento se repetirá mensalmente pelos próximos **12 meses**. O primeiro mês será criado com o status selecionado acima, e os 11 meses futuros serão agendados como **Pendentes** (Não Pagos).
                    </span>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* RODAPÉ ERGONÔMICO COM MICROFONE CENTRALIZADO */}
          <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}>
              Cancelar
            </button>

            {/* Microfone no Centro */}
            {!editingTransaction && (
              <button 
                type="button" 
                onClick={toggleListening}
                className={`btn-icon ${isListening ? 'pulse-red' : ''}`}
                style={{ 
                  backgroundColor: isListening ? 'var(--expense)' : 'var(--surface-secondary)', 
                  color: isListening ? '#ffffff' : 'var(--primary)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s',
                  margin: '0 1rem'
                }}
                title="Gravar Lançamento por Voz"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}

            <button type="submit" className="btn btn-primary" style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}>
              <Check size={18} />
              {editingTransaction ? 'Salvar Edição' : (recurrenceType === 'installment' ? 'Lançar Parcelas' : (recurrenceType === 'fixed' ? 'Lançar Fixo' : 'Salvar'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
