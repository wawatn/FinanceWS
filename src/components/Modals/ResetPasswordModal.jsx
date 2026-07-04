import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, Lock, Check } from 'lucide-react';
import { Card } from '../UI/Card';

export const ResetPasswordModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: 'A senha deve conter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage({ text: `Erro ao redefinir: ${error.message}`, type: 'error' });
      } else {
        setMessage({ text: 'Senha redefinida com sucesso! Você já está conectado.', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Redefinir Sua Senha</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          {message.text && (
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                fontSize: '0.85rem',
                backgroundColor: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                border: `1px solid ${message.type === 'success' ? 'var(--income)' : 'var(--expense)'}`,
                color: message.type === 'success' ? 'var(--income)' : 'var(--expense)'
              }}
            >
              {message.text}
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Você acessou o link de recuperação. Digite sua nova senha de acesso abaixo para entrar na sua conta.
          </p>

          <div>
            <label>Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                required 
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label>Confirmar Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                required 
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
            disabled={loading}
          >
            <Check size={18} />
            <span style={{ marginLeft: '0.5rem' }}>{loading ? 'Salvando...' : 'Salvar Nova Senha'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
