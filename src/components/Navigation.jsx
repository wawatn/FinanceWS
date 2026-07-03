import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Target, 
  Wallet, 
  PieChart, 
  Plus, 
  PiggyBank,
  LogOut
} from 'lucide-react';

export const Navigation = ({ activePage, setActivePage, onOpenAddTransaction, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'planning', label: 'Planejamento', icon: Target },
    { id: 'accounts', label: 'Contas & Cartões', icon: Wallet },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
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
          {menuItems.map((item) => {
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

      {/* BOTTOM NAVIGATION FOR MOBILE */}
      <nav className="bottom-nav">
        {menuItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <a 
              key={item.id} 
              className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </a>
          );
        })}

        {/* Botão de Lançamento Rápido no Centro */}
        <div className="bottom-nav-center">
          <button className="fab-button" onClick={onOpenAddTransaction}>
            <Plus size={28} />
          </button>
        </div>

        {menuItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <a 
              key={item.id} 
              className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};
