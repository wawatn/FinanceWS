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
  FileText
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
  onDeleteClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSource, setSelectedSource] = useState('Todos'); // 'Todos', accountId, cardId
  
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
    const txDate = new Date(tx.date);
    const sameMonth = txDate.getMonth() === currentDate.getMonth() && 
                      txDate.getFullYear() === currentDate.getFullYear();
    
    if (!sameMonth) return false;

    // Busca textual
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Categoria
    const matchesCategory = selectedCategory === 'Todos' || tx.category === selectedCategory;

    // Conta ou Cartão
    let matchesSource = true;
    if (selectedSource !== 'Todos') {
      if (selectedSource.startsWith('card-')) {
        matchesSource = tx.cardId === selectedSource;
      } else {
        matchesSource = tx.accountId === selectedSource;
      }
    }

    return matchesSearch && matchesCategory && matchesSource;
  });

  const getDestinationLabel = (tx) => {
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
            <button className="btn btn-secondary btn-icon" onClick={handlePrevMonth} style={{ borderRadius: '50%' }}>
              <ArrowLeft size={16} />
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, minWidth: '180px', textAlign: 'center' }}>
              {getMonthYearString()}
            </h3>
            <button className="btn btn-secondary btn-icon" onClick={handleNextMonth} style={{ borderRadius: '50%' }}>
              <ArrowRight size={16} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={onAddClick}>
            <Plus size={18} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </Card>

      {/* Grid de Filtros e Busca */}
      <Card style={{ padding: '1.25rem' }}>
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
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
                  <option key={card.id} value={card.id}>{card.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Transações */}
      <Card style={{ padding: '0' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
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
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {tx.status === 'confirmed' ? (
                            <CheckCircle size={16} className="text-income" title="Confirmado/Conciliado" />
                          ) : (
                            <FileText size={16} style={{ color: 'var(--text-secondary)' }} title="Pendente" />
                          )}
                          <strong style={{ fontSize: '0.9rem' }}>{tx.description}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-pending">{tx.category}</span>
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
                        <strong className={isIncome ? 'text-income' : 'text-expense'} style={{ fontSize: '0.9rem' }}>
                          {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Nenhum lançamento encontrado para os filtros selecionados neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
