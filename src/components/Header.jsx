import React from 'react';
import { Sun, Moon, UploadCloud, User } from 'lucide-react';

export const Header = ({ 
  activePage, 
  theme, 
  toggleTheme, 
  onOpenImport, 
  onLogout,
  user
}) => {
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Meu Painel';
      case 'transactions': return 'Transações';
      case 'planning': return 'Orçamentos & Metas';
      case 'accounts': return 'Contas & Cartões';
      case 'reports': return 'Gráficos & Relatórios';
      case 'settings': return 'Configurações';
      default: return 'Finanças';
    }
  };

  return (
    <header className="header">
      <div className="header-title-container">
        <h2 className="header-title">{getPageTitle()}</h2>
      </div>

      <div className="header-actions">
        {/* Botão de Importação OFX */}
        <button 
          className="btn btn-secondary btn-icon" 
          title="Importar Extrato Bancário (OFX)"
          onClick={onOpenImport}
          style={{ padding: '0.6rem 0.8rem', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <UploadCloud size={18} />
          <span className="user-name">Conciliar OFX</span>
        </button>

        {/* Alternador de Tema */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Perfil do Usuário (Click para Sair) */}
        <div 
          className="user-profile" 
          onClick={onLogout}
          style={{ cursor: 'pointer' }}
          title="Clique para Sair da Conta"
        >
          <div className="user-avatar">
            <User size={18} />
          </div>
          <span className="user-name" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sair</span>
        </div>
      </div>
    </header>
  );
};
