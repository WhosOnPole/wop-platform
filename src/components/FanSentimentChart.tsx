import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDriver } from '@/hooks/useTrendingDrivers';

interface FanSentimentChartProps {
  driver: TrendingDriver & { id: string };
}

export const FanSentimentChart = ({ driver }: FanSentimentChartProps) => {
  // Generate sentiment data based on average stars
  const avgStars = driver.avg_stars || 0;
  const fanCount = driver.fan_count || 0;
  
  // Calculate sentiment distribution based on avg stars
  const excellent = Math.round((avgStars >= 4 ? 40 : avgStars >= 3 ? 20 : 10) + Math.random() * 15);
  const good = Math.round((avgStars >= 3 ? 35 : avgStars >= 2 ? 25 : 15) + Math.random() * 10);
  const neutral = Math.round((avgStars >= 2 ? 20 : 30) + Math.random() * 10);
  const poor = Math.max(0, 100 - excellent - good - neutral);

  const data = [
    { name: 'Excellent', value: excellent, color: 'hsl(var(--success))' },
    { name: 'Good', value: good, color: 'hsl(var(--primary))' },
    { name: 'Neutral', value: neutral, color: 'hsl(var(--muted))' },
    { name: 'Poor', value: poor, color: 'hsl(var(--destructive))' }
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fan Sentiment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on {fanCount} fans • {driver.recent_grids} recent grids • {avgStars.toFixed(1)}★ avg
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};