import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Target, 
  Wallet, 
  PieChart, 
  Plus, 
  PiggyBank,
  LogOut,
  Settings
} from 'lucide-react';

export const Navigation = ({ activePage, setActivePage, onOpenAddTransaction, onLogout }) => {
  // Menu completo para Desktop
  const desktopMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'planning', label: 'Planejamento', icon: Target },
    { id: 'accounts', label: 'Contas & Cartões', icon: Wallet },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  // Menu otimizado de 4 abas para Mobile (o "+" fica no centro como FAB)
  const mobileMenuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'transactions', label: 'Extrato', icon: ArrowLeftRight },
    { id: 'planning', label: 'Metas', icon: Target },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <PiggyBank size={24} />
          </div>
          <span className="logo-text brand-font">FinanceWS</span>
        </div>
        
        <ul className="sidebar-menu">
          {desktopMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <a 
                  className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
          
          {/* Botão de Logout */}
          <li style={{ marginTop: 'auto' }}>
            <a 
              className="sidebar-item"
              onClick={onLogout}
              style={{ color: 'var(--expense)' }}
            >
              <LogOut />
              <span>Sair da Conta</span>
            </a>
          </li>
        </ul>
        
        <div style={{ padding: '1.5rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onOpenAddTransaction}
          >
            <Plus size={20} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </aside>

      {/* BOTTOM NAVIGATION FOR MOBILE (Otimizado de 5 itens no total) */}
      <nav className="bottom-nav">
        {/* Primeiros 2 itens (Painel, Extrato) */}
        {mobileMenuItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <a 
              key={item.id} 
              className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </a>
          );
        })}

        {/* Botão de Lançamento Rápido no Centro (FAB) */}
        <div className="bottom-nav-center">
          <button className="fab-button" onClick={onOpenAddTransaction} title="Novo Lançamento">
            <Plus size={24} />
          </button>
        </div>

        {/* Últimos 2 itens (Metas, Ajustes) */}
        {mobileMenuItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <a 
              key={item.id} 
              className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};
