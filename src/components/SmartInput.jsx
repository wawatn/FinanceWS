import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, X, Check } from 'lucide-react';
import { parseSmartInput } from '../utils/smartParser';
import { formatCurrency, formatDate } from '../utils/formatters';

export const SmartInput = ({ accounts, cards, onAddTransaction }) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const containerRef = useRef(null);

  // Inicializar Reconhecimento de Voz
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'pt-BR';
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permissão para microfone negada. Ative nas configurações do navegador.');
        } else {
          setErrorMessage('Erro ao escutar a voz. Tente digitar.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        handleProcessText(transcript);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      setErrorMessage('Reconhecimento de voz não suportado neste navegador. Digite seu lançamento.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setInputValue('');
      setParsedPreview(null);
      setErrorMessage('');
      recognition.start();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      handleProcessText(inputValue);
    }
  };

  const handleProcessText = (text) => {
    const parsed = parseSmartInput(text, accounts, cards);
    if (parsed && parsed.amount > 0) {
      setParsedPreview(parsed);
      setErrorMessage('');
    } else {
      setErrorMessage('Não consegui identificar o valor. Digite algo como "Padaria 15 reais no dinheiro".');
      setParsedPreview(null);
    }
  };

  const handleConfirm = () => {
    if (parsedPreview) {
      onAddTransaction(parsedPreview);
      setInputValue('');
      setParsedPreview(null);
    }
  };

  const handleCancel = () => {
    setParsedPreview(null);
  };

  // Helper para mostrar nome da conta/cartão detectado
  const getDestinationName = () => {
    if (!parsedPreview) return '';
    if (parsedPreview.cardId) {
      const card = cards.find(c => c.id === parsedPreview.cardId);
      return card ? card.name : 'Cartão';
    }
    if (parsedPreview.accountId) {
      const acc = accounts.find(a => a.id === parsedPreview.accountId);
      return acc ? acc.name : 'Conta';
    }
    return 'Não detectado';
  };

  return (
    <div className="col-12" ref={containerRef} style={{ marginBottom: '1rem' }}>
      <div className="card-base" style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--surface), var(--surface-secondary))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={18} className="text-income" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Lançamento Rápido Inteligente (Fale ou Digite)
          </span>
        </div>

        <form onSubmit={handleSubmit} className="smart-input-container">
          <button 
            type="button" 
            onClick={toggleListening}
            className={`btn-icon ${isListening ? 'pulse-red' : ''}`}
            style={{ 
              backgroundColor: isListening ? 'var(--expense)' : 'var(--surface)', 
              color: isListening ? '#ffffff' : 'var(--primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              transition: 'all 0.3s'
            }}
            title="Gravar por Voz"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input 
            type="text" 
            value={inputValue}
            onChange={handleInputChange}
            placeholder={isListening ? "Escutando... Diga ex: 'Gasolina 80 reais ontem'" : "Diga ou digite ex: 'Almoço 45 reais no Itaú hoje'"}
            className="smart-input-field"
            disabled={isListening}
          />

          <button 
            type="submit" 
            className="btn-icon" 
            style={{ borderRadius: '50%', width: '40px', height: '40px', color: 'var(--primary)' }}
            disabled={inputValue.trim() === '' || isListening}
          >
            <Send size={20} />
          </button>
        </form>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div style={{ color: 'var(--expense)', fontSize: '0.8rem', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
            {errorMessage}
          </div>
        )}

        {/* Preview do Lançamento Inteligente */}
        {parsedPreview && (
          <div 
            style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              borderRadius: '16px', 
              backgroundColor: 'var(--surface-hover)', 
              border: '1px solid var(--border)',
              animation: 'modalEnter 0.25s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                Visualização do Lançamento
              </span>
              <span className={`badge ${parsedPreview.type === 'income' ? 'badge-income' : 'badge-expense'}`} style={{ marginLeft: 'auto' }}>
                {parsedPreview.type === 'income' ? 'Receita' : 'Despesa'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Descrição</span>
                <strong style={{ fontSize: '0.95rem' }}>{parsedPreview.description}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valor</span>
                <strong style={{ fontSize: '1.1rem', color: parsedPreview.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                  {formatCurrency(parsedPreview.amount)}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Data</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(parsedPreview.date)}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Forma de Pagamento / Origem</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{getDestinationName()}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Categoria</span>
                <span className="badge badge-pending" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                  {parsedPreview.category}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleCancel} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <X size={16} />
                <span>Cancelar</span>
              </button>
              <button className="btn btn-primary" onClick={handleConfirm} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <Check size={16} />
                <span>Confirmar e Salvar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
