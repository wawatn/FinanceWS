import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Edit, 
  Plus, 
  CheckCircle,
  Circle,
  FileText,
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
  const [selectedSource, setSelectedSource] = useState('Todos'); // 'Todos', accountId, cardId
  const [selectedStatus, setSelectedStatus] = useState('Todos'); // 'Todos', 'confirmed', 'pending'
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Controle de Mês (Navegação de Meses)
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

  // Filtragem
  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date + 'T00:00:00');
    const sameMonth = txDate.getMonth() === currentDate.getMonth() && 
                      txDate.getFullYear() === currentDate.getFullYear();
    
    if (!sameMonth) return false;

    // Busca de texto
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Categoria
    const matchesCategory = selectedCategory === 'Todos' || tx.category === selectedCategory;

    // Status (Pago vs Pendente)
    const matchesStatus = selectedStatus === 'Todos' || tx.status === selectedStatus;

    // Conta ou Cartão
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

  const getDestinationLabel = (tx) => {
    if (tx.type === 'transfer') {
      const origin = accounts.find(a => a.id === tx.accountId);
      const dest = accounts.find(a => a.id === tx.destinationAccountId);
      return `⇅ ${origin ? origin.name : 'Conta'} ➔ ${dest ? dest.name : 'Conta'}`;
    }
    if (tx.cardId) {
      const card = cards.find(c => c.id === tx.cardId);
      return card ? `💳 ${card.name}` : '💳 Cartão';
    }
    if (tx.accountId) {
      const acc = accounts.find(a => a.id === tx.accountId);
      return acc ? `🏦 ${acc.name}` : '🏦 Conta';
    }
    return 'Indefinido';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Barra superior de navegação temporal e filtro */}
      <Card style={{ padding: '1rem 1.5rem' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Navegação de Meses */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary btn-icon" onClick={handlePrevMonth} style={{ borderRadius: '50%', minHeight: '36px', width: '36px' }}>
              <ArrowLeft size={16} />
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, minWidth: '160px', textAlign: 'center' }}>
              {getMonthYearString()}
            </h3>
            <button className="btn btn-secondary btn-icon" onClick={handleNextMonth} style={{ borderRadius: '50%', minHeight: '36px', width: '36px' }}>
              <ArrowRight size={16} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={onAddClick}>
            <Plus size={18} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </Card>

      {/* Grid de Filtros e Busca (Colapsável) */}
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

      {/* Lista de Transações (Desktop vs Mobile) */}
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

        {/* VERSÃO MOBILE: LISTA DE ITENS FLEX (Visível apenas no Celular) */}
        <div className="mobile-only-transactions-list">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              return (
                <div 
                  key={tx.id}
                  className="mobile-tx-item"
                  style={{ 
                    opacity: tx.status === 'pending' ? 0.8 : 1,
                    borderLeft: `5px solid ${isTransfer ? 'var(--primary)' : (isIncome ? 'var(--income)' : 'var(--expense)')}`
                  }}
                >
                  {/* Esquerda: Checkbox + Detalhes */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
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
                          ? (isIncome ? 'var(--income)' : (isTransfer ? 'var(--primary)' : 'var(--primary)'))
                          : 'var(--text-secondary)'
                      }}
                    >
                      {tx.status === 'confirmed' ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </button>

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
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem' }}>
                        {formatDate(tx.date)} • {isTransfer ? 'Transferência' : tx.category} • {getDestinationLabel(tx).replace(/^[💳🏦\s]+/, '')}
                      </span>
                    </div>
                  </div>

                  {/* Direita: Valor e Ações */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.35rem', marginLeft: '0.5rem' }}>
                    <strong className={isTransfer ? '' : (isIncome ? 'text-income' : 'text-expense')} style={{ fontSize: '0.95rem', color: isTransfer ? 'var(--text)' : undefined }}>
                      {isTransfer ? '⇅' : (isIncome ? '+' : '-')} {formatCurrency(tx.amount)}
                    </strong>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => onEditClick(tx)}
                        style={{ padding: '0.25rem', borderRadius: '6px' }}
                        title="Editar"
                      >
                        <Edit size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ color: 'var(--expense)', padding: '0.25rem', borderRadius: '6px' }}
                        onClick={() => onDeleteClick(tx.id)}
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
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
