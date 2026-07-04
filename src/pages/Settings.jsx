import React, { useState, useEffect, useRef } from 'react';
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
  Lock, 
  User as UserIcon, 
  Calendar, 
  Phone, 
  Camera, 
  KeyRound 
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
  onNavigateToPage,
  updateProfile,
  updatePassword
}) => {
  // Estados do Perfil
  const [displayName, setDisplayName] = useState(user?.user_metadata?.displayName || '');
  const [birthdate, setBirthdate] = useState(user?.user_metadata?.birthdate || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Estados da Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Sincronizar dados caso o usuário seja atualizado
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.displayName || '');
      setBirthdate(user.user_metadata?.birthdate || '');
      setPhone(user.user_metadata?.phone || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  // Função para comprimir a foto usando Canvas
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG compacto com 70% de qualidade (~5KB a 8KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setAvatarUrl(compressedBase64);
      };
    };
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });

    try {
      await updateProfile({
        displayName,
        birthdate,
        phone,
        avatar_url: avatarUrl
      });
      setProfileMsg({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setProfileMsg({ text: `Erro ao salvar perfil: ${err.message}`, type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'A senha deve conter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg({ text: '', type: '' });

    try {
      await updatePassword(newPassword);
      setPasswordMsg({ text: 'Senha alterada com sucesso!', type: 'success' });
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setPasswordMsg({ text: `Erro ao redefinir senha: ${err.message}`, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. SEÇÃO: MEUS DADOS (PERFIL) */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <UserIcon className="text-income" size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Meus Dados</h3>
        </div>

        {profileMsg.text && (
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              marginBottom: '1.25rem',
              backgroundColor: profileMsg.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
              border: `1px solid ${profileMsg.type === 'success' ? 'var(--income)' : 'var(--expense)'}`,
              color: profileMsg.type === 'success' ? 'var(--income)' : 'var(--expense)'
            }}
          >
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar Uploader */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div 
              onClick={triggerFileInput}
              style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--surface-secondary)', 
                border: '2px solid var(--border)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              className="avatar-upload-hover"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Foto de Perfil" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <UserIcon size={32} style={{ color: 'var(--text-secondary)' }} />
              )}
              
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                  padding: '0.25rem 0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Camera size={14} style={{ color: '#ffffff' }} />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Foto de Perfil</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mobile-col-12">
            <div>
              <label>Nome Completo*</label>
              <input 
                type="text" 
                required
                placeholder="Ex: João da Silva"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label>Data de Nascimento</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mobile-col-12">
            <div>
              <label>E-mail (Login)</label>
              <input 
                type="email" 
                disabled 
                value={user?.email || ''} 
                style={{ cursor: 'not-allowed', opacity: 0.7, backgroundColor: 'var(--surface-secondary)' }}
              />
            </div>
            <div>
              <label>Telefone</label>
              <input 
                type="tel" 
                placeholder="Ex: (11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: 'fit-content', alignSelf: 'flex-end', minWidth: '140px', minHeight: '44px', justifyContent: 'center' }}
            disabled={profileLoading}
          >
            {profileLoading ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </form>
      </Card>

      {/* 2. SEÇÃO: SEGURANÇA (GERENCIAR SENHAS) */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <KeyRound className="text-income" size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Segurança e Senha</h3>
        </div>

        {passwordMsg.text && (
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              marginBottom: '1.25rem',
              backgroundColor: passwordMsg.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
              border: `1px solid ${passwordMsg.type === 'success' ? 'var(--income)' : 'var(--expense)'}`,
              color: passwordMsg.type === 'success' ? 'var(--income)' : 'var(--expense)'
            }}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Para alterar sua senha, digite a nova credencial de acesso abaixo. Sua senha precisa conter pelo menos 6 caracteres.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mobile-col-12">
            <div>
              <label>Nova Senha</label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label>Confirmar Nova Senha</label>
              <input 
                type="password" 
                placeholder="Repita a nova senha"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: 'fit-content', alignSelf: 'flex-end', minWidth: '140px', minHeight: '44px', justifyContent: 'center' }}
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </Card>

      {/* 3. SEÇÃO: ESPAÇO DE TRABALHO */}
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

      {/* 4. SEÇÃO: COMPARTILHAMENTO DE BANCO */}
      <SharingSettings 
        sharedUsers={mySharedUsers}
        onInvite={inviteUser}
        onRemoveInvite={removeInvite}
      />

      {/* 5. SEÇÃO: ATALHOS DE ORGANIZAÇÃO (Utilizados principalmente no celular) */}
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

      {/* 6. SEÇÃO: PREFERÊNCIAS E SISTEMA */}
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
