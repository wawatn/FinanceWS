import React from 'react';
import { Card } from '../UI/Card';
import { formatCurrency } from '../../utils/formatters';

export const SummaryCards = ({ accounts, cards, transactions }) => {
  // 1. Saldo Geral de Contas
  const totalAccountsBalance = accounts
    .filter(acc => {
      const [_, option] = (acc.color || '').split('|');
      return option !== 'noSum';
    })
    .reduce((acc, curr) => acc + curr.balance, 0);

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
    <Card className="col-12" style={{ padding: '1.5rem', marginBottom: '0.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Saldo Geral e Faturas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Saldo em Contas
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem', letterSpacing: '-0.5px' }}>
            {formatCurrency(totalAccountsBalance)}
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Faturas de Cartão
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.2rem' }}>
            {formatCurrency(totalInvoices)}
          </h3>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* Grid Simplificado Sem Bordas Internas (Receitas vs Despesas) */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        
        {/* Receitas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>
            Receitas do Mês
          </span>
          <strong className="text-income" style={{ fontSize: '1.15rem', fontWeight: 700, display: 'block', marginTop: '0.15rem' }}>
            {formatCurrency(totalIncome)}
          </strong>
        </div>

        {/* Linha Divisora */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', flexShrink: 0 }} />

        {/* Despesas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>
            Despesas do Mês
          </span>
          <strong className="text-expense" style={{ fontSize: '1.15rem', fontWeight: 700, display: 'block', marginTop: '0.15rem' }}>
            {formatCurrency(totalExpense)}
          </strong>
        </div>

      </div>
    </Card>
  );
};
