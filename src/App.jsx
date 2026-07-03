import React, { useState } from 'react';
import { useFinanceData } from './hooks/useFinanceData';
import { supabase } from './utils/supabaseClient';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Planning } from './pages/Planning';
import { AccountsCards } from './pages/AccountsCards';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { PiggyBank } from 'lucide-react';

// Modals
import { AddTransactionModal } from './components/Modals/AddTransactionModal';
import { OfxImportModal } from './components/Modals/OfxImportModal';
import { AddAccountCardModal } from './components/Modals/AddAccountCardModal';

function App() {
  const {
    user,
    accounts,
    cards,
    budgets,
    transactions,
    theme,
    loading,
    activeSpaceUserId,
    activeSpaceOwnerEmail,
    sharedSpaces,
    mySharedUsers,
    toggleTheme,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addAccount,
    editAccount,
    addCard,
    editCard,
    updateBudget,
    importOfxTransactions,
    inviteUser,
    removeInvite,
    switchSpace,
  } = useFinanceData();

  const [activePage, setActivePage] = useState('dashboard');

  // Controle de Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [isOfxOpen, setIsOfxOpen] = useState(false);

  const [isAddAccCardOpen, setIsAddAccCardOpen] = useState(false);
  const [accCardType, setAccCardType] = useState('account'); // 'account' ou 'card'
  const [editingAccCardItem, setEditingAccCardItem] = useState(null);

  // Handlers para Transação
  const handleOpenAddTx = () => {
    setEditingTransaction(null);
    setIsAddTxOpen(true);
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

  // Handlers para Contas e Cartões
  const handleOpenAddAccCard = (type, item = null) => {
    setAccCardType(type);
    setEditingAccCardItem(item);
    setIsAddAccCardOpen(true);
  };

  const handleSaveAccCard = (itemData) => {
    if (accCardType === 'account') {
      if (editingAccCardItem) {
        editAccount(editingAccCardItem.id, itemData);
      } else {
        addAccount(itemData);
      }
    } else if (accCardType === 'card') {
      if (editingAccCardItem) {
        editCard(editingAccCardItem.id, itemData);
      } else {
        addCard(itemData);
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      await supabase.auth.signOut();
    }
  };

  // Carregamento de Sessão Inicial
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
          color: '#ffffff',
          gap: '1rem'
        }}
      >
        <div 
          className="pulse-red"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', 
            color: '#000', 
            padding: '1rem', 
            borderRadius: '20px',
            animation: 'pulse-red-anim 2s infinite'
          }}
        >
          <PiggyBank size={40} />
        </div>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Carregando suas finanças...
        </span>
      </div>
    );
  }

  // Redirecionar se não logado
  if (!user) {
    return <Auth />;
  }

  // Renderizar página ativa
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts}
            cards={cards}
            transactions={transactions}
            onAddTransaction={addTransaction}
            onEditTransaction={handleOpenEditTx}
            onDeleteTransaction={deleteTransaction}
            onViewAllTransactions={() => setActivePage('transactions')}
            onManageAccountsCards={() => setActivePage('accounts')}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            accounts={accounts}
            cards={cards}
            onAddClick={handleOpenAddTx}
            onEditClick={handleOpenEditTx}
            onDeleteClick={deleteTransaction}
          />
        );
      case 'planning':
        return (
          <Planning
            budgets={budgets}
            transactions={transactions}
            onUpdateBudget={updateBudget}
          />
        );
      case 'accounts':
        return (
          <AccountsCards
            accounts={accounts}
            cards={cards}
            onOpenAddModal={handleOpenAddAccCard}
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
      />
    </div>
  );
}

export default App;
