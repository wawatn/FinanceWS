import React from 'react';
import { Card } from '../components/UI/Card';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  CartesianGrid 
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';

export const Reports = ({ transactions }) => {
  
  // 1. Processar dados dos últimos 6 meses para Fluxo de Caixa
  const getMonthlyFlowData = () => {
    const data = [];
    const now = new Date();
    
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      // Filtrar lançamentos desse mês e ano
      const monthTx = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === m && txDate.getFullYear() === y;
      });

      const income = monthTx
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expense = monthTx
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      data.push({
        name: `${monthNames[m]}/${String(y).slice(-2)}`,
        Receitas: Number(income.toFixed(2)),
        Despesas: Number(expense.toFixed(2)),
      });
    }

    return data;
  };

  // 2. Processar gastos de categoria históricos
  const getCategoryDistribution = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const expenses = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.type === 'expense' && 
             txDate.getMonth() === currentMonth && 
             txDate.getFullYear() === currentYear;
    });

    const categoryTotals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      Total: Number(categoryTotals[cat].toFixed(2))
    })).sort((a, b) => b.Total - a.Total);
  };

  const monthlyFlowData = getMonthlyFlowData();
  const categoryData = getCategoryDistribution();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{ 
            backgroundColor: 'var(--surface)', 
            border: '1px solid var(--border)', 
            padding: '0.75rem', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontSize: '0.85rem'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{label}</strong>
          {payload.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', color: p.color }}>
              <span>{p.name}: </span>
              <strong>{formatCurrency(p.value)}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Gráfico 1: Fluxo de Caixa Mensal (Últimos 6 meses) */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <BarChart3 className="text-income" size={22} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Fluxo de Caixa (Últimos 6 Meses)</h3>
        </div>

        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Bar dataKey="Receitas" fill="var(--income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="var(--expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid Inferior: Categorias & Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: '1.5rem' }}>
        
        {/* Gráfico 2: Ranking de Gastos por Categoria */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ranking de Gastos por Categoria (Mês Atual)</h3>
          
          <div style={{ height: '260px' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={categoryData} 
                  margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} horizontal={false} />
                  <XAxis type="number" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Total" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Nenhuma despesa registrada no mês atual para o ranking.
              </div>
            )}
          </div>
        </Card>

        {/* Card de Insight Financeiro */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--surface), var(--surface-secondary))' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Award className="text-income" size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dica Financeira</h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              "Mantenha seus custos de <strong>Assinaturas</strong> e <strong>Lazer</strong> abaixo de 20% da sua renda mensal. O Mobills recomenda direcionar pelo menos 10% de seus rendimentos direto para sua poupança ou investimentos antes mesmo de começar a pagar suas despesas."
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp className="text-income" size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Parabéns por cuidar do seu dinheiro!</span>
          </div>
        </Card>

      </div>
    </div>
  );
};
