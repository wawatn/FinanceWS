import React from 'react';
import { Sun, Moon, UploadCloud, User, Database } from 'lucide-react';

export const Header = ({ 
  activePage, 
  theme, 
  toggleTheme, 
  onOpenImport, 
  onLogout,
  user,
  activeSpaceUserId,
  sharedSpaces,
  switchSpace 
}) => {
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Meu Painel';
      case 'transactions': return 'Transações';
      case 'planning': return 'Orçamentos & Metas';
      case 'accounts': return 'Contas & Cartões';
      case 'reports': return 'Gráficos & Relatórios';
      default: return 'Finanças';
    }
  };

  return (
    <header className="header">
      <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <h2 className="header-title">{getPageTitle()}</h2>
        
        {/* Seletor de Espaço Compartilhado */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--surface-secondary)', padding: '0.25rem 0.5rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <Database size={14} style={{ color: 'var(--primary)' }} />
            <select
              value={activeSpaceUserId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === user.id) {
                  switchSpace(user.id, 'Meu Espaço');
                } else {
                  const space = sharedSpaces.find(s => s.owner_id === val);
                  switchSpace(val, space ? space.owner_email : 'Compartilhado');
                }
              }}
              style={{ 
                padding: '0.15rem 0.35rem', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                width: 'auto', 
                border: 'none',
                backgroundColor: 'transparent',
                fontWeight: 600,
                color: 'var(--text)'
              }}
            >
              <option value={user.id}>Meu Espaço ({user.email})</option>
              {sharedSpaces.map((space) => (
                <option key={space.owner_id} value={space.owner_id}>
                  Espaço de: {space.owner_email}
                </option>
              ))}
            </select>
          </div>
        )}
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
