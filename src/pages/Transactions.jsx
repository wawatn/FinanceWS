import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  CheckCircle,
  Circle,
  Trash2, 
  Edit,
  Coffee, 
  Car, 
  Home, 
  Film, 
  ShoppingBag, 
  HeartPulse, 
  GraduationCap, 
  Sparkles, 
  DollarSign,
  Briefcase,
  Wallet,
  RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'Todos',
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Assinaturas',
  'Saúde',
  'Educação',
  'Vestuário',
  'Beleza',
  'Rendimentos',
  'Outros'
];

const CATEGORY_COLORS = {
  'Alimentação': '#ff7043',
  'Transporte': '#29b6f6',
  'Moradia': '#ab47bc',
  'Lazer': '#ffca28',
  'Assinaturas': '#26a69a',
  'Saúde': '#ef5350',
  'Educação': '#5c6bc0',
  'Vestuário': '#ec407a',
  'Beleza': '#26c6da',
  'Rendimentos': '#66bb6a',
  'Outros': '#8d6e63',
  'Transferência': '#3f51b5'
};

const CATEGORY_ICONS = {
  'Alimentação': Coffee,
  'Transporte': Car,
  'Moradia': Home,
  'Lazer': Film,
  'Assinaturas': Sparkles,
  'Saúde': HeartPulse,
  'Educação': GraduationCap,
  'Vestuário': ShoppingBag,
  'Rendimentos': DollarSign,
};

export const Transactions = ({ 
  transactions, 
  accounts, 
  cards, 
  onAddClick, 
  onEditClick, 
  onDeleteClick,
  onToggleStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSource, setSelectedSource] = useState('Todos'); 
  const [selectedStatus, setSelectedStatus] = useState('Todos'); 
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Controle de Mês
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const getMonthYearString = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
  };

  const getMonthName = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[currentDate.getMonth()];
  };

  // Filtragem
  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date + 'T00:00:00');
    const sameMonth = txDate.getMonth() === currentDate.getMonth() && 
                      txDate.getFullYear() === currentDate.getFullYear();
    
    if (!sameMonth) return false;

    const matchesSearch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || tx.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos' || tx.status === selectedStatus;

    let matchesSource = true;
    if (selectedSource !== 'Todos') {
      if (selectedSource.startsWith('card-')) {
        matchesSource = tx.cardId === selectedSource.replace('card-', '');
      } else {
        matchesSource = tx.accountId === selectedSource;
      }
    }

    return matchesSearch && matchesCategory && matchesSource && matchesStatus;
  });

  // Cálculos de Saldo e Balanço do Mês selecionado
  const totalAccountsBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const monthIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'confirmed')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = filteredTransactions
    .filter(t => t.type === 'expense' && (t.cardId || t.status === 'confirmed'))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthBalance = monthIncome - monthExpense;

  const getDestinationLabel = (tx) => {
    if (tx.type === 'transfer') {
      const origin = accounts.find(a => a.id === tx.accountId);
      const dest = accounts.find(a => a.id === tx.destinationAccountId);
      return `${origin ? origin.name : 'Conta'} ➔ ${dest ? dest.name : 'Conta'}`;
    }
    if (tx.cardId) {
      const card = cards.find(c => c.id === tx.cardId);
      return card ? card.name : 'Cartão';
    }
    if (tx.accountId) {
      const acc = accounts.find(a => a.id === tx.accountId);
      return acc ? acc.name : 'Conta';
    }
    return 'Indefinido';
  };

  const getIcon = (category, type) => {
    if (type === 'transfer') return <RefreshCw size={18} />;
    const IconComponent = CATEGORY_ICONS[category] || DollarSign;
    return <IconComponent size={18} />;
  };

  // Agrupamento por Data para a visualização Mobile
  const groupTransactionsByDate = () => {
    const grouped = filteredTransactions.reduce((acc, tx) => {
      const dateStr = tx.date;
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(tx);
      return acc;
    }, {});

    return Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(dateStr => ({
      date: dateStr,
      items: grouped[dateStr]
    }));
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return 'Data Indefinida';
    const dateObj = new Date(dateStr + 'T00:00:00');
    
    // Fallback de parse para navegadores mobile legados (como Safari antigo)
    if (isNaN(dateObj.getTime())) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `Dia ${parts[2]}/${parts[1]}`;
      }
      return 'Data Indefinida';
    }

    const weekdays = [
      'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
    ];
    
    const weekday = weekdays[dateObj.getDay()];
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    return `${weekday}, ${day}`;
  };

  const groupedTransactions = groupTransactionsByDate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. SELETOR DE MÊS ESTILO MOBILLS (Seta Esquerda | Mês | Seta Direita) */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 0.5rem'
        }}
      >
        <button 
          onClick={handlePrevMonth} 
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text)' }}>
          {getMonthName()}
        </h3>
        <button 
          onClick={handleNextMonth} 
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
        >
          <ArrowRight size={20} />
        </button>
      </div>

      {/* 2. CARD DUPLO DE SALDOS ESTILO MOBILLS */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem', 
          backgroundColor: 'var(--surface-secondary)', 
          padding: '1rem 1.25rem', 
          borderRadius: '20px', 
          border: '1px solid var(--border)' 
        }}
      >
        {/* Saldo Atual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}><Wallet size={20} /></div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>Saldo atual</span>
            <strong style={{ fontSize: '1rem', color: 'var(--income)', fontWeight: 700 }}>
              {formatCurrency(totalAccountsBalance)}
            </strong>
          </div>
        </div>

        {/* Balanço Mensal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}><Briefcase size={20} /></div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>Balanço mensal</span>
            <strong style={{ fontSize: '1rem', color: monthBalance >= 0 ? 'var(--income)' : 'var(--expense)', fontWeight: 700 }}>
              {formatCurrency(monthBalance)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. GAVETA DE FILTROS COLAPSÁVEL */}
      <Card style={{ padding: '0.75rem 1.25rem' }}>
        <button 
          type="button" 
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="btn"
          style={{ 
            width: '100%', 
            justifyContent: 'space-between', 
            backgroundColor: 'transparent',
            color: 'var(--text)', 
            padding: '0.25rem 0',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: 'var(--primary)' }} />
            Filtrar Lançamentos
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isFiltersOpen ? '▲ Fechar' : '▼ Abrir'}
          </span>
        </button>

        {isFiltersOpen && (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '1rem',
              marginTop: '1rem',
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
              animation: 'fadeIn 0.25s ease'
            }}
          >
            {/* Busca por Descrição */}
            <div>
              <label>Pesquisar lançamento</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Ex: padaria, combustível..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Filtro de Categoria */}
            <div>
              <label>Filtrar por Categoria</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Conta / Cartão */}
            <div>
              <label>Filtrar por Conta/Cartão</label>
              <select 
                value={selectedSource} 
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <optgroup label="Contas">
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Cartões de Crédito">
                  {cards.map(card => (
                    <option key={card.id} value={`card-${card.id}`}>{card.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Filtro de Status */}
            <div>
              <label>Filtrar por Status</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="confirmed">Pagos / Recebidos</option>
                <option value="pending">Pendentes (Não Pagos)</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* 4. LISTA DE TRANSAÇÕES (Desktop vs Mobile) */}
      <div className="transactions-list-container">
        
        {/* VERSÃO DESKTOP: TABELA CLÁSSICA (Oculta no Mobile) */}
        <Card className="desktop-only-table-card" style={{ padding: '0' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Status</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Origem/Destino</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    return (
                      <tr 
                        key={tx.id}
                        style={{ 
                          opacity: tx.status === 'pending' ? 0.85 : 1,
                          backgroundColor: tx.status === 'pending' ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                        }}
                      >
                        <td>
                          <button
                            onClick={() => onToggleStatus(tx.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: tx.status === 'confirmed' 
                                ? (isIncome ? 'var(--income)' : (isTransfer ? 'var(--primary)' : 'var(--primary)'))
                                : 'var(--text-secondary)'
                            }}
                            title={tx.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          >
                            {tx.status === 'confirmed' ? <CheckCircle size={18} /> : <Circle size={18} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.9rem', color: tx.status === 'pending' ? 'var(--text-secondary)' : 'var(--text)' }}>
                              {tx.description}
                              {tx.installmentNumber && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', backgroundColor: 'var(--surface-secondary)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  {tx.installmentNumber}/{tx.totalInstallments}
                                </span>
                              )}
                            </strong>
                          </div>
                        </td>
                        <td>
                          {isTransfer ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>Transferência</span>
                          ) : (
                            <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                              {tx.category}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                            {getDestinationLabel(tx)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{formatDate(tx.date)}</span>
                        </td>
                        <td>
                          <strong className={isTransfer ? '' : (isIncome ? 'text-income' : 'text-expense')} style={{ fontSize: '0.9rem', color: isTransfer ? 'var(--text)' : undefined }}>
                            {isTransfer ? '⇅' : (isIncome ? '+' : '-')} {formatCurrency(tx.amount)}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => onEditClick(tx)}
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="btn-icon" 
                              style={{ color: 'var(--expense)' }}
                              onClick={() => onDeleteClick(tx.id)}
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Nenhum lançamento encontrado para os filtros selecionados neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* VERSÃO MOBILE: LISTA AGRUPADA POR DATA ESTILO MOBILLS (Visível apenas no Celular) */}
        <div className="mobile-only-transactions-list" style={{ gap: '1.25rem' }}>
          {groupedTransactions.length > 0 ? (
            groupedTransactions.map((group) => (
              <div key={group.date} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                
                {/* Cabeçalho da Data (ex: Sexta, 10) */}
                <h4 style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 700, 
                  color: 'var(--text)', 
                  paddingLeft: '0.25rem', 
                  marginBottom: '0.25rem',
                  letterSpacing: '0.3px'
                }}>
                  {formatDateHeader(group.date)}
                </h4>

                {/* Itens do Dia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {group.items.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const iconColor = CATEGORY_COLORS[tx.category] || 'var(--primary)';
                    
                    return (
                      <div 
                        key={tx.id}
                        className="mobile-tx-item"
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderRadius: '20px',
                          backgroundColor: 'var(--surface-secondary)',
                          border: '1px solid var(--border)',
                          opacity: tx.status === 'pending' ? 0.8 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Esquerda: Ícone Redondo da Categoria + Descrição */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                          
                          {/* Ícone Redondo */}
                          <div 
                            style={{ 
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%', 
                              backgroundColor: `${iconColor}22`, // Cor com 13% opacidade
                              color: iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {getIcon(tx.category, tx.type)}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <strong style={{ 
                              display: 'block', 
                              fontSize: '0.9rem', 
                              color: tx.status === 'pending' ? 'var(--text-secondary)' : 'var(--text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {tx.description}
                              {tx.installmentNumber && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', backgroundColor: 'var(--surface-secondary)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  {tx.installmentNumber}/{tx.totalInstallments}
                                </span>
                              )}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem' }}>
                              {isTransfer ? 'Transferência' : tx.category} | {getDestinationLabel(tx)}
                              {tx.isFixed && <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}> | Fixa</span>}
                            </span>
                          </div>
                        </div>

                        {/* Direita: Valor, Status e Ações */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                          
                          {/* Valor e Ações */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.3rem' }}>
                            <strong className={isTransfer ? '' : (isIncome ? 'text-income' : 'text-expense')} style={{ fontSize: '0.95rem', color: isTransfer ? 'var(--text)' : undefined, fontWeight: 700 }}>
                              {isTransfer ? '⇅' : (isIncome ? '+' : '-')} {formatCurrency(tx.amount)}
                            </strong>

                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button 
                                className="btn-icon" 
                                onClick={() => onEditClick(tx)}
                                style={{ padding: '0.2rem', borderRadius: '6px' }}
                                title="Editar"
                              >
                                <Edit size={11} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ color: 'var(--expense)', padding: '0.2rem', borderRadius: '6px' }}
                                onClick={() => onDeleteClick(tx.id)}
                                title="Excluir"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Pequeno Círculo de Status (Confirmado/Pendente) */}
                          <button
                            onClick={() => onToggleStatus(tx.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: tx.status === 'confirmed' 
                                ? (isIncome ? 'var(--income)' : 'var(--expense)')
                                : 'var(--expense)',
                              opacity: tx.status === 'confirmed' ? 0.8 : 1,
                              flexShrink: 0
                            }}
                            title={tx.status === 'confirmed' ? 'Lançamento Pago (Clique para marcar como pendente)' : 'Lançamento Pendente (Clique para marcar como pago)'}
                          >
                            {tx.status === 'confirmed' ? (
                              <div style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                backgroundColor: isIncome ? 'var(--income)' : 'var(--expense)', 
                                color: '#000000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: 900
                              }}>
                                ✓
                              </div>
                            ) : (
                              <div style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                border: '2px solid var(--expense)', 
                                backgroundColor: 'transparent'
                              }} />
                            )}
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem', backgroundColor: 'var(--surface-secondary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              Nenhum lançamento encontrado para os filtros selecionados neste mês.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
