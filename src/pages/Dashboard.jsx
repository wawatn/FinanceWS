import React, { useState } from 'react';
import { SummaryCards } from '../components/Dashboard/SummaryCards';
import { CashFlowSummary } from '../components/Dashboard/CashFlowSummary';
import { CategoryChart } from '../components/Dashboard/CategoryChart';
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
  const [activeChart, setActiveChart] = useState('cashflow'); // 'cashflow' ou 'category'

  return (
    <div className="dashboard-grid">
      {/* Cards de Resumos Financeiros (Grid Compacto 2x2) */}
      <SummaryCards 
        accounts={accounts} 
        cards={cards} 
        transactions={transactions} 
      />

      {/* Seletor de Gráficos em Abas (Visível apenas no celular via CSS) */}
      <div className="mobile-chart-tabs-container">
        <button 
          type="button" 
          className={`chart-tab-btn ${activeChart === 'cashflow' ? 'active' : ''}`}
          onClick={() => setActiveChart('cashflow')}
        >
          Balanço Mensal
        </button>
        <button 
          type="button" 
          className={`chart-tab-btn ${activeChart === 'category' ? 'active' : ''}`}
          onClick={() => setActiveChart('category')}
        >
          Gastos por Categoria
        </button>
      </div>

      {/* Gráficos de Fluxo de Caixa e Categorias (Responsivo) */}
      <div className={`chart-card-col ${activeChart === 'cashflow' ? 'active-mobile-chart' : 'hidden-mobile-chart'}`}>
        <CashFlowSummary transactions={transactions} />
      </div>
      
      <div className={`chart-card-col ${activeChart === 'category' ? 'active-mobile-chart' : 'hidden-mobile-chart'}`}>
        <CategoryChart transactions={transactions} />
      </div>

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
