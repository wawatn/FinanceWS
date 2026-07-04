import React from 'react';
import { Card } from '../UI/Card';
import { CreditCard, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const CardLimits = ({ cards, onManage, className }) => {
  return (
    <Card className={className !== undefined ? className : "col-4"} style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Meus Cartões</h3>
        <button 
          onClick={onManage} 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
        >
          Gerenciar
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cards.length > 0 ? (
          cards.map((card) => {
            const availableLimit = card.limit - card.invoice;
            const limitPercentage = card.limit > 0 ? (card.invoice / card.limit) * 100 : 0;
            
            return (
              <div 
                key={card.id} 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '18px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--surface-secondary)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Linha decorativa colorida na lateral esquerda */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    width: '6px', 
                    backgroundColor: card.color || 'var(--primary)' 
                  }} 
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={16} style={{ color: card.color }} />
                    <strong style={{ fontSize: '0.9rem' }}>{card.name}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fatura Atual</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--expense)' }}>{formatCurrency(card.invoice)}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Limite Disp.</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--income)' }}>{formatCurrency(availableLimit)}</strong>
                  </div>
                </div>

                {/* Progress bar de uso de limite */}
                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(limitPercentage, 100)}%`, 
                        backgroundColor: card.color || 'var(--primary)',
                        transition: 'width 0.4s'
                      }}
                    />
                  </div>
                </div>

                {/* Datas de Fechamento/Vencimento */}
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Calendar size={12} />
                    Fechamento: <strong>dia {card.closingDay}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Calendar size={12} />
                    Vencimento: <strong>dia {card.dueDay}</strong>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum cartão cadastrado ainda.
          </div>
        )}
      </div>
    </Card>
  );
};
