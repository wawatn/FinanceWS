import React from 'react';
import { Card } from '../components/UI/Card';
import { SharingSettings } from '../components/Dashboard/SharingSettings';
import { 
  Database, 
  Users, 
  Wallet, 
  PieChart, 
  Sun, 
  Moon, 
  LogOut, 
  Lock 
} from 'lucide-react';

export const Settings = ({
  user,
  activeSpaceUserId,
  sharedSpaces,
  switchSpace,
  mySharedUsers,
  inviteUser,
  removeInvite,
  theme,
  toggleTheme,
  onLogout,
  onNavigateToPage
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. SEÇÃO: ESPAÇO DE TRABALHO */}
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Database className="text-income" size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Espaço de Trabalho Ativo</h3>
        </div>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Escolha qual banco de dados você deseja visualizar. Se sua amiga te convidou, o e-mail dela aparecerá abaixo para você selecionar.
        </p>

        <div style={{ position: 'relative', width: '100%' }}>
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
              width: '100%',
              padding: '0.85rem 1rem', 
              borderRadius: '12px', 
              fontSize: '0.9rem', 
              fontWeight: 600,
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
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
      </Card>

      {/* 2. SEÇÃO: COMPARTILHAMENTO DE BANCO */}
      <SharingSettings 
        sharedUsers={mySharedUsers}
        onInvite={inviteUser}
        onRemoveInvite={removeInvite}
      />

      {/* 3. SEÇÃO: ATALHOS DE ORGANIZAÇÃO (Utilizados principalmente no celular) */}
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Lock className="text-income" size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Gerenciamento</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button 
            onClick={() => onNavigateToPage('accounts')}
            className="btn btn-secondary"
            style={{ padding: '0.85rem', justifyContent: 'center', gap: '0.5rem', width: '100%', borderRadius: '12px' }}
          >
            <Wallet size={16} />
            <span>Contas & Cartões</span>
          </button>
          
          <button 
            onClick={() => onNavigateToPage('reports')}
            className="btn btn-secondary"
            style={{ padding: '0.85rem', justifyContent: 'center', gap: '0.5rem', width: '100%', borderRadius: '12px' }}
          >
            <PieChart size={16} />
            <span>Ver Relatórios</span>
          </button>
        </div>
      </Card>

      {/* 4. SEÇÃO: PREFERÊNCIAS E SISTEMA */}
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Alternar Tema */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.5rem 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {theme === 'dark' ? <Sun size={18} style={{ color: 'orange' }} /> : <Moon size={18} style={{ color: 'var(--primary)' }} />}
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Modo Escuro</span>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', minHeight: '36px', borderRadius: '10px', fontSize: '0.8rem' }}
            >
              {theme === 'dark' ? 'Desativar' : 'Ativar'}
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

          {/* Sair da Conta */}
          <button 
            onClick={onLogout}
            className="btn"
            style={{ 
              backgroundColor: 'rgba(255, 76, 76, 0.1)', 
              color: 'var(--expense)', 
              border: '1px solid var(--expense)',
              padding: '0.85rem',
              borderRadius: '12px',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              fontWeight: 600
            }}
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>

        </div>
      </Card>

    </div>
  );
};
