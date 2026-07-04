import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const PRESET_COLORS = [
  '#8A05BE', // Nubank Roxo
  '#EC7000', // Itaú Laranja
  '#004B87', // Itaú Click Azul
  '#2E7D32', // Dinheiro Verde
  '#00b0ff', // Azul Claro
  '#00e676', // Mobills Verde
  '#ff3d00', // Vermelho/Laranja
  '#7289da', // Blurple
  '#37474f'  // Escuro/Cinza
];

export const AddAccountCardModal = ({ isOpen, onClose, onSave, type, editingItem }) => {
  // Campos de Conta
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');
  const [accType, setAccType] = useState('checking');
  const [accColor, setAccColor] = useState(PRESET_COLORS[0]);

  // Campos de Cartão
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardInvoice, setCardInvoice] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState(5);
  const [cardDueDay, setCardDueDay] = useState(10);
  const [cardColor, setCardColor] = useState(PRESET_COLORS[0]);

  const handleMoneyChange = (val, setter) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      setter('');
      return;
    }
    const numericValue = parseFloat(digits) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
    setter(formatted);
  };

  const parseMoney = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  useEffect(() => {
    const formatValue = (num) => {
      if (num === undefined || num === null) return '';
      return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    if (editingItem) {
      if (type === 'account') {
        setAccName(editingItem.name || '');
        setAccBalance(formatValue(editingItem.balance));
        setAccType(editingItem.type || 'checking');
        setAccColor(editingItem.color || PRESET_COLORS[0]);
      } else if (type === 'card') {
        setCardName(editingItem.name || '');
        setCardLimit(formatValue(editingItem.limit));
        setCardInvoice(formatValue(editingItem.invoice));
        setCardClosingDay(editingItem.closingDay || 5);
        setCardDueDay(editingItem.dueDay || 10);
        setCardColor(editingItem.color || PRESET_COLORS[0]);
      }
    } else {
      // Limpar campos para nova adição
      setAccName('');
      setAccBalance('');
      setAccType('checking');
      setAccColor(PRESET_COLORS[0]);

      setCardName('');
      setCardLimit('');
      setCardInvoice('0,00');
      setCardClosingDay(5);
      setCardDueDay(10);
      setCardColor(PRESET_COLORS[0]);
    }
  }, [editingItem, type, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (type === 'account') {
      if (!accName || accBalance === '') {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      onSave({
        name: accName,
        balance: parseMoney(accBalance),
        type: accType,
        color: accColor
      });
    } else {
      if (!cardName || cardLimit === '') {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      onSave({
        name: cardName,
        limit: parseMoney(cardLimit),
        invoice: parseMoney(cardInvoice || 0),
        closingDay: parseInt(cardClosingDay),
        dueDay: parseInt(cardDueDay),
        color: cardColor
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {editingItem ? 'Editar' : 'Adicionar'}{' '}
            {type === 'account' ? 'Conta Bancária' : 'Cartão de Crédito'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {type === 'account' ? (
              /* CAMPOS PARA CONTA */
              <>
                <div>
                  <label>Nome da Conta*</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Itaú Corrente, Minha Carteira"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Saldo Inicial (R$)*</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={accBalance}
                      disabled={!!editingItem} // Evitar alteração arbitrária de saldo em edição para não bagunçar histórico
                      onChange={(e) => handleMoneyChange(e.target.value, setAccBalance)}
                    />
                  </div>
                  <div>
                    <label>Tipo de Conta</label>
                    <select value={accType} onChange={(e) => setAccType(e.target.value)}>
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Poupança</option>
                      <option value="cash">Dinheiro em Espécie</option>
                    </select>
                  </div>
                </div>

                {/* Escolha de Cor */}
                <div>
                  <label>Cor de Identificação</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccColor(c)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: accColor === c ? '3px solid var(--text)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: accColor === c ? '0 0 8px rgba(0,0,0,0.3)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* CAMPOS PARA CARTÃO */
              <>
                <div>
                  <label>Nome do Cartão*</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank Black, Inter Gold"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Limite Total (R$)*</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      value={cardLimit}
                      onChange={(e) => handleMoneyChange(e.target.value, setCardLimit)}
                    />
                  </div>
                  <div>
                    <label>Fatura Atual (R$)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={cardInvoice}
                      disabled={!!editingItem} // Saldo da fatura é atualizado pelas transações
                      onChange={(e) => handleMoneyChange(e.target.value, setCardInvoice)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Dia de Fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={cardClosingDay}
                      onChange={(e) => setCardClosingDay(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Dia de Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={cardDueDay}
                      onChange={(e) => setCardDueDay(e.target.value)}
                    />
                  </div>
                </div>

                {/* Escolha de Cor */}
                <div>
                  <label>Cor do Cartão</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCardColor(c)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: cardColor === c ? '3px solid var(--text)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: cardColor === c ? '0 0 8px rgba(0,0,0,0.3)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={18} />
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
