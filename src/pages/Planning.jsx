import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency } from '../utils/formatters';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Edit2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Tags 
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Assinaturas',
  'Saúde',
  'Educação',
  'Vestuário',
  'Beleza',
  'Outros'
];

const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Helper para gerar cores únicas para categorias personalizadas
const getCategoryColor = (name) => {
  const defaults = {
    'Alimentação': '#ff9f43',
    'Transporte': '#00d2d3',
    'Moradia': '#ff9ff3',
    'Lazer': '#54a0ff',
    'Assinaturas': '#5f27cd',
    'Saúde': '#ee5253',
    'Educação': '#10ac84',
    'Vestuário': '#ff6b6b',
    'Beleza': '#f368e0',
    'Rendimentos': '#1dd1a1',
    'Outros': '#8395a7'
  };
  if (defaults[name]) return defaults[name];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const Planning = ({ 
  budgets = [], 
  transactions = [], 
  customCategories = [], 
  addCustomCategory, 
  deleteCustomCategory, 
  onUpdateBudget 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempLimit, setTempLimit] = useState('');
  const [newCatInput, setNewCatInput] = useState('');

  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Lista unificada de categorias (Padrão + Customizadas)
  const allCategories = [...STANDARD_CATEGORIES, ...customCategories];

  // Filtrar despesas específicas do mês/ano selecionado
  const monthlyExpenses = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return tx.type === 'expense' && 
           txDate.getMonth() === selectedMonth && 
           txDate.getFullYear() === selectedYear;
  });

  // Agrupar gastos reais por categoria no mês ativo
  const categorySpent = monthlyExpenses.reduce((acc, curr) => {
    const cat = curr.category || 'Outros';
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {});

  // Recupera o orçamento da categoria para o mês selecionado
  const getCategoryLimit = (cat) => {
    // 1. Procurar orçamento específico do mês: "Categoria_2026-07"
    const specific = budgets.find(b => b.category === `${cat}_${monthStr}`);
    if (specific) return specific.limit;

    // 2. Fallback: orçamento legado sem data (apenas se for o mês atual)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      const legacy = budgets.find(b => b.category === cat);
      if (legacy) return legacy.limit;
    }

    return 0;
  };

  const handleEditClick = (category, currentLimit) => {
    setEditingCategory(category);
    setTempLimit(
      currentLimit 
        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentLimit)
        : ''
    );
  };

  const handleLimitChange = (e) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setTempLimit('');
      return;
    }
    const numericValue = parseFloat(digits) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
    setTempLimit(formatted);
  };

  const handleSave = (category) => {
    const cleanStr = tempLimit.replace(/\./g, '').replace(',', '.');
    const limitNum = parseFloat(cleanStr);
    if (!isNaN(limitNum) && limitNum >= 0) {
      // Salva concatenando o sufixo temporal do mês ativo
      const dbCategoryName = `${category}_${monthStr}`;
      onUpdateBudget(dbCategoryName, limitNum);
      setEditingCategory(null);
    } else {
      alert('Por favor, insira um valor de limite válido.');
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
    setEditingCategory(null);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
    setEditingCategory(null);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    const name = newCatInput.trim();
    if (!name) return;
    addCustomCategory(name);
    setNewCatInput('');
  };

  // Cálculos Gerais do Mês Ativo
  const activeMonthBudgets = allCategories.map(cat => ({
    category: cat,
    limit: getCategoryLimit(cat),
    spent: categorySpent[cat] || 0
  })).filter(item => item.limit > 0);

  const totalLimit = activeMonthBudgets.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = activeMonthBudgets.reduce((acc, curr) => acc + curr.spent, 0);
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. HEADER CARD COM NAVEGAÇÃO DE MESES E RESUMO FINANCEIRO */}
      <Card style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface-secondary))', padding: '1.5rem' }}>
        
        {/* Seletor de Mês/Ano */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button onClick={handlePrevMonth} className="btn-icon" style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <ChevronLeft size={20} />
          </button>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>
            {MONTHS_BR[selectedMonth]} {selectedYear}
          </h2>
          
          <button onClick={handleNextMonth} className="btn-icon" style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Resumos Numéricos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.2rem', textAlign: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Planejado Total</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--text)' }}>{formatCurrency(totalLimit)}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Gasto Real</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--expense)' }}>{formatCurrency(totalSpent)}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Disponível</span>
            <strong style={{ fontSize: '1.15rem', color: totalLimit - totalSpent >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatCurrency(totalLimit - totalSpent)}
            </strong>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        {totalLimit > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.4rem', fontWeight: 500 }}>
              <span>Orçamento Geral Consumido</span>
              <span>{overallPercentage.toFixed(1)}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${Math.min(overallPercentage, 100)}%`, 
                  backgroundColor: overallPercentage > 100 ? 'var(--expense)' : (overallPercentage > 85 ? 'var(--warning)' : 'var(--primary)'),
                  transition: 'width 0.4s'
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 2. GRID DE METAS DAS CATEGORIAS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Target className="text-income" size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Metas por Categoria</h3>
        </div>

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '1.25rem' 
          }}
        >
          {allCategories.map((category) => {
            const limit = getCategoryLimit(category);
            const spent = categorySpent[category] || 0;
            const available = limit - spent;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const color = getCategoryColor(category);
            
            const isOverBudget = spent > limit && limit > 0;
            const isEditing = editingCategory === category;

            // Se não tem meta definida, exibe um design clean/dashed convidando a criar
            if (limit === 0 && !isEditing) {
              return (
                <div 
                  key={category}
                  onClick={() => handleEditClick(category, 0)}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '18px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.01)',
                    transition: 'all 0.2s'
                  }}
                  className="card-meta-add-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{category}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Plus size={12} /> Definir Meta
                  </span>
                </div>
              );
            }

            return (
              <Card 
                key={category} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.85rem',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Linha colorida na lateral esquerda */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    width: '6px', 
                    backgroundColor: color 
                  }} 
                />

                {/* Header do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{category}</strong>
                  
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => handleSave(category)} 
                        className="btn-icon" 
                        style={{ color: 'var(--income)', padding: '0.25rem' }}
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={handleCancel} 
                        className="btn-icon" 
                        style={{ color: 'var(--expense)', padding: '0.25rem' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEditClick(category, limit)} 
                      className="btn-icon"
                      style={{ color: 'var(--text-secondary)', padding: '0.25rem' }}
                      title="Alterar Meta"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {/* Gasto Atual vs Limite */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: '0.5rem' }}>
                  <div>
                    {isEditing ? (
                      <div>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Novo Limite</span>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={tempLimit} 
                          onChange={handleLimitChange}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '110px', height: '34px', borderRadius: '8px' }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Consumo</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <strong>{formatCurrency(spent)}</strong> de <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(limit)}</span>
                        </span>
                      </>
                    )}
                  </div>
                  
                  {!isEditing && (
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '8px',
                        backgroundColor: isOverBudget ? 'rgba(255,82,82,0.1)' : 'rgba(0,230,118,0.1)',
                        color: isOverBudget ? 'var(--expense)' : 'var(--income)'
                      }}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Progress Bar com gradiente */}
                {!isEditing && (
                  <div style={{ paddingLeft: '0.5rem' }}>
                    <div style={{ height: '7px', backgroundColor: 'var(--surface-secondary)', borderRadius: '3.5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${Math.min(percentage, 100)}%`, 
                          backgroundColor: percentage > 100 ? 'var(--expense)' : (percentage > 80 ? 'var(--warning)' : color),
                          transition: 'width 0.4s'
                        }}
                      />
                    </div>
                    
                    {/* Status informativo no rodapé */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: isOverBudget ? 'var(--expense)' : 'var(--text-secondary)' }}>
                        {isOverBudget ? (
                          <>
                            <AlertTriangle size={12} />
                            Estourou em {formatCurrency(Math.abs(available))}
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} className="text-income" />
                            Restam {formatCurrency(available)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. GERENCIAR CATEGORIAS PERSONALIZADAS */}
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Tags className="text-income" size={18} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Categorias Personalizadas</h3>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
          Crie suas próprias categorias de gastos. Elas aparecerão automaticamente para você lançar despesas e definir metas mensais.
        </p>

        {/* Input para adicionar nova categoria */}
        <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
          <input 
            type="text" 
            placeholder="Ex: Ração Dog, Academia, Games..."
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            style={{ flex: 1, borderRadius: '10px', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.85rem', gap: '0.2rem' }}>
            <Plus size={16} /> Adicionar
          </button>
        </form>

        {/* Listagem de categorias criadas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {customCategories.length > 0 ? (
            customCategories.map(cat => (
              <div 
                key={cat} 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.4rem 0.75rem', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--surface-secondary)', 
                  border: '1px solid var(--border)',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getCategoryColor(cat) }} />
                <span>{cat}</span>
                <button 
                  type="button" 
                  onClick={() => deleteCustomCategory(cat)}
                  className="btn-icon" 
                  style={{ color: 'var(--expense)', padding: '0.1rem', marginLeft: '0.25rem' }}
                  title="Excluir Categoria"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Nenhuma categoria criada ainda. Digite acima para criar.
            </span>
          )}
        </div>
      </Card>
      
    </div>
  );
};
