import React from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { Card } from '../UI/Card';
import { formatCurrency } from '../../utils/formatters';

export const SummaryCards = ({ accounts, cards, transactions }) => {
  // 1. Saldo de Contas
  const totalAccountsBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // 2. Faturas de Cartão
  const totalInvoices = cards.reduce((acc, curr) => acc + curr.invoice, 0);

  // Obter transações do mês corrente
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  // 3. Receitas e Despesas do Mês
  const totalIncome = currentMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const cardData = [
    {
      title: 'Saldo em Contas',
      value: totalAccountsBalance,
      icon: Wallet,
      color: 'var(--primary)',
      bg: 'var(--primary-glow)',
      description: 'Disponível para uso imediato'
    },
    {
      title: 'Receitas (Mês)',
      value: totalIncome,
      icon: TrendingUp,
      color: 'var(--income)',
      bg: 'var(--income-glow)',
      description: 'Ganhos acumulados no mês'
    },
    {
      title: 'Despesas (Mês)',
      value: totalExpense,
      icon: TrendingDown,
      color: 'var(--expense)',
      bg: 'var(--expense-glow)',
      description: 'Gastos acumulados no mês'
    },
    {
      title: 'Faturas de Cartão',
      value: totalInvoices,
      icon: CreditCard,
      color: 'var(--warning)',
      bg: 'rgba(255, 179, 0, 0.1)',
      description: 'Total a pagar nos cartões'
    }
  ];

  return (
    <>
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="col-3">
            <Card className="summary-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '130px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {card.title}
                </span>
                <div 
                  style={{ 
                    backgroundColor: card.bg, 
                    color: card.color, 
                    padding: '0.4rem', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                  {formatCurrency(card.value)}
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                  {card.description}
                </span>
              </div>
            </Card>
          </div>
        );
      })}
    </>
  );
};
