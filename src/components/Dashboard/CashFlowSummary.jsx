import React from 'react';
import { Card } from '../UI/Card';
import { formatCurrency } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';

export const CashFlowSummary = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filtrar lançamentos do mês atual
  const currentMonthTx = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const isPositive = netBalance >= 0;

  // Porcentagem de gastos sobre receitas
  const spentPercentage = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <Card className="col-6" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Balanço Mensal</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Receitas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '16px', backgroundColor: 'var(--surface-secondary)' }}>
            <div style={{ padding: '0.5rem', borderRadius: '12px', backgroundColor: 'var(--income-glow)', color: 'var(--income)' }}>
              <ArrowUpRight size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Receitas</span>
              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--income)' }}>
                {formatCurrency(totalIncome)}
              </strong>
            </div>
          </div>

          {/* Despesas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '16px', backgroundColor: 'var(--surface-secondary)' }}>
            <div style={{ padding: '0.5rem', borderRadius: '12px', backgroundColor: 'var(--expense-glow)', color: 'var(--expense)' }}>
              <ArrowDownRight size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Despesas</span>
              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--expense)' }}>
                {formatCurrency(totalExpense)}
              </strong>
            </div>
          </div>
        </div>

        {/* Resumo de Sobra */}
        <div style={{ padding: '1rem', borderRadius: '16px', backgroundColor: isPositive ? 'var(--income-glow)' : 'var(--expense-glow)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isPositive ? 'Resultado (Economia)' : 'Resultado (Déficit)'}
          </span>
          <strong style={{ display: 'block', fontSize: '1.25rem', color: isPositive ? 'var(--income)' : 'var(--expense)' }}>
            {formatCurrency(netBalance)}
          </strong>
        </div>
      </div>

      {/* Progress Bars */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 500 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Porcentagem de Renda Gasta</span>
          <span>{spentPercentage.toFixed(1)}%</span>
        </div>
        <div style={{ height: '8px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.2rem' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${Math.min(spentPercentage, 100)}%`, 
              backgroundColor: spentPercentage > 90 ? 'var(--expense)' : (spentPercentage > 60 ? 'var(--warning)' : 'var(--primary)'),
              borderRadius: '4px',
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>

        {totalIncome > 0 && isPositive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Percent size={14} className="text-income" />
            <span>Você economizou <strong>{savingsRate.toFixed(1)}%</strong> de seus ganhos totais este mês!</span>
          </div>
        )}
      </div>
    </Card>
  );
};
