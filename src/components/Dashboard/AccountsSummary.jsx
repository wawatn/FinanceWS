import React from 'react';
import { Card } from '../UI/Card';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AccountsSummary = ({ accounts, transactions, onManage }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calcular Entradas/Saídas de cada conta no mês atual
  const getAccountMonthlyStats = (accountId) => {
    const monthTx = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && 
             txDate.getFullYear() === currentYear;
    });

    const incomes = monthTx
      .filter(tx => tx.type === 'income' && tx.accountId === accountId)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = monthTx
      .filter(tx => tx.type === 'expense' && tx.accountId === accountId)
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { incomes, expenses };
  };

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 'checking': return 'Corrente';
      case 'savings': return 'Poupança';
      case 'cash': return 'Dinheiro';
      default: return 'Conta';
    }
  };

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Resumo por Contas</h3>
        <button 
          onClick={onManage} 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
        >
          Contas
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {accounts.length > 0 ? (
          accounts.map((account) => {
            const { incomes, expenses } = getAccountMonthlyStats(account.id);
            const [colorPart, optionPart] = (account.color || '').split('|');
            const accountColor = colorPart || 'var(--primary)';
            
            return (
              <div 
                key={account.id} 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '18px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--surface-secondary)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Linha decorativa colorida na lateral esquerda */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    width: '6px', 
                    backgroundColor: accountColor 
                  }} 
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wallet size={16} style={{ color: accountColor }} />
                    <strong style={{ fontSize: '0.9rem' }}>{account.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {getAccountTypeLabel(account.type)}
                    {optionPart === 'noSum' && ' (Ignorado)'}
                  </span>
                </div>

                {/* Saldo da Conta */}
                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Saldo Disponível</span>
                  <strong style={{ fontSize: '1.1rem', color: account.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                    {formatCurrency(account.balance)}
                  </strong>
                </div>

                {/* Fluxo Entradas/Saídas do Mês */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <TrendingUp size={12} className="text-income" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Entradas</span>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--income)' }}>{formatCurrency(incomes)}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <TrendingDown size={12} className="text-expense" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Saídas</span>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--expense)' }}>{formatCurrency(expenses)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhuma conta cadastrada ainda.
          </div>
        )}
      </div>
    </Card>
  );
};
