import React from 'react';
import { SummaryCards } from '../components/Dashboard/SummaryCards';
import { CategoryChart } from '../components/Dashboard/CategoryChart';
import { CashFlowSummary } from '../components/Dashboard/CashFlowSummary';
import { RecentTransactions } from '../components/Dashboard/RecentTransactions';
import { CardLimits } from '../components/Dashboard/CardLimits';

export const Dashboard = ({ 
  accounts, 
  cards, 
  transactions, 
  onAddTransaction, 
  onEditTransaction, 
  onDeleteTransaction, 
  onToggleStatus,
  onViewAllTransactions, 
  onManageAccountsCards
}) => {
  return (
    <div className="dashboard-grid">
      {/* Cards de Resumos Financeiros */}
      <SummaryCards 
        accounts={accounts} 
        cards={cards} 
        transactions={transactions} 
      />

      {/* Gráficos de Fluxo de Caixa e Categorias */}
      <CashFlowSummary transactions={transactions} />
      <CategoryChart transactions={transactions} />

      {/* Lançamentos Recentes e Cartões de Crédito */}
      <RecentTransactions 
        transactions={transactions} 
        onEditTransaction={onEditTransaction} 
        onDeleteTransaction={onDeleteTransaction} 
        onToggleStatus={onToggleStatus}
        onViewAll={onViewAllTransactions}
      />
      <CardLimits 
        cards={cards} 
        onManage={onManageAccountsCards} 
      />
    </div>
  );
};
