import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency } from '../utils/formatters';
import { Target, AlertTriangle, CheckCircle, Edit2, Check, X } from 'lucide-react';

const CATEGORIES = [
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

export const Planning = ({ budgets, transactions, onUpdateBudget }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempLimit, setTempLimit] = useState('');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filtrar despesas do mês atual
  const currentExpenses = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return tx.type === 'expense' && 
           txDate.getMonth() === currentMonth && 
           txDate.getFullYear() === currentYear;
  });

  // Agrupar gastos reais por categoria
  const categorySpent = currentExpenses.reduce((acc, curr) => {
    const cat = curr.category || 'Outros';
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {});

  const handleEditClick = (category, currentLimit) => {
    setEditingCategory(category);
    setTempLimit(String(currentLimit));
  };

  const handleSave = (category) => {
    const limitNum = parseFloat(tempLimit);
    if (!isNaN(limitNum) && limitNum >= 0) {
      onUpdateBudget(category, limitNum);
      setEditingCategory(null);
    } else {
      alert('Por favor, insira um valor de limite válido.');
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
  };

  // Calcular planejamento geral
  const totalLimit = budgets.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = Object.keys(categorySpent).reduce((acc, cat) => {
    // Apenas somar se a categoria estiver nos budgets ou considerar tudo
    return acc + categorySpent[cat];
  }, 0);
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Resumo Geral de Orçamentos */}
      <Card style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface-secondary))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Target className="text-income" size={24} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Resumo de Orçamentos do Mês</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Planejado Total</span>
            <strong style={{ fontSize: '1.3rem' }}>{formatCurrency(totalLimit)}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gasto Real Total</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--expense)' }}>{formatCurrency(totalSpent)}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Disponível Total</span>
            <strong style={{ fontSize: '1.3rem', color: totalLimit - totalSpent >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatCurrency(totalLimit - totalSpent)}
            </strong>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 500 }}>
            <span>Orçamento Geral Consumido</span>
            <span>{overallPercentage.toFixed(1)}%</span>
          </div>
          <div style={{ height: '10px', backgroundColor: 'var(--background)', borderRadius: '5px', overflow: 'hidden' }}>
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
      </Card>

      {/* Grid de Orçamentos das Categorias */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {CATEGORIES.map((category) => {
          const budget = budgets.find(b => b.category === category) || { category, limit: 0 };
          const spent = categorySpent[category] || 0;
          const available = budget.limit - spent;
          const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
          
          const isOverBudget = spent > budget.limit && budget.limit > 0;
          const isEditing = editingCategory === category;

          return (
            <Card key={category} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header do Card da Categoria */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem' }}>{category}</strong>
                
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => handleSave(category)} 
                      className="btn-icon" 
                      style={{ color: 'var(--income)', padding: '0.3rem' }}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={handleCancel} 
                      className="btn-icon" 
                      style={{ color: 'var(--expense)', padding: '0.3rem' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleEditClick(category, budget.limit)} 
                    className="btn-icon"
                    style={{ color: 'var(--text-secondary)', padding: '0.3rem' }}
                    title="Definir Orçamento"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              {/* Informações Numéricas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Limite</span>
                  {isEditing ? (
                    <input 
                      type="number" 
                      value={tempLimit} 
                      onChange={(e) => setTempLimit(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '100px' }}
                      autoFocus
                    />
                  ) : (
                    <strong style={{ fontSize: '1rem' }}>
                      {budget.limit > 0 ? formatCurrency(budget.limit) : 'Sem Meta'}
                    </strong>
                  )}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gasto Real</span>
                  <strong style={{ fontSize: '1rem', color: spent > 0 ? 'var(--text)' : 'var(--text-secondary)' }}>
                    {formatCurrency(spent)}
                  </strong>
                </div>
              </div>

              {/* Barra de Progresso */}
              {budget.limit > 0 && (
                <div>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(percentage, 100)}%`, 
                        backgroundColor: percentage > 100 ? 'var(--expense)' : (percentage > 80 ? 'var(--warning)' : 'var(--primary)'),
                        transition: 'width 0.4s'
                      }}
                    />
                  </div>
                  
                  {/* Mensagem e percentual */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isOverBudget ? 'var(--expense)' : 'var(--text-secondary)' }}>
                      {isOverBudget ? (
                        <>
                          <AlertTriangle size={12} />
                          Estourou em {formatCurrency(Math.abs(available))}
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} className="text-income" />
                          Resta {formatCurrency(available)}
                        </>
                      )}
                    </span>
                    <strong>{percentage.toFixed(0)}%</strong>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
