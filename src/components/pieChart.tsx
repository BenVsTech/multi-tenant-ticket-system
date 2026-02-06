// Imports

'use client'
import { PieChart as RechartsPieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { PieChartProps } from '@/types/component'

// Functions

const renderCustomLabel = (entry: any) => {
  const { value } = entry
  
  if (value === 0) {
    return null
  }

  const RADIAN = Math.PI / 180
  const { cx, cy, midAngle, innerRadius, outerRadius } = entry
  const radius = innerRadius + (outerRadius - innerRadius) * 0.80
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={14}
      fontWeight="600"
    >
      {value}
    </text>
  )
}

// Exports

export default function PieChart({ setup, onClick }: PieChartProps) {
  const cursorStyle = setup.clickable ? { cursor: 'pointer' } : {}
  
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <RechartsPieChart style={cursorStyle}>
        <Pie
          data={setup.data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius="75%"
          innerRadius="0%"
          label={renderCustomLabel}
          labelLine={false}
          onClick={(_, index) => {
            if (!onClick) return
            onClick(setup.data[index].id)
          }}
        >
          {setup.data.map((entry: any, index: number) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill}
              style={setup.clickable ? { cursor: 'pointer' } : {}}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend 
          verticalAlign="bottom" 
          height={60}
          iconType="circle"
          wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

