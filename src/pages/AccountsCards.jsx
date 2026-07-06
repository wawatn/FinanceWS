import React, { useState } from 'react';
import { Card } from '../components/UI/Card';
import { formatCurrency } from '../utils/formatters';
import { Wallet, CreditCard, Plus, Edit2, Calendar, ShieldCheck, Trash2, Star } from 'lucide-react';

export const AccountsCards = ({ 
  accounts, 
  cards, 
  onAddAccount, 
  onEditAccount, 
  onAddCard, 
  onEditCard,
  onDeleteAccount,
  onDeleteCard,
  defaultAccountId,
  onSetDefaultAccount,
  onOpenAddModal // Função para abrir o modal unificado
}) => {
  const handleDeleteAccount = (id) => {
    if (window.confirm('Atenção: Excluir esta conta irá apagar todos os lançamentos associados a ela definitivamente. Deseja continuar?')) {
      onDeleteAccount(id);
    }
  };

  const handleDeleteCard = (id) => {
    if (window.confirm('Atenção: Excluir este cartão de crédito irá apagar todos os lançamentos associados a ele definitivamente. Deseja continuar?')) {
      onDeleteCard(id);
    }
  };
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
          {accounts.map((acc) => {
            const [colorPart, optionPart] = (acc.color || '').split('|');
            const sumInTotal = optionPart !== 'noSum';
            const accountColor = colorPart || 'var(--primary)';

            return (
              <Card key={acc.id} style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Faixa lateral colorida */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    width: '6px', 
                    backgroundColor: accountColor 
                  }} 
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem' }}>{acc.name}</strong>
                      {acc.id === defaultAccountId && (
                        <span style={{ 
                          backgroundColor: 'rgba(255, 215, 0, 0.15)', 
                          color: '#FFB300', 
                          fontSize: '0.625rem', 
                          padding: '0.08rem 0.35rem', 
                          borderRadius: '6px', 
                          fontWeight: 700,
                          border: '1px solid rgba(255, 215, 0, 0.25)',
                          letterSpacing: '0.3px',
                          textTransform: 'uppercase'
                        }}>
                          Principal
                        </span>
                      )}
                      {!sumInTotal && (
                        <span style={{ 
                          backgroundColor: 'rgba(255, 76, 76, 0.1)', 
                          color: 'var(--expense)', 
                          fontSize: '0.625rem', 
                          padding: '0.08rem 0.35rem', 
                          borderRadius: '6px', 
                          fontWeight: 700,
                          border: '1px solid rgba(255, 76, 76, 0.2)',
                          letterSpacing: '0.3px',
                          textTransform: 'uppercase'
                        }}>
                          Ignorado
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {acc.type === 'checking' ? 'Conta Corrente' : (acc.type === 'savings' ? 'Poupança' : 'Dinheiro em Espécie')}
                    </span>
                  </div>
                
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {/* Estrela de Conta Principal */}
                  <button
                    className="btn-icon"
                    onClick={() => onSetDefaultAccount(acc.id)}
                    style={{ 
                      padding: '0.35rem', 
                      color: acc.id === defaultAccountId ? '#FFD700' : 'var(--text-secondary)',
                      backgroundColor: acc.id === defaultAccountId ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                      borderRadius: '8px'
                    }}
                    title={acc.id === defaultAccountId ? "Conta Principal Ativa" : "Definir como Conta Principal"}
                  >
                    <Star size={14} fill={acc.id === defaultAccountId ? "#FFD700" : "none"} />
                  </button>

                  <button 
                    className="btn-icon" 
                    onClick={() => onOpenAddModal('account', acc)}
                    style={{ padding: '0.35rem' }}
                    title="Editar Conta"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="btn-icon" 
                    onClick={() => handleDeleteAccount(acc.id)}
                    style={{ padding: '0.35rem', color: 'var(--expense)' }}
                    title="Excluir Conta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ paddingLeft: '0.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saldo Disponível</span>
                <strong style={{ fontSize: '1.45rem', color: acc.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {formatCurrency(acc.balance)}
                </strong>
              </div>
            </Card>
            );
          })}
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
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => onOpenAddModal('card', card)}
                      style={{ padding: '0.35rem' }}
                      title="Editar Cartão"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteCard(card.id)}
                      style={{ padding: '0.35rem', color: 'var(--expense)' }}
                      title="Excluir Cartão"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
