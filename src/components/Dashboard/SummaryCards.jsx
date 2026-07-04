import React from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { Card } from '../UI/Card';
import { formatCurrency } from '../../utils/formatters';

export const SummaryCards = ({ accounts, cards, transactions }) => {
  // 1. Saldo Geral de Contas
  const totalAccountsBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // 2. Faturas de Cartão
  const totalInvoices = cards.reduce((acc, curr) => acc + curr.invoice, 0);

  // Lançamentos do mês corrente
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter(tx => {
    const txDate = new Date(tx.date + 'T00:00:00');
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  // 3. Receitas e Despesas do Mês (Somar apenas CONFIRMADOS para contas bancárias)
  const totalIncome = currentMonthTx
    .filter(tx => tx.type === 'income' && tx.status === 'confirmed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = currentMonthTx
    .filter(tx => tx.type === 'expense' && (tx.cardId || tx.status === 'confirmed'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Card className="col-12" style={{ padding: '1.25rem', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Saldo Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Saldo Geral Disponível
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.15rem', letterSpacing: '-0.5px' }}>
            {formatCurrency(totalAccountsBalance)}
          </h2>
        </div>
        <div 
          style={{ 
            backgroundColor: 'var(--primary-glow)', 
            color: 'var(--primary)', 
            padding: '0.6rem', 
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Wallet size={22} />
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* Grade de Sub-Resumos Otimizada (Flexível e Responsiva) */}
      <div className="summary-grid-layout">
        
        {/* Receitas */}
        <div className="summary-grid-item">
          <div className="summary-item-icon-wrapper" style={{ backgroundColor: 'var(--income-glow)', color: 'var(--income)' }}>
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="summary-item-label">Receitas (Mês)</span>
            <strong className="summary-item-value text-income">{formatCurrency(totalIncome)}</strong>
          </div>
        </div>

        {/* Despesas */}
        <div className="summary-grid-item">
          <div className="summary-item-icon-wrapper" style={{ backgroundColor: 'var(--expense-glow)', color: 'var(--expense)' }}>
            <TrendingDown size={16} />
          </div>
          <div>
            <span className="summary-item-label">Despesas (Mês)</span>
            <strong className="summary-item-value text-expense">{formatCurrency(totalExpense)}</strong>
          </div>
        </div>

        {/* Faturas de Cartão */}
        <div className="summary-grid-item">
          <div className="summary-item-icon-wrapper" style={{ backgroundColor: 'rgba(255, 179, 0, 0.1)', color: 'var(--warning)' }}>
            <CreditCard size={16} />
          </div>
          <div>
            <span className="summary-item-label">Faturas de Cartão</span>
            <strong className="summary-item-value" style={{ color: 'var(--warning)' }}>{formatCurrency(totalInvoices)}</strong>
          </div>
        </div>

      </div>
    </Card>
  );
};
