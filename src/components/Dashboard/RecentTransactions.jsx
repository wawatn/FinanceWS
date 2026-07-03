import React from 'react';
import { Card } from '../UI/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Coffee, 
  Car, 
  Home, 
  Film, 
  ShoppingBag, 
  HeartPulse, 
  GraduationCap, 
  Sparkles, 
  DollarSign,
  Trash2,
  Edit,
  Circle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

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

export const RecentTransactions = ({ 
  transactions, 
  onEditTransaction, 
  onDeleteTransaction, 
  onToggleStatus, 
  onViewAll 
}) => {
  const recent = transactions.slice(0, 5);

  const getIcon = (category, type) => {
    if (type === 'transfer') return <RefreshCw size={18} />;
    const IconComponent = CATEGORY_ICONS[category] || (type === 'income' ? DollarSign : ShoppingBag);
    return <IconComponent size={18} />;
  };

  return (
    <Card className="col-8" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Últimos Lançamentos</h3>
        <button 
          onClick={onViewAll} 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
        >
          Ver Todos
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {recent.length > 0 ? (
          recent.map((tx) => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            return (
              <div 
                key={tx.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.8rem 1rem',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  opacity: tx.status === 'pending' ? 0.8 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  
                  {/* Interruptor Rápido de Status (Pago vs Pendente) */}
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
                    title={tx.status === 'confirmed' ? 'Lançamento Confirmado (Clique para marcar como Pendente)' : 'Lançamento Pendente (Clique para Confirmar)'}
                  >
                    {tx.status === 'confirmed' ? <CheckCircle size={18} /> : <Circle size={18} />}
                  </button>

                  {/* Ícone de categoria */}
                  <div 
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '12px', 
                      backgroundColor: isTransfer ? 'rgba(var(--primary-rgb), 0.1)' : (isIncome ? 'var(--income-glow)' : 'var(--expense-glow)'),
                      color: isTransfer ? 'var(--primary)' : (isIncome ? 'var(--income)' : 'var(--expense)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getIcon(tx.category, tx.type)}
                  </div>
                  
                  <div>
                    <strong style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      color: tx.status === 'pending' ? 'var(--text-secondary)' : 'var(--text)',
                      textDecoration: tx.status === 'pending' ? 'none' : 'none'
                    }}>
                      {tx.description}
                      {tx.installmentNumber && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', backgroundColor: 'var(--surface)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          {tx.installmentNumber}/{tx.totalInstallments}
                        </span>
                      )}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatDate(tx.date)} • <span style={{ textTransform: 'lowercase' }}>{tx.category}</span>
                      {tx.status === 'pending' && (
                        <span style={{ color: 'var(--expense)', marginLeft: '0.5rem', fontWeight: 600 }}>• Pendente</span>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span 
                    style={{ 
                      fontWeight: 700, 
                      fontSize: '0.95rem',
                      color: isTransfer ? 'var(--text)' : (isIncome ? 'var(--income)' : 'var(--expense)')
                    }}
                  >
                    {isTransfer ? '⇅' : (isIncome ? '+' : '-')} {formatCurrency(tx.amount)}
                  </span>

                  {/* Ações Rápidas */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => onEditTransaction(tx)} 
                      className="btn-icon" 
                      style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--text-secondary)' }}
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => onDeleteTransaction(tx.id)} 
                      className="btn-icon" 
                      style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--expense)' }}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhuma transação cadastrada ainda.
          </div>
        )}
      </div>
    </Card>
  );
};
