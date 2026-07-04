import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { PiggyBank, Mail, Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { Card } from '../components/UI/Card';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' ou 'error'

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) {
        setMessage({ text: `Erro ao enviar e-mail: ${error.message}`, type: 'error' });
      } else {
        setMessage({ text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.', type: 'success' });
        setEmail('');
      }
    } else if (isSignUp) {
      if (password !== confirmPassword) {
        setMessage({ text: 'As senhas não coincidem.', type: 'error' });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setMessage({ text: 'A senha deve conter pelo menos 6 caracteres.', type: 'error' });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ text: `Erro no cadastro: ${error.message}`, type: 'error' });
      } else {
        setMessage({ text: 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário.', type: 'success' });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: `Erro no login: ${error.message}`, type: 'error' });
      }
    }
    setLoading(false);
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        width: '100vw',
        padding: '1rem',
        background: 'radial-gradient(circle at center, #131929 0%, #090d16 100%)'
      }}
    >
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          padding: '2.5rem 2rem', 
          background: 'rgba(19, 25, 41, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div 
            style={{ 
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', 
              color: '#000', 
              padding: '0.75rem', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 24px rgba(0, 230, 118, 0.2)'
            }}
          >
            <PiggyBank size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.25rem' }}>
            FinanceWS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isForgotPassword ? 'Recuperação de Acesso' : 'Controle financeiro pessoal inteligente na nuvem'}
          </span>
        </div>

        {message.text && (
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              marginBottom: '1.25rem',
              backgroundColor: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'var(--income)' : 'var(--expense)'}`,
              color: message.type === 'success' ? 'var(--income)' : 'var(--expense)'
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                required 
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Senha</span>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage({ text: '', type: '' });
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--primary)', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      padding: 0 
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  required 
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div>
              <label>Confirmar Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  required 
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Processando...' : (isForgotPassword ? null : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />))}
            <span style={{ marginLeft: '0.5rem' }}>
              {isForgotPassword 
                ? 'Enviar Link de Recuperação' 
                : (isSignUp ? 'Cadastrar Minha Conta' : 'Entrar nas Finanças')}
            </span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          {isForgotPassword ? (
            <button 
              type="button" 
              onClick={() => {
                setIsForgotPassword(false);
                setIsSignUp(false);
                setMessage({ text: '', type: '' });
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                fontWeight: 600, 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'underline'
              }}
            >
              <ArrowLeft size={14} />
              Voltar para o Login
            </button>
          ) : (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>
                {isSignUp ? 'Já tem uma conta?' : 'Não possui cadastro?'}
              </span>{' '}
              <button 
                type="button" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage({ text: '', type: '' });
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isSignUp ? 'Faça Login' : 'Cadastre-se de graça'}
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
