import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, CreditCard, Wallet, FileText, Check } from 'lucide-react';

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
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [paymentType, setPaymentType] = useState('account'); // account ou card
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');

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
    }
  }, [editingTransaction, isOpen, accounts, cards]);

  // Se mudar o tipo para receita, definir forma de pagamento obrigatoriamente como conta
  useEffect(() => {
    if (type === 'income') {
      setPaymentType('account');
      setCategory('Rendimentos');
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
                  style={{ paddingLeft: '2.5rem', fontSize: '1.1rem', fontWeight: 700 }}
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
                  placeholder="ex: Mercadinho da esquina"
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

          <div className="modal-footer">
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
