import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, CreditCard, FileText, Check, Mic, MicOff, Sparkles, Send } from 'lucide-react';
import { parseSmartInput } from '../../utils/smartParser';
import { getCardCycleRange } from '../../pages/CreditCards';
import { formatCurrency } from '../../utils/formatters';

const MONTHS_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const AddCardTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  cards = [], 
  customCategories = [] 
}) => {
  const allCategories = [
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
    'Outros',
    ...customCategories
  ];

  // Estados do Formulário
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [cardId, setCardId] = useState('');
  
  // Fatura Target ('auto' ou 'YYYY-MM')
  const [invoiceTarget, setInvoiceTarget] = useState('auto');

  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);

  // Voz / Inteligência
  const [smartText, setSmartText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [smartError, setSmartError] = useState('');

  // Setup Voz
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
      rec.onerror = (e) => {
        setIsListening(false);
        setSmartError('Falha ao capturar voz. Tente digitar.');
      };
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSmartText(transcript);
        handleProcessSmartText(transcript);
      };
      setRecognition(rec);
    }
  }, []);

  // Preencher cartão padrão na abertura se houver cartões
  useEffect(() => {
    if (isOpen && cards.length > 0 && !cardId) {
      setCardId(cards[0].id);
    }
  }, [isOpen, cards, cardId]);

  if (!isOpen) return null;

  const handleMoneyChange = (val) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      setAmount('');
      return;
    }
    const numericValue = parseFloat(digits) / 100;
    setAmount(new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue));
  };

  const parseMoney = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  // Processar texto inteligente
  const handleProcessSmartText = (text) => {
    if (!text) return;
    const res = parseSmartInput(text, [], cards); // passa lista de cartões para bater nomes

    if (res.amount) {
      setAmount(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(res.amount));
    }
    if (res.description) setDescription(res.description);
    if (res.category) {
      const match = allCategories.find(c => c.toLowerCase() === res.category.toLowerCase());
      if (match) setCategory(match);
    }
    if (res.cardId) setCardId(res.cardId);
    if (res.isInstallment) {
      setIsInstallment(true);
      setInstallmentsCount(res.installmentCount);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      setSmartText('');
      setSmartError('');
      try {
        recognition?.start();
      } catch (err) {
        setSmartError('Microfone ocupado ou indisponível.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmount = parseMoney(amount);

    if (finalAmount <= 0) {
      alert('Por favor, preencha um valor válido maior que R$ 0,00.');
      return;
    }
    if (!cardId) {
      alert('Selecione um cartão de crédito.');
      return;
    }

    const selectedCard = cards.find(c => c.id === cardId);
    let finalDate = date;

    // Se o usuário selecionou uma fatura forçada
    if (invoiceTarget !== 'auto' && selectedCard) {
      const [targetYear, targetMonth] = invoiceTarget.split('-').map(Number);
      
      // Ciclo correspondente àquela fatura
      const { start, end } = getCardCycleRange(selectedCard, targetYear, targetMonth - 1);
      
      // Ajustamos a data para cair no meio do ciclo daquela fatura (ex: end - 2 dias)
      const adjustedDate = new Date(end.getTime());
      adjustedDate.setDate(adjustedDate.getDate() - 2);
      
      finalDate = adjustedDate.toISOString().split('T')[0];
    }

    const txPayload = {
      description: description || 'Compra no Cartão',
      amount: finalAmount,
      date: finalDate,
      category,
      accountId: null,
      cardId,
      destinationAccountId: null,
      type: 'expense',
      status: 'confirmed',
      isInstallment,
      recurrenceType: isInstallment ? 'installment' : 'single',
      installmentCount: isInstallment ? installmentsCount : 1,
      installmentType: 'divide' // divide o valor total pelas parcelas
    };

    onSave(txPayload);
    
    // Limpar formulário
    setAmount('');
    setDescription('');
    setCategory('Alimentação');
    setInvoiceTarget('auto');
    setIsInstallment(false);
    onClose();
  };

  // Gerar as opções de faturas futuras (próximos 6 meses)
  const getInvoiceOptions = () => {
    const options = [];
    const baseDate = new Date();
    for (let i = 0; i < 6; i++) {
      const future = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const val = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}`;
      const label = `Fatura de ${MONTHS_LABEL[future.getMonth()]} de ${future.getFullYear()}`;
      options.push({ val, label });
    }
    return options;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={20} className="text-expense" />
            <span>Nova Compra no Cartão</span>
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Input de Valor */}
            <div>
              <label>Valor da Compra*</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-secondary)' }}>R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => handleMoneyChange(e.target.value)}
                  style={{
                    paddingLeft: '2.5rem',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--expense)'
                  }}
                />
              </div>
            </div>

            {/* Descrição e Data */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Descrição*</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado, Gasolina"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label>Data da Compra</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Categoria e Cartão */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Qual Cartão de Crédito?</label>
                <select value={cardId} onChange={(e) => setCardId(e.target.value)} required>
                  {cards.map(card => {
                    const [colorVal] = (card.color || '').split('|');
                    return (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Lançamento em Fatura Específica */}
            <div>
              <label>Lançar em qual fatura?</label>
              <select value={invoiceTarget} onChange={(e) => setInvoiceTarget(e.target.value)}>
                <option value="auto">Automático (Pela data da compra)</option>
                {getInvoiceOptions().map(opt => (
                  <option key={opt.val} value={opt.val}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Opções de Parcelamento */}
            <div style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label htmlFor="isInstallment" style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, cursor: 'pointer', flex: 1, userSelect: 'none' }}>
                  Compra Parcelada?
                </label>
                <input
                  type="checkbox"
                  id="isInstallment"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer' }}
                />
              </div>
              {isInstallment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Número de Parcelas:</span>
                  <input
                    type="number"
                    min="2"
                    max="96"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 2)}
                    style={{ width: '80px', padding: '0.4rem' }}
                  />
                  {amount && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                      {installmentsCount}x de {formatCurrency(parseMoney(amount) / installmentsCount)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Preenchimento Rápido / Voz */}
            <div className="voice-intelligent-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Sparkles size={14} className="text-income" /> Preenchimento rápido inteligente
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Diga: 'Cerveja 45 reais no Nubank'"
                  value={smartText}
                  onChange={(e) => setSmartText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleProcessSmartText(smartText);
                    }
                  }}
                  style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                />

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn-icon ${isListening ? 'listening' : ''}`}
                  style={{
                    backgroundColor: isListening ? 'rgba(255, 82, 82, 0.15)' : 'var(--surface-secondary)',
                    color: isListening ? 'var(--expense)' : 'var(--text)',
                    border: '1px solid var(--border)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isListening ? "Parar de Escutar" : "Falar Lançamento"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleProcessSmartText(smartText)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Send size={14} />
                </button>
              </div>

              {smartError && <span style={{ fontSize: '0.7rem', color: 'var(--expense)' }}>{smartError}</span>}
            </div>

          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
              Confirmar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
