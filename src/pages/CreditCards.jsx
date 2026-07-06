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
  onDeleteCard
}) => {
  const [selectedCard, setSelectedCard] = useState(null);
  
  // Controle de Mês para Visualização Detalhada
  const [detailMonth, setDetailMonth] = useState(new Date().getMonth());
  const [detailYear, setDetailYear] = useState(new Date().getFullYear());
  
  // Para pagamento
  const [payingCardId, setPayingCardId] = useState(null);
  const [paymentAccount, setPaymentAccount] = useState('none');

  const today = new Date();
  const currentDay = today.getDate();

  // 1. Processar dados de cada cartão
  const cardsWithData = cards.map(card => {
    const [colorPart, brandPart, accountPart] = (card.color || '').split('|');
    const brand = brandPart || 'mastercard';
    const linkedAccount = accountPart || 'none';
    const cardColor = colorPart || 'var(--primary)';

    const closingDay = card.closing_day || card.closingDay || 5;
    const dueDay = card.due_day || card.dueDay || 10;

    // A. Calcular ciclo para o mês atual
    const currentCycle = getCardCycleRange(card, today.getFullYear(), today.getMonth());
    const txsInCurrentCycle = transactions.filter(tx => {
      if (tx.cardId !== card.id) return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      return txDate >= currentCycle.start && txDate <= currentCycle.end;
    });
    const currentCycleTotal = txsInCurrentCycle.reduce((sum, tx) => sum + tx.amount, 0);

    // B. Verificar se o fechamento já passou no mês atual e se a fatura foi paga
    const isClosingPassed = currentDay > closingDay;
    const hasPayment = transactions.some(tx => 
      tx.type === 'expense' && 
      tx.description === `Pagamento Fatura - ${card.name}` && 
      new Date(tx.date + 'T00:00:00').getMonth() === today.getMonth() && 
      new Date(tx.date + 'T00:00:00').getFullYear() === today.getFullYear()
    );

    // Se o fechamento passou, tem compras acumuladas e não foi paga, a fatura está FECHADA
    const isClosed = isClosingPassed && currentCycleTotal > 0 && !hasPayment;

    // Determinar qual ciclo e total exibir no card da dashboard
    let activeCycle = currentCycle;
    let invoiceTotal = currentCycleTotal;

    if (isClosingPassed && (currentCycleTotal === 0 || hasPayment)) {
      // O fechamento passou, mas está paga ou vazia: mostrar o ciclo seguinte (Fatura Aberta ativa agora)
      activeCycle = getCardCycleRange(card, today.getFullYear(), today.getMonth() + 1);
      const txsInNextCycle = transactions.filter(tx => {
        if (tx.cardId !== card.id) return false;
        const txDate = new Date(tx.date + 'T00:00:00');
        return txDate >= activeCycle.start && txDate <= activeCycle.end;
      });
      invoiceTotal = txsInNextCycle.reduce((sum, tx) => sum + tx.amount, 0);
    }

    const availableLimit = card.limit - invoiceTotal;
    const invoiceMonthName = MONTHS_BR[activeCycle.end.getMonth()];

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
      cycleStart: activeCycle.start,
      cycleEnd: activeCycle.end
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

  // RENDERIZAÇÃO 2: LISTAGEM GERAL DE CARTÕES
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. SEÇÃO: FATURAS ABERTAS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard className="text-income" size={20} />
            Faturas Abertas ({openCards.length})
          </h3>
          <button 
            className="btn btn-secondary" 
            onClick={() => onOpenAddModal('card')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Novo Cartão</span>
          </button>
        </div>

        {openCards.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {openCards.map(card => (
              <Card 
                key={card.id} 
                onClick={() => setSelectedCard(card)}
                style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
                className="card-meta-add-hover"
              >
                {/* Linha colorida lateral */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: card.cardColor }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block' }}>{card.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'block', marginTop: '0.15rem' }}>
                      Fatura de {card.invoiceMonthName}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                      <Calendar size={12} /> Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {renderBrandLogo(card.brand)}
                    
                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      <button 
                        className="btn-icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddModal('card', card);
                        }}
                        style={{ padding: '0.3rem' }}
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
                        style={{ padding: '0.3rem', color: 'var(--expense)' }}
                        title="Excluir Cartão"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fatura Parcial</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--expense)' }}>{formatCurrency(card.invoiceTotal)}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Limite Disponível</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--income)' }}>{formatCurrency(card.availableLimit)}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '18px', fontStyle: 'italic', fontSize: '0.85rem' }}>
            Nenhum cartão com fatura aberta.
          </div>
        )}
      </div>

      {/* 2. SEÇÃO: FATURAS FECHADAS */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
          <Lock className="text-expense" size={20} />
          Faturas Fechadas ({closedCards.length})
        </h3>

        {closedCards.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {closedCards.map(card => (
              <Card 
                key={card.id} 
                onClick={() => setSelectedCard(card)}
                style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.85rem', border: '1px solid rgba(255, 82, 82, 0.15)' }}
                className="card-meta-add-hover"
              >
                {/* Linha colorida lateral */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: card.cardColor }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block' }}>{card.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--expense)', fontWeight: 600, display: 'block', marginTop: '0.15rem' }}>
                      Fatura de {card.invoiceMonthName} (Fechada)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                      <Calendar size={12} /> Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {renderBrandLogo(card.brand)}
                    
                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      <button 
                        className="btn-icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddModal('card', card);
                        }}
                        style={{ padding: '0.3rem' }}
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
                        style={{ padding: '0.3rem', color: 'var(--expense)' }}
                        title="Excluir Cartão"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Valor Fechado</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--expense)' }}>{formatCurrency(card.invoiceTotal)}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Limite Disponível</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--income)' }}>{formatCurrency(card.availableLimit)}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '18px', fontStyle: 'italic', fontSize: '0.85rem' }}>
            Nenhum cartão com fatura fechada no momento.
          </div>
        )}
      </div>

    </div>
  );
};
