import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Calendar, Plus, Check } from 'lucide-react';
import { parseOFX, reconcileTransactions } from '../../utils/ofxParser';
import { formatCurrency, formatDate } from '../../utils/formatters';

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
  'Rendimentos',
  'Outros'
];

export const OfxImportModal = ({ isOpen, onClose, transactions, accounts, cards, onImport }) => {
  const [selectedDestType, setSelectedDestType] = useState('account'); // account ou card
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id || '');
  
  const [fileName, setFileName] = useState('');
  const [reconciliationResult, setReconciliationResult] = useState(null); // { reconciled: [], unmatched: [] }
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    setFileName('');
    setReconciliationResult(null);
    setErrorMsg('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ofx')) {
      setErrorMsg('Por favor, faça upload de um arquivo com extensão .ofx válido.');
      return;
    }

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsedTxs = parseOFX(text);

        if (parsedTxs.length === 0) {
          setErrorMsg('Nenhuma transação encontrada no arquivo OFX. Verifique se o arquivo está correto.');
          return;
        }

        // Executar conciliação
        const accId = selectedDestType === 'account' ? selectedAccountId : null;
        const crdId = selectedDestType === 'card' ? selectedCardId : null;

        const results = reconcileTransactions(parsedTxs, transactions, accId, crdId);
        setReconciliationResult(results);
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao processar o arquivo OFX. Formato inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
  };

  const handleCategoryChange = (index, newCategory) => {
    if (!reconciliationResult) return;
    
    const updatedUnmatched = [...reconciliationResult.unmatched];
    updatedUnmatched[index].category = newCategory;

    setReconciliationResult({
      ...reconciliationResult,
      unmatched: updatedUnmatched
    });
  };

  const handleImportSubmit = () => {
    if (!reconciliationResult) return;

    const accId = selectedDestType === 'account' ? selectedAccountId : null;
    const crdId = selectedDestType === 'card' ? selectedCardId : null;

    onImport(
      reconciliationResult.reconciled,
      reconciliationResult.unmatched,
      accId,
      crdId
    );

    handleReset();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            Conciliação Automática por Extrato OFX
          </h3>
          <button className="btn-icon" onClick={() => { handleReset(); onClose(); }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Seletor de Destino (Conta ou Cartão) */}
          {!reconciliationResult && (
            <div>
              <label>Vincular extrato a qual Conta ou Cartão?</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    padding: '0.5rem',
                    border: `1px solid ${selectedDestType === 'account' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: selectedDestType === 'account' ? 'var(--primary-glow)' : 'transparent',
                    color: selectedDestType === 'account' ? 'var(--text)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setSelectedDestType('account')}
                >
                  Conta Bancária
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    padding: '0.5rem',
                    border: `1px solid ${selectedDestType === 'card' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: selectedDestType === 'card' ? 'var(--primary-glow)' : 'transparent',
                    color: selectedDestType === 'card' ? 'var(--text)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setSelectedDestType('card')}
                >
                  Cartão de Crédito
                </button>
              </div>

              {selectedDestType === 'account' ? (
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                >
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>{card.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Upload Area */}
          {!reconciliationResult ? (
            <div 
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '16px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--surface-secondary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative'
              }}
            >
              <UploadCloud size={40} className="text-income" />
              <div>
                <strong>Clique ou arraste seu arquivo .OFX</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Extrato bancário exportado do aplicativo do seu banco
                </span>
              </div>
              <input 
                type="file" 
                accept=".ofx"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
              <AlertCircle size={16} className="text-income" />
              <span style={{ fontSize: '0.85rem' }}>
                Arquivo processado: <strong>{fileName}</strong>
              </span>
              <button 
                onClick={handleReset} 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', marginLeft: 'auto' }}
              >
                Trocar Arquivo
              </button>
            </div>
          )}

          {errorMsg && (
            <div style={{ color: 'var(--expense)', display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resultados da Conciliação */}
          {reconciliationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Lançamentos Reconciliados (Duplicidade evitada) */}
              {reconciliationResult.reconciled.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--income)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={14} />
                    Lançamentos Conciliados ({reconciliationResult.reconciled.length}) - <em>Duplicados evitados</em>
                  </h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {reconciliationResult.reconciled.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem', 
                          borderRadius: '8px', 
                          backgroundColor: 'rgba(0, 230, 118, 0.05)', 
                          border: '1px solid rgba(0, 230, 118, 0.1)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <strong>{item.description}</strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Extrato: {formatDate(item.date)} | Batimento com: "{item.matchedWith.description}"
                          </span>
                        </div>
                        <strong className="text-income">{formatCurrency(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lançamentos Novos a serem importados */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Plus size={14} />
                  Lançamentos Importados Automático ({reconciliationResult.unmatched.length})
                </h4>
                {reconciliationResult.unmatched.length > 0 ? (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {reconciliationResult.unmatched.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.6rem 0.75rem', 
                          borderRadius: '10px', 
                          backgroundColor: 'var(--surface-secondary)', 
                          border: '1px solid var(--border)',
                          fontSize: '0.8rem',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong>{item.description}</strong>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            <Calendar size={10} />
                            {formatDate(item.date)}
                          </span>
                        </div>

                        {/* Dropdown de categoria sugerida */}
                        <div style={{ width: '120px' }}>
                          <select 
                            value={item.category} 
                            onChange={(e) => handleCategoryChange(idx, e.target.value)}
                            style={{ padding: '0.2rem 0.4rem', borderRadius: '6px', fontSize: '0.75rem' }}
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <strong className={item.type === 'income' ? 'text-income' : 'text-expense'} style={{ minWidth: '80px', textAlign: 'right' }}>
                          {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Nenhum lançamento novo para importar (todos já constam no app).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { handleReset(); onClose(); }}>
            Cancelar
          </button>
          {reconciliationResult && (
            <button type="button" className="btn btn-primary" onClick={handleImportSubmit}>
              <Check size={18} />
              Confirmar Importação
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
