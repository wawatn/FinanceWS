import React, { useState, useEffect } from 'react';
import { useFinanceData } from './hooks/useFinanceData';
import { supabase } from './utils/supabaseClient';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Planning } from './pages/Planning';
import { AccountsCards } from './pages/AccountsCards';
import { CreditCards } from './pages/CreditCards';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { PiggyBank, X, Wallet, CreditCard } from 'lucide-react';

// Modals
import { AddTransactionModal } from './components/Modals/AddTransactionModal';
import { AddCardTransactionModal } from './components/Modals/AddCardTransactionModal';
import { OfxImportModal } from './components/Modals/OfxImportModal';
import { AddAccountCardModal } from './components/Modals/AddAccountCardModal';
import { ResetPasswordModal } from './components/Modals/ResetPasswordModal';

function App() {
  const {
    user,
    accounts,
    cards,
    budgets,
    transactions,
    deletedTransactions,
    defaultAccountId,
    theme,
    loading,
    activeSpaceUserId,
    activeSpaceOwnerEmail,
    sharedSpaces,
    mySharedUsers,
    customCategories,
    toggleTheme,
    addTransaction,
    editTransaction,
    deleteTransaction,
    toggleTransactionStatus,
    restoreTransaction,
    permanentlyDeleteTransaction,
    emptyTrash,
    addAccount,
    editAccount,
    deleteAccount,
    addCard,
    editCard,
    deleteCard,
    changeDefaultAccount,
    updateBudget,
    importOfxTransactions,
    inviteUser,
    removeInvite,
    switchSpace,
    addCustomCategory,
    deleteCustomCategory,
    updateProfile,
    updatePassword,
  } = useFinanceData();

  const [activePage, setActivePage] = useState('dashboard');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // Controle de Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddCardTxOpen, setIsAddCardTxOpen] = useState(false);
  const [isQuickAddMenuOpen, setIsQuickAddMenuOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isOfxOpen, setIsOfxOpen] = useState(false);
  const [isAddAccCardOpen, setIsAddAccCardOpen] = useState(false);
  const [accCardType, setAccCardType] = useState('account'); // 'account' ou 'card'
  const [editingAccCardItem, setEditingAccCardItem] = useState(null);

  // Escutar evento de redefinição de senha do Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handlers para Transação
  const handleOpenAddTx = () => {
    setEditingTransaction(null);
    setIsQuickAddMenuOpen(true);
  };

  const handleOpenEditTx = (tx) => {
    setEditingTransaction(tx);
    setIsAddTxOpen(true);
  };

  const handleSaveTransaction = (txData) => {
    if (editingTransaction) {
      editTransaction(editingTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
  };

  const handleOpenAddAccCard = (type, item = null) => {
    setAccCardType(type);
    setEditingAccCardItem(item);
    setIsAddAccCardOpen(true);
  };

  const handleSaveAccCard = (data) => {
    if (editingAccCardItem) {
      if (accCardType === 'account') {
        editAccount(editingAccCardItem.id, data);
      } else {
        editCard(editingAccCardItem.id, data);
      }
    } else {
      if (accCardType === 'account') {
        addAccount(data);
      } else {
        addCard(data);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Se não estiver logado, exibe tela de autenticação
  if (!loading && !user) {
    return <Auth />;
  }

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          backgroundColor: '#090d16',
          color: 'var(--text)'
        }}
      >
        <div style={{ animation: 'pulse 1.5s infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <PiggyBank size={48} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Carregando dados na nuvem...</span>
        </div>
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts}
            cards={cards}
            transactions={transactions}
            onAddTransaction={handleOpenAddTx}
            onEditTransaction={handleOpenEditTx}
            onDeleteTransaction={deleteTransaction}
            onToggleStatus={toggleTransactionStatus}
            onViewAllTransactions={() => setActivePage('transactions')}
            onManageAccountsCards={() => setActivePage('accounts')}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            deletedTransactions={deletedTransactions}
            accounts={accounts}
            cards={cards}
            defaultAccountId={defaultAccountId}
            customCategories={customCategories}
            onAddClick={handleOpenAddTx}
            onEditClick={handleOpenEditTx}
            onDeleteClick={deleteTransaction}
            onToggleStatus={toggleTransactionStatus}
            onRestoreClick={restoreTransaction}
            onPermanentlyDeleteClick={permanentlyDeleteTransaction}
            onEmptyTrash={emptyTrash}
          />
        );
      case 'planning':
        return (
          <Planning
            budgets={budgets}
            transactions={transactions}
            customCategories={customCategories}
            addCustomCategory={addCustomCategory}
            deleteCustomCategory={deleteCustomCategory}
            onUpdateBudget={updateBudget}
          />
        );
      case 'accounts':
        return (
          <AccountsCards
            accounts={accounts}
            cards={cards}
            onOpenAddModal={handleOpenAddAccCard}
            onDeleteAccount={deleteAccount}
            onDeleteCard={deleteCard}
            defaultAccountId={defaultAccountId}
            onSetDefaultAccount={changeDefaultAccount}
          />
        );
      case 'cards':
        return (
          <CreditCards
            cards={cards}
            accounts={accounts}
            transactions={transactions}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            onOpenAddModal={handleOpenAddAccCard}
            onDeleteCard={deleteCard}
            onOpenAddCardTx={() => setIsAddCardTxOpen(true)}
          />
        );
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'settings':
        return (
          <Settings
            user={user}
            activeSpaceUserId={activeSpaceUserId}
            sharedSpaces={sharedSpaces}
            switchSpace={switchSpace}
            mySharedUsers={mySharedUsers}
            inviteUser={inviteUser}
            removeInvite={removeInvite}
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
            onNavigateToPage={setActivePage}
            updateProfile={updateProfile}
            updatePassword={updatePassword}
          />
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar & Bottom Nav */}
      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenAddTransaction={handleOpenAddTx}
        onLogout={handleLogout}
      />

      {/* Área Principal de Conteúdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          activePage={activePage}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenImport={() => setIsOfxOpen(true)}
          onLogout={handleLogout}
          user={user}
          onNavigate={setActivePage}
        />

        <main className="main-content">
          {renderActivePage()}
        </main>
      </div>

      {/* Modal: Adicionar/Editar Transação */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        accounts={accounts}
        cards={cards}
        defaultAccountId={defaultAccountId}
        customCategories={customCategories}
      />

      {/* Modal: Importação e Conciliação OFX */}
      <OfxImportModal
        isOpen={isOfxOpen}
        onClose={() => setIsOfxOpen(false)}
        transactions={transactions}
        accounts={accounts}
        cards={cards}
        onImport={importOfxTransactions}
      />

      {/* Modal: Adicionar/Editar Conta ou Cartão */}
      <AddAccountCardModal
        isOpen={isAddAccCardOpen}
        onClose={() => setIsAddAccCardOpen(false)}
        type={accCardType}
        editingItem={editingAccCardItem}
        onSave={handleSaveAccCard}
        accounts={accounts}
      />

      {/* Modal: Adicionar Compra no Cartão */}
      <AddCardTransactionModal
        isOpen={isAddCardTxOpen}
        onClose={() => setIsAddCardTxOpen(false)}
        onSave={handleSaveTransaction}
        cards={cards}
        customCategories={customCategories}
      />

      {/* Modal: Redefinição de Senha via Link de E-mail */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
      />

      {/* Modal: Menu de Seleção Rápida de Lançamento */}
      {isQuickAddMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsQuickAddMenuOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px', padding: '1.5rem', borderRadius: '24px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>O que deseja lançar?</h3>
              <button className="btn-icon" onClick={() => setIsQuickAddMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsQuickAddMenuOpen(false);
                  setEditingTransaction(null);
                  setIsAddTxOpen(true);
                }}
                style={{ 
                  padding: '1rem', 
                  borderRadius: '16px', 
                  justifyContent: 'flex-start', 
                  gap: '0.85rem', 
                  width: '100%',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--income)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', color: 'var(--text)' }}>Lançamento de Conta</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px' }}>Receitas, despesas bancárias e transferências</span>
                </div>
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsQuickAddMenuOpen(false);
                  setIsAddCardTxOpen(true);
                }}
                style={{ 
                  padding: '1rem', 
                  borderRadius: '16px', 
                  justifyContent: 'flex-start', 
                  gap: '0.85rem', 
                  width: '100%',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255, 82, 82, 0.1)', color: 'var(--expense)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', color: 'var(--text)' }}>Compra no Cartão</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px' }}>Despesa parcelada ou à vista no cartão de crédito</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
