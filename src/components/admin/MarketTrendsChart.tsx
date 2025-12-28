import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  demand: { label: "Demand (MT)", color: "hsl(var(--primary))" },
  price: { label: "Price Index", color: "hsl(142.1 76.2% 36.3%)" }
};

const chartData = [
  { crop: "Yam", demand: 300, price: 85 },
  { crop: "Maize", demand: 250, price: 65 },
  { crop: "Soya", demand: 180, price: 78 },
  { crop: "G. Corn", demand: 150, price: 55 },
  { crop: "Rice", demand: 120, price: 90 },
  { crop: "Shea", demand: 80, price: 95 },
  { crop: "Cashew", demand: 200, price: 88 }
];

export default function MarketTrendsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Market Trends</CardTitle>
        <CardDescription>Current demand and price trends for key crops</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ left: 12, right: 12, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="crop" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="demand" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Demand (MT)" />
            <Bar dataKey="price" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} name="Price Index" />
            <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
