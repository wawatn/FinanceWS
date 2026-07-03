import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency } from '../utils/formatters';
import { Wallet, CreditCard, Plus, Edit2, Calendar, ShieldCheck } from 'lucide-react';

export const AccountsCards = ({ 
  accounts, 
  cards, 
  onAddAccount, 
  onEditAccount, 
  onAddCard, 
  onEditCard,
  onOpenAddModal // Função para abrir o modal unificado
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* SEÇÃO: CONTAS BANCÁRIAS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet className="text-income" size={20} />
            Contas Bancárias ({accounts.length})
          </h3>
          <button 
            className="btn btn-secondary" 
            onClick={() => onOpenAddModal('account')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Nova Conta</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {accounts.map((acc) => (
            <Card key={acc.id} style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Faixa lateral colorida */}
              <div 
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: 0, 
                  bottom: 0, 
                  width: '6px', 
                  backgroundColor: acc.color || 'var(--primary)' 
                }} 
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem' }}>{acc.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {acc.type === 'checking' ? 'Conta Corrente' : (acc.type === 'savings' ? 'Poupança' : 'Dinheiro em Espécie')}
                  </span>
                </div>
                
                <button 
                  className="btn-icon" 
                  onClick={() => onOpenAddModal('account', acc)}
                  style={{ padding: '0.35rem' }}
                  title="Editar Conta"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <div style={{ paddingLeft: '0.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saldo Disponível</span>
                <strong style={{ fontSize: '1.45rem', color: acc.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {formatCurrency(acc.balance)}
                </strong>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SEÇÃO: CARTÕES DE CRÉDITO */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard className="text-expense" size={20} />
            Cartões de Crédito ({cards.length})
          </h3>
          <button 
            className="btn btn-secondary" 
            onClick={() => onOpenAddModal('card')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Novo Cartão</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {cards.map((card) => {
            const availableLimit = card.limit - card.invoice;
            const percentageUsed = card.limit > 0 ? (card.invoice / card.limit) * 100 : 0;

            return (
              <Card key={card.id} style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Faixa lateral colorida */}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem' }}>{card.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={12} />
                      Vence dia {card.dueDay} • Fecha dia {card.closingDay}
                    </span>
                  </div>
                  
                  <button 
                    className="btn-icon" 
                    onClick={() => onOpenAddModal('card', card)}
                    style={{ padding: '0.35rem' }}
                    title="Editar Cartão"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingLeft: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fatura Atual</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--expense)' }}>{formatCurrency(card.invoice)}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Limite Disponível</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--income)' }}>{formatCurrency(availableLimit)}</strong>
                  </div>
                </div>

                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <span>Limite Usado: {percentageUsed.toFixed(0)}%</span>
                    <span>Total: {formatCurrency(card.limit)}</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(percentageUsed, 100)}%`, 
                        backgroundColor: card.color || 'var(--primary)',
                        transition: 'width 0.4s'
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
