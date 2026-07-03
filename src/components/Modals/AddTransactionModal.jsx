import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, CreditCard, Wallet, FileText, Check, Mic, MicOff, Sparkles, Send } from 'lucide-react';
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
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [paymentType, setPaymentType] = useState('account'); // account ou card
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');

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
          setSmartError('Permissão para microfone negada. Ative nas configurações do navegador.');
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
      setAmount(editingTransaction.amount ? String(editingTransaction.amount) : '');
      setDate(editingTransaction.date || '');
      setDescription(editingTransaction.description || '');
      setCategory(editingTransaction.category || 'Alimentação');
      
      if (editingTransaction.cardId) {
        setPaymentType('card');
        setCardId(editingTransaction.cardId);
        setAccountId('');
      } else {
        setPaymentType('account');
        setAccountId(editingTransaction.accountId || '');
        setCardId('');
      }
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
      setPaymentType('account');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setCardId(cards.length > 0 ? cards[0].id : '');
      setSmartText('');
      setSmartError('');
    }
  }, [editingTransaction, isOpen, accounts, cards]);

  // Se mudar o tipo para receita, definir forma de pagamento obrigatoriamente como conta
  useEffect(() => {
    if (type === 'income') {
      setPaymentType('account');
      if (category === 'Alimentação' || category === 'Transporte' || category === 'Moradia') {
        setCategory('Rendimentos');
      }
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
    } else {
      if (category === 'Rendimentos') {
        setCategory('Alimentação');
      }
    }
  }, [type, accounts]);

  if (!isOpen) return null;

  // Lançamento por Voz (microfone)
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
      setAmount(String(parsed.amount));
      setDescription(parsed.description);
      setDate(parsed.date);
      setCategory(parsed.category);
      setType(parsed.type);
      
      if (parsed.cardId) {
        setPaymentType('card');
        setCardId(parsed.cardId);
        setAccountId('');
      } else if (parsed.accountId) {
        setPaymentType('account');
        setAccountId(parsed.accountId);
        setCardId('');
      }
      setSmartError('');
    } else {
      setSmartError('Não identifiquei o valor. Diga ou digite ex: "Padaria 15 reais no dinheiro hoje"');
    }
  };

  const handleSmartSubmit = (e) => {
    e.preventDefault();
    handleProcessSmartText(smartText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description || !date) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const txData = {
      description,
      amount: parseFloat(amount),
      date,
      category,
      type,
      accountId: paymentType === 'account' ? accountId : null,
      cardId: paymentType === 'card' ? cardId : null,
      status: 'confirmed',
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

        {/* 1. SEÇÃO INTELIGENTE (FALE OU DIGITE) NO TOPO DO MODAL */}
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
                Fale ou digite para preencher os campos abaixo
              </span>
            </div>

            <form onSubmit={handleSmartSubmit} className="smart-input-container" style={{ padding: '0.25rem 0.5rem' }}>
              <button 
                type="button" 
                onClick={toggleListening}
                className={`btn-icon ${isListening ? 'pulse-red' : ''}`}
                style={{ 
                  backgroundColor: isListening ? 'var(--expense)' : 'var(--surface)', 
                  color: isListening ? '#ffffff' : 'var(--primary)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  transition: 'all 0.3s'
                }}
                title="Gravar por Voz"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input 
                type="text" 
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                placeholder={isListening ? "Escutando... Fale o valor, despesa e data" : "Diga ou digite ex: 'gasolina 80 reais Nubank ontem'"}
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Toggle Tipo: Receita vs Despesa */}
            <div style={{ display: 'flex', backgroundColor: 'var(--surface-secondary)', padding: '0.25rem', borderRadius: '12px' }}>
              <button
                type="button"
                className={`btn`}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: type === 'expense' ? 'var(--expense)' : 'transparent',
                  color: type === 'expense' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '10px',
                  padding: '0.5rem'
                }}
                onClick={() => setType('expense')}
              >
                Despesa
              </button>
              <button
                type="button"
                className={`btn`}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: type === 'income' ? 'var(--income)' : 'transparent',
                  color: type === 'income' ? '#000' : 'var(--text-secondary)',
                  borderRadius: '10px',
                  padding: '0.5rem'
                }}
                onClick={() => setType('income')}
              >
                Receita
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
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  placeholder="ex: Padaria, Uber, Almoço..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Data */}
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

              {/* Categoria */}
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
            </div>

            {/* Origem / Destino de Pagamento */}
            {type === 'expense' ? (
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
          </div>

          <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={18} />
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
