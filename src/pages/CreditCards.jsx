import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  CreditCard, 
  Calendar, 
  Wallet, 
  Plus, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  Lock,
  Edit2
} from 'lucide-react';

const MOBILLS_STYLES = `
  .mobills-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .mobills-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text);
  }
  .mobills-tab-container {
    display: flex;
    background-color: var(--surface-secondary);
    border-radius: 30px;
    padding: 3px;
    border: 1px solid var(--border);
  }
  .mobills-tab-btn {
    border: none;
    background: none;
    color: var(--text-secondary);
    padding: 0.5rem 1.25rem;
    border-radius: 27px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
  }
  .mobills-tab-btn.active {
    background-color: #00bfa5;
    color: #ffffff;
  }
  .mobills-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }
  @media (max-width: 968px) {
    .mobills-layout {
      grid-template-columns: 1fr;
    }
  }
  .mobills-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    align-content: start;
  }
  .mobills-add-card-btn {
    border: 2px dashed var(--border);
    border-radius: 20px;
    background-color: var(--surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    cursor: pointer;
    min-height: 220px;
    transition: all 0.2s;
  }
  .mobills-add-card-btn:hover {
    border-color: #00bfa5;
    background-color: var(--surface-secondary);
  }
  .mobills-add-card-icon-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  .mobills-add-card-btn:hover .mobills-add-card-icon-circle {
    border-color: #00bfa5;
    color: #00bfa5;
  }
  .mobills-add-card-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #00bfa5;
  }
  .mobills-card-widget {
    background-color: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 1.25rem;
    min-height: 220px;
    display: flex;
    flex-direction: column;
    position: relative;
    cursor: pointer;
    transition: all 0.25s;
  }
  .mobills-card-widget:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    border-color: rgba(0, 191, 165, 0.3);
  }
  .mobills-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .mobills-card-title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .mobills-card-brand-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  .mobills-card-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
  }
  .mobills-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .mobills-card-subtitle {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .mobills-card-subtitle.open {
    color: var(--text-secondary);
  }
  .mobills-card-subtitle.closed {
    color: #ff9800;
  }
  .mobills-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.825rem;
  }
  .mobills-card-row-label {
    color: var(--text-secondary);
  }
  .mobills-card-row-value-accent {
    font-weight: 700;
    color: #ff5252;
    font-size: 0.9rem;
  }
  .mobills-card-row-value-bold {
    font-weight: 700;
    color: var(--text);
  }
  .mobills-card-progress-bar-container {
    margin-top: auto;
    padding-top: 0.5rem;
  }
  .mobills-card-progress-bar-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  .mobills-card-progress-bar-track {
    height: 6px;
    background-color: var(--surface);
    border-radius: 3px;
    overflow: hidden;
    display: flex;
  }
  .mobills-card-progress-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
  }
  .mobills-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }
  .mobills-card-footer-limit {
    font-size: 0.7rem;
    color: var(--text-secondary);
  }
  .mobills-card-action-btn {
    background: none;
    border: none;
    color: #00bfa5;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .mobills-card-action-btn:hover {
    background-color: rgba(0, 191, 165, 0.08);
  }
  .mobills-summary-stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .mobills-summary-card {
    background-color: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .mobills-summary-card-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .mobills-summary-card-label {
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .mobills-summary-card-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
  }
  .mobills-summary-card-icon-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: rgba(0, 191, 165, 0.1);
    color: #00bfa5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Helper para desenhar logos de bandeira estilizados
const renderBrandLogo = (brand) => {
  const b = (brand || '').toLowerCase();
  switch (b) {
    case 'visa':
      return (
        <span style={{ 
          color: '#1a1f71', 
          fontStyle: 'italic', 
          fontWeight: 900, 
          fontSize: '0.8rem', 
          backgroundColor: '#ffffff', 
          padding: '0.15rem 0.4rem', 
          borderRadius: '4px',
          border: '1px solid #1a1f71',
          letterSpacing: '-0.5px',
          display: 'inline-block',
          lineHeight: 1
        }}>VISA</span>
      );
    case 'mastercard':
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eb001b', marginRight: '-5px' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f79e1b', opacity: 0.85 }} />
        </div>
      );
    case 'elo':
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', backgroundColor: '#000000', padding: '0.15rem 0.35rem', borderRadius: '4px', lineHeight: 1 }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#00a4e4' }} />
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ffc60b' }} />
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ed1c24' }} />
          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#ffffff' }}>elo</span>
        </div>
      );
    case 'amex':
      return (
        <span style={{ 
          color: '#ffffff', 
          fontWeight: 800, 
          fontSize: '0.625rem', 
          backgroundColor: '#016fd0', 
          padding: '0.15rem 0.35rem', 
          borderRadius: '4px',
          textTransform: 'uppercase',
          display: 'inline-block',
          lineHeight: 1
        }}>AMEX</span>
      );
    case 'hipercard':
      return (
        <span style={{ 
          color: '#ffffff', 
          fontWeight: 800, 
          fontSize: '0.625rem', 
          backgroundColor: '#cc0000', 
          padding: '0.15rem 0.35rem', 
          borderRadius: '4px',
          display: 'inline-block',
          lineHeight: 1
        }}>Hiper</span>
      );
    default:
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eb001b', marginRight: '-5px' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f79e1b', opacity: 0.85 }} />
        </div>
      );
  }
};

// Helper para calcular as datas do ciclo da fatura
export const getCardCycleRange = (card, year, month) => {
  const closingDay = card.closing_day || card.closingDay || 5;
  const dueDay = card.due_day || card.dueDay || 10;
  
  let startYear = year;
  let startMonth = month - 1; // Mês anterior
  let endYear = year;
  let endMonth = month; // Mês atual
  
  if (closingDay >= dueDay) {
    // Caso em que fecha no anterior e vence no seguinte (ex: fecha 25/Jun, vence 05/Jul)
    startMonth = month - 2;
    endMonth = month - 1;
  }
  
  const start = new Date(startYear, startMonth, closingDay + 1, 0, 0, 0);
  const end = new Date(endYear, endMonth, closingDay, 23, 59, 59);
  
  return { start, end };
};

export const CreditCards = ({ 
  cards = [], 
  accounts = [], 
  transactions = [], 
  onAddTransaction,
  onDeleteTransaction,
  onOpenAddModal,
  onDeleteCard,
  onOpenAddCardTx
}) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('open'); // 'open' ou 'closed'
  
  // Controle de Mês para Visualização Detalhada
  const [detailMonth, setDetailMonth] = useState(new Date().getMonth());
  const [detailYear, setDetailYear] = useState(new Date().getFullYear());
  
  // Para pagamento
  const [payingCardId, setPayingCardId] = useState(null);
  const [paymentAccount, setPaymentAccount] = useState('none');

  const today = new Date();
  const currentDay = today.getDate();

  // 1. Processar dados de cada cartão usando ciclos reais baseados no calendário
  const cardsWithData = cards.map(card => {
    const [colorPart, brandPart, accountPart] = (card.color || '').split('|');
    const brand = brandPart || 'mastercard';
    const linkedAccount = accountPart || 'none';
    const cardColor = colorPart || 'var(--primary)';

    const closingDay = card.closing_day || card.closingDay || 5;
    const dueDay = card.due_day || card.dueDay || 10;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Determinar as datas dos ciclos ABERTO e FECHADO com base no dia de hoje
    let openEnd, openStart, openMonthName;
    let closedEnd, closedStart, closedMonthName;
    
    if (currentDay <= closingDay) {
      // O fechamento do mês atual ainda não passou.
      // O ciclo aberto atual termina no fechamento deste mês.
      openEnd = new Date(currentYear, currentMonth, closingDay, 23, 59, 59);
      openStart = new Date(currentYear, currentMonth - 1, closingDay + 1, 0, 0, 0);
      openMonthName = MONTHS_BR[openEnd.getMonth()];
      
      // O ciclo fechado anterior terminou no mês passado
      closedEnd = new Date(currentYear, currentMonth - 1, closingDay, 23, 59, 59);
      closedStart = new Date(currentYear, currentMonth - 2, closingDay + 1, 0, 0, 0);
      closedMonthName = MONTHS_BR[closedEnd.getMonth()];
    } else {
      // O fechamento do mês atual já passou.
      // O ciclo aberto atual termina no fechamento do mês seguinte.
      openEnd = new Date(currentYear, currentMonth + 1, closingDay, 23, 59, 59);
      openStart = new Date(currentYear, currentMonth, closingDay + 1, 0, 0, 0);
      openMonthName = MONTHS_BR[openEnd.getMonth()];
      
      // O ciclo fechado anterior terminou neste mês
      closedEnd = new Date(currentYear, currentMonth, closingDay, 23, 59, 59);
      closedStart = new Date(currentYear, currentMonth - 1, closingDay + 1, 0, 0, 0);
      closedMonthName = MONTHS_BR[closedEnd.getMonth()];
    }

    // Calcular o total de compras no ciclo fechado
    const txsInClosedCycle = transactions.filter(tx => {
      if (tx.cardId !== card.id) return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      return txDate >= closedStart && txDate <= closedEnd;
    });
    const closedCycleTotal = txsInClosedCycle.reduce((sum, tx) => sum + tx.amount, 0);

    // Calcular o total de compras no ciclo aberto
    const txsInOpenCycle = transactions.filter(tx => {
      if (tx.cardId !== card.id) return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      return txDate >= openStart && txDate <= openEnd;
    });
    const openCycleTotal = txsInOpenCycle.reduce((sum, tx) => sum + tx.amount, 0);

    // Verificar se há pagamento da fatura fechada neste mês calendário
    const hasPayment = transactions.some(tx => 
      tx.type === 'expense' && 
      tx.description === `Pagamento Fatura - ${card.name}` && 
      new Date(tx.date + 'T00:00:00').getMonth() === currentMonth && 
      new Date(tx.date + 'T00:00:00').getFullYear() === currentYear
    );

    // A fatura é considerada "FECHADA" pendente se houver compras nela e não tiver sido paga
    const isClosed = closedCycleTotal > 0 && !hasPayment;

    // Se estiver fechada e pendente, o visor do card mostra os dados do ciclo fechado (para pagamento)
    // Se estiver paga ou se for zero, o visor mostra os dados do ciclo aberto (compras atuais)
    const activeCycleStart = isClosed ? closedStart : openStart;
    const activeCycleEnd = isClosed ? closedEnd : openEnd;
    const invoiceTotal = isClosed ? closedCycleTotal : openCycleTotal;
    const invoiceMonthName = isClosed ? closedMonthName : openMonthName;
    const availableLimit = card.limit - invoiceTotal;

    return {
      ...card,
      brand,
      linkedAccount,
      cardColor,
      closingDay,
      dueDay,
      invoiceTotal,
      availableLimit,
      isClosed,
      invoiceMonthName,
      cycleStart: activeCycleStart,
      cycleEnd: activeCycleEnd
    };
  });

  const openCards = cardsWithData.filter(c => !c.isClosed);
  const closedCards = cardsWithData.filter(c => c.isClosed);

  const handlePrevMonth = () => {
    if (detailMonth === 0) {
      setDetailMonth(11);
      setDetailYear(prev => prev - 1);
    } else {
      setDetailMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (detailMonth === 11) {
      setDetailMonth(0);
      setDetailYear(prev => prev + 1);
    } else {
      setDetailMonth(prev => prev + 1);
    }
  };

  const handlePayInvoiceSubmit = async (e, card, totalAmount) => {
    e.preventDefault();
    if (paymentAccount === 'none') {
      alert('Selecione uma conta bancária para efetuar o pagamento.');
      return;
    }

    const confirmPay = window.confirm(`Deseja efetuar o pagamento da fatura de ${card.name} no valor de ${formatCurrency(totalAmount)}?`);
    if (!confirmPay) return;

    // Criar uma despesa na conta bancária selecionada
    const paymentTx = {
      description: `Pagamento Fatura - ${card.name}`,
      amount: totalAmount,
      date: new Date().toISOString().split('T')[0],
      category: 'Outros',
      accountId: paymentAccount,
      cardId: null,
      destinationAccountId: null,
      type: 'expense',
      status: 'confirmed'
    };

    try {
      await onAddTransaction(paymentTx);
      alert('Pagamento da fatura lançado com sucesso!');
      setPayingCardId(null);
      setPaymentAccount('none');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar pagamento.');
    }
  };

  // RENDERIZAÇÃO 1: DETALHE DO CARTÃO SELECIONADO
  if (selectedCard) {
    const cardData = cardsWithData.find(c => c.id === selectedCard.id);
    
    // Obter ciclo para o mês/ano selecionado na navegação detalhada
    const { start, end } = getCardCycleRange(cardData, detailYear, detailMonth);
    
    const cycleTxs = transactions.filter(tx => {
      if (tx.cardId !== cardData.id) return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      return txDate >= start && txDate <= end;
    });

    const detailInvoiceTotal = cycleTxs.reduce((sum, tx) => sum + tx.amount, 0);

    // Verificar se existe pagamento registrado para essa fatura específica
    const hasPaymentTx = transactions.some(tx => 
      tx.type === 'expense' && 
      tx.description === `Pagamento Fatura - ${cardData.name}` && 
      new Date(tx.date + 'T00:00:00').getMonth() === detailMonth && 
      new Date(tx.date + 'T00:00:00').getFullYear() === detailYear
    );

    const isFuture = new Date(detailYear, detailMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
    const invoiceStatus = hasPaymentTx ? 'paid' : (isFuture ? 'future' : 'pending');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header de navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setSelectedCard(null)} className="btn btn-secondary btn-icon" style={{ padding: '0.5rem 0.8rem', borderRadius: '10px' }}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {renderBrandLogo(cardData.brand)}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{cardData.name}</h3>
          </div>
        </div>

        {/* Detalhes do Limite */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          
          {/* Card da Fatura */}
          <Card style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: cardData.cardColor }} />
            
            {/* Seletor de Meses da Fatura */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingLeft: '0.5rem' }}>
              <button onClick={handlePrevMonth} className="btn-icon">
                <ChevronLeft size={18} />
              </button>
              <strong style={{ fontSize: '0.95rem' }}>
                Fatura de {MONTHS_BR[detailMonth]} de {detailYear}
              </strong>
              <button onClick={handleNextMonth} className="btn-icon">
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ paddingLeft: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total da Fatura</span>
              <strong style={{ fontSize: '1.85rem', color: 'var(--expense)', fontWeight: 800 }}>
                {formatCurrency(detailInvoiceTotal)}
              </strong>
            </div>

            {/* Badges de Status */}
            <div style={{ paddingLeft: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              {invoiceStatus === 'paid' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--income)' }}>
                  <CheckCircle2 size={12} /> Fatura Paga
                </span>
              ) : invoiceStatus === 'future' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <Calendar size={12} /> Futura (Aberta)
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(255, 82, 82, 0.1)', color: 'var(--expense)' }}>
                  <AlertCircle size={12} /> Aguardando Pagamento
                </span>
              )}

              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                Vence dia {cardData.dueDay}
              </span>
            </div>
          </Card>

          {/* Card dos Limites */}
          <Card style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.2rem', textTransform: 'uppercase' }}>Limites do Cartão</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Limite Disponível</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--income)', fontWeight: 700 }}>
                  {formatCurrency(cardData.limit - detailInvoiceTotal)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Limite Total</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700 }}>
                  {formatCurrency(cardData.limit)}
                </strong>
              </div>
            </div>

            {/* Barra de Limite */}
            <div>
              <div style={{ height: '6px', backgroundColor: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min((detailInvoiceTotal / cardData.limit) * 100, 100)}%`, 
                    backgroundColor: cardData.cardColor,
                    transition: 'width 0.4s'
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Formulário / Ação de Pagamento */}
        {invoiceStatus === 'pending' && detailInvoiceTotal > 0 && (
          <Card style={{ padding: '1.25rem', backgroundColor: 'rgba(0, 230, 118, 0.02)', border: '1px dashed var(--income)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--income)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Wallet size={16} /> Pagar Fatura
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Ao pagar, o app lançará uma despesa na conta bancária correspondente para debitar do seu saldo.
            </p>

            {payingCardId === cardData.id ? (
              <form onSubmit={(e) => handlePayInvoiceSubmit(e, cardData, detailInvoiceTotal)} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Debitar da Conta</label>
                  <select 
                    value={paymentAccount} 
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    required
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  >
                    <option value="none">Selecione uma conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (Saldo: {formatCurrency(acc.balance)})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.825rem' }}>
                    Confirmar Pagamento
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setPayingCardId(null)} style={{ padding: '0.55rem 1rem', fontSize: '0.825rem' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => {
                  setPayingCardId(cardData.id);
                  setPaymentAccount(cardData.linkedAccount !== 'none' ? cardData.linkedAccount : 'none');
                }} 
                className="btn btn-primary" 
                style={{ width: 'fit-content', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
              >
                Lançar Pagamento de Fatura
              </button>
            )}
          </Card>
        )}

        {/* Lançamentos Detalhados da Fatura */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Compras nesta Fatura</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cycleTxs.length > 0 ? (
              cycleTxs.map(tx => (
                <div 
                  key={tx.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.85rem 1rem', 
                    borderRadius: '16px', 
                    backgroundColor: 'var(--surface-secondary)', 
                    border: '1px solid var(--border)' 
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--text)' }}>{tx.description}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {formatDate(tx.date)} • {tx.category} {tx.installmentNumber && `(${tx.installmentNumber}/${tx.totalInstallments})`}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <strong style={{ color: 'var(--expense)', fontSize: '0.95rem' }}>
                      -{formatCurrency(tx.amount)}
                    </strong>
                    <button 
                      onClick={() => {
                        if (window.confirm('Excluir esta compra irá reajustar o limite da fatura. Deseja continuar?')) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="btn-icon"
                      style={{ color: 'var(--expense)', padding: '0.25rem' }}
                      title="Excluir Lançamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                Nenhuma compra realizada nesta fatura.
              </div>
            )}
          </div>
        </div>
        
      </div>
    );
  }

  // Roteamento e dados da listagem da direita
  const getBestCardForToday = () => {
    if (openCards.length === 0) return 'Nenhum';
    let bestCard = openCards[0];
    let maxDays = -1;
    
    for (const card of openCards) {
      const closingDay = card.closingDay;
      let daysLeft = closingDay - currentDay;
      if (daysLeft < 0) {
        const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, closingDay);
        daysLeft = Math.round((nextMonthDate - today) / (1000 * 60 * 60 * 24));
      }
      if (daysLeft > maxDays) {
        maxDays = daysLeft;
        bestCard = card;
      }
    }
    return bestCard.name;
  };

  const getNextDueDate = () => {
    if (closedCards.length === 0) return 'Nenhuma pendente';
    const sorted = [...closedCards].sort((a, b) => new Date(a.cycleEnd) - new Date(b.cycleEnd));
    const card = sorted[0];
    if (!card.cycleEnd) return '';
    
    // Calcula vencimento
    const closingDay = card.closing_day || card.closingDay || 5;
    const dueDay = card.due_day || card.dueDay || 10;
    const end = new Date(card.cycleEnd);
    let dueMonth = end.getMonth();
    if (dueDay <= closingDay) {
      dueMonth = end.getMonth() + 1;
    }
    const d = new Date(end.getFullYear(), dueMonth, dueDay);
    return `${d.getDate()} de ${MONTHS_BR[d.getMonth()]} de ${d.getFullYear()}`;
  };

  const totalAvailableLimit = (activeTab === 'open' ? openCards : closedCards)
    .reduce((sum, c) => sum + c.availableLimit, 0);

  const totalInvoiceAmount = (activeTab === 'open' ? openCards : closedCards)
    .reduce((sum, c) => sum + c.invoiceTotal, 0);

  // RENDERIZAÇÃO 2: LISTAGEM GERAL DE CARTÕES (CLONE MOBILLS)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style dangerouslySetInnerHTML={{ __html: MOBILLS_STYLES }} />
      
      {/* Cabeçalho superior */}
      <div className="mobills-page-header">
        <h2 className="mobills-title">Cartões de crédito</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Segmented Control */}
          <div className="mobills-tab-container">
            <button 
              className={`mobills-tab-btn ${activeTab === 'open' ? 'active' : ''}`}
              onClick={() => setActiveTab('open')}
            >
              Faturas abertas
            </button>
            <button 
              className={`mobills-tab-btn ${activeTab === 'closed' ? 'active' : ''}`}
              onClick={() => setActiveTab('closed')}
            >
              Faturas fechadas
            </button>
          </div>
          
          {/* Botão Novo Cartão */}
          <button 
            onClick={() => onOpenAddModal('card')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 191, 165, 0.1)',
              color: '#00bfa5',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            title="Novo cartão de crédito"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Layout Grid principal */}
      <div className="mobills-layout">
        {/* Lado Esquerdo: Cards List */}
        <div className="mobills-cards-grid">
          {/* Card de adicionar novo */}
          <div className="mobills-add-card-btn" onClick={() => onOpenAddModal('card')}>
            <div className="mobills-add-card-icon-circle">+</div>
            <span className="mobills-add-card-text">Novo cartão de crédito</span>
          </div>
          
          {/* Lista de cartões */}
          {(activeTab === 'open' ? openCards : closedCards).map(card => {
            const percentageUsed = card.limit > 0 ? (card.invoiceTotal / card.limit) * 100 : 0;
            const end = card.cycleEnd ? new Date(card.cycleEnd) : null;
            
            // Formatador data fechamento
            let formattedCloseDate = '';
            if (end) {
              formattedCloseDate = `${end.getDate()} de ${MONTHS_BR[end.getMonth()]} de ${end.getFullYear()}`;
            }

            // Formatador data vencimento
            let formattedDueDate = '';
            if (end) {
              let dueMonth = end.getMonth();
              if (card.dueDay <= card.closingDay) {
                dueMonth = end.getMonth() + 1;
              }
              const d = new Date(end.getFullYear(), dueMonth, card.dueDay);
              formattedDueDate = `${d.getDate()} de ${MONTHS_BR[d.getMonth()]} de ${d.getFullYear()}`;
            }

            return (
              <div 
                key={card.id} 
                className="mobills-card-widget"
                onClick={() => setSelectedCard(card)}
              >
                {/* Linha colorida lateral esquerda */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: card.cardColor, borderRadius: '24px 0 0 24px' }} />
                
                {/* Header do Card */}
                <div className="mobills-card-header" style={{ paddingLeft: '0.5rem' }}>
                  <div className="mobills-card-title-group">
                    <span className="mobills-card-brand-label">{card.brand}</span>
                    <strong className="mobills-card-name">{card.name}</strong>
                  </div>
                  
                  {/* Dots / Menu de Ações */}
                  <div style={{ display: 'flex', gap: '0.15rem' }}>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddModal('card', card);
                      }}
                      style={{ padding: '0.2rem' }}
                      title="Editar Cartão"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Atenção: Excluir este cartão apagará todas as compras vinculadas a ele permanentemente. Continuar?')) {
                          onDeleteCard(card.id);
                        }
                      }}
                      style={{ padding: '0.2rem', color: 'var(--expense)' }}
                      title="Excluir Cartão"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                
                {/* Body do Card */}
                <div className="mobills-card-body" style={{ paddingLeft: '0.5rem' }}>
                  {activeTab === 'open' ? (
                    <>
                      <span className="mobills-card-subtitle open">Fatura aberta</span>
                      <div className="mobills-card-row">
                        <span className="mobills-card-row-label">Valor parcial</span>
                        <span className="mobills-card-row-value-accent">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(card.invoiceTotal)}</span>
                      </div>
                      <div className="mobills-card-row">
                        <span className="mobills-card-row-label">Fecha em</span>
                        <span className="mobills-card-row-value-bold" style={{ fontSize: '0.78rem' }}>{formattedCloseDate || `${card.closingDay} de ${card.invoiceMonthName}`}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="mobills-card-subtitle closed" style={{ color: '#ff9800' }}>Fatura vencida</span>
                      <div className="mobills-card-row">
                        <span className="mobills-card-row-label">Valor total</span>
                        <span className="mobills-card-row-value-accent">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(card.invoiceTotal)}</span>
                      </div>
                      <div className="mobills-card-row">
                        <span className="mobills-card-row-label">Venceu em</span>
                        <span className="mobills-card-row-value-bold" style={{ fontSize: '0.78rem' }}>{formattedDueDate}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Barra de Progresso do Limite */}
                  <div className="mobills-card-progress-bar-container">
                    <div className="mobills-card-progress-bar-text">
                      <span>R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(card.invoiceTotal)} de R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(card.limit)}</span>
                      <span>{percentageUsed.toFixed(2)}%</span>
                    </div>
                    <div className="mobills-card-progress-bar-track">
                      <div 
                        className="mobills-card-progress-bar-fill" 
                        style={{ width: `${Math.min(percentageUsed, 100)}%`, backgroundColor: card.cardColor }} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Footer com Limite e Ação */}
                <div className="mobills-card-footer" style={{ paddingLeft: '0.5rem' }}>
                  <span className="mobills-card-footer-limit">
                    Limite Disponível R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(card.availableLimit)}
                  </span>
                  
                  {activeTab === 'open' ? (
                    <button 
                      className="mobills-card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddCardTx(); // Abre o modal de despesa do cartão
                      }}
                    >
                      Adicionar Despesa
                    </button>
                  ) : (
                    <button 
                      className="mobills-card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCard(card);
                        setPayingCardId(card.id);
                        setPaymentAccount(card.linkedAccount !== 'none' ? card.linkedAccount : 'none');
                      }}
                    >
                      Pagar Fatura
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Lado Direito: Summary Widgets */}
        <div className="mobills-summary-stack">
          {/* Widget 1: Melhor Cartão ou Próximo Vencimento */}
          <div className="mobills-summary-card">
            <div className="mobills-summary-card-info">
              <span className="mobills-summary-card-label">
                {activeTab === 'open' ? 'O melhor cartão para comprar hoje é' : 'Sua próxima fatura vence em'}
              </span>
              <strong className="mobills-summary-card-value" style={{ fontSize: '1rem' }}>
                {activeTab === 'open' ? getBestCardForToday() : getNextDueDate()}
              </strong>
            </div>
            <div className="mobills-summary-card-icon-circle">
              <CreditCard size={18} />
            </div>
          </div>
          
          {/* Widget 2: Limite Disponível Total */}
          <div className="mobills-summary-card">
            <div className="mobills-summary-card-info">
              <span className="mobills-summary-card-label">Limite Disponível</span>
              <strong className="mobills-summary-card-value">
                {formatCurrency(totalAvailableLimit)}
              </strong>
            </div>
            <div className="mobills-summary-card-icon-circle">
              <Wallet size={18} />
            </div>
          </div>
          
          {/* Widget 3: Valor Total de Faturas */}
          <div className="mobills-summary-card">
            <div className="mobills-summary-card-info">
              <span className="mobills-summary-card-label">Valor total</span>
              <strong className="mobills-summary-card-value">
                {formatCurrency(totalInvoiceAmount)}
              </strong>
            </div>
            <div className="mobills-summary-card-icon-circle">
              <span style={{ fontWeight: 'bold' }}>$</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
