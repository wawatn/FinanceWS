import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card } from '../UI/Card';
import { formatCurrency } from '../../utils/formatters';

const CATEGORY_COLORS = {
  'Alimentação': '#ff7043', // Coral
  'Transporte': '#29b6f6',  // Azul
  'Moradia': '#ab47bc',     // Roxo
  'Lazer': '#ffca28',       // Amarelo
  'Assinaturas': '#26a69a', // Verde/Teal
  'Saúde': '#ef5350',       // Vermelho
  'Educação': '#5c6bc0',    // Indigo
  'Vestuário': '#ec407a',    // Rosa
  'Beleza': '#26c6da',      // Ciano
  'Outros': '#8d6e63',      // Marrom
};

export const CategoryChart = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filtrar despesas do mês atual
  const currentExpenses = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return tx.type === 'expense' && 
           txDate.getMonth() === currentMonth && 
           txDate.getFullYear() === currentYear;
  });

  // Agrupar por categoria
  const categoryTotals = currentExpenses.reduce((acc, curr) => {
    const cat = curr.category || 'Outros';
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {});

  // Formatar para Recharts
  const data = Object.keys(categoryTotals).map(catName => ({
    name: catName,
    value: Number(categoryTotals[catName].toFixed(2)),
  })).sort((a, b) => b.value - a.value);

  // Fallback se não houver despesas no mês
  const hasExpenses = data.length > 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{ 
            backgroundColor: 'var(--surface-secondary)', 
            border: '1px solid var(--border)', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}
        >
          <span style={{ fontWeight: 600 }}>{payload[0].name}: </span>
          <span style={{ color: 'var(--expense)', fontWeight: 700 }}>
            {formatCurrency(payload[0].value)}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-6" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Gastos por Categoria</h3>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasExpenses ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CATEGORY_COLORS[entry.name] || '#78909c'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconSize={10} 
                iconType="circle"
                wrapperStyle={{ fontSize: '0.75rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhuma despesa registrada neste mês.
          </div>
        )}
      </div>
    </Card>
  );
};
