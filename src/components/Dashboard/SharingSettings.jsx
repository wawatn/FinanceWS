import React, { useState } from 'react';
import { Card } from '../UI/Card';
import { Users, UserPlus, Trash2, Mail } from 'lucide-react';

export const SharingSettings = ({ sharedUsers, onInvite, onRemoveInvite }) => {
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setLoading(true);
    try {
      await onInvite(emailInput.trim().toLowerCase());
      setEmailInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-12" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Users className="text-income" size={20} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Compartilhar Espaço Financeiro</h3>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem',
          alignItems: 'start'
        }}
      >
        {/* Formulário de Convidar */}
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
            Dê permissão para que outra pessoa (com o e-mail cadastrado no app) possa acessar, visualizar e gerenciar o seu banco de dados financeiro.
          </span>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                placeholder="email@amigo.com" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
            >
              <UserPlus size={16} />
              <span>Convidar</span>
            </button>
          </form>
        </div>

        {/* Lista de Acessos Ativos */}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
          <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>
            Pessoas com acesso ao seu banco ({sharedUsers.length})
          </strong>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
            {sharedUsers.length > 0 ? (
              sharedUsers.map((item, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.guest_email}</span>
                  <button 
                    onClick={() => onRemoveInvite(item.guest_email)}
                    className="btn-icon"
                    style={{ color: 'var(--expense)', padding: '0.25rem' }}
                    title="Revogar Acesso"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Nenhum e-mail convidado ainda. Seu espaço é totalmente privado.
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
