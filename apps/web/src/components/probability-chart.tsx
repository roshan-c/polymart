import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
	"#3b82f6",
	"#ef4444",
	"#10b981",
	"#f59e0b",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
	"#f97316",
	"#6366f1",
];

interface ProbabilityChartProps {
	data: Array<Record<string, number>>;
	outcomes: string[];
}

export function ProbabilityChart({ data, outcomes }: ProbabilityChartProps) {
	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Probability Over Time</CardTitle>
					<CardDescription>Market probability trends for each outcome</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground py-8">
						No probability data yet. Place the first bet to see the graph!
					</p>
				</CardContent>
			</Card>
		);
	}

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="rounded-lg border bg-background p-3 shadow-lg">
					<p className="text-sm font-medium mb-2">{formatDate(label)}</p>
					{payload.map((entry: any, index: number) => (
						<p key={index} className="text-sm" style={{ color: entry.color }}>
							{entry.name}: {entry.value.toFixed(1)}%
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Probability Over Time</CardTitle>
				<CardDescription>Market probability trends for each outcome</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					<LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							dataKey="timestamp"
							tickFormatter={formatDate}
							className="text-xs"
						/>
						<YAxis
							domain={[0, 100]}
							tickFormatter={(value) => `${value}%`}
							className="text-xs"
						/>
						<Tooltip content={<CustomTooltip />} />
						<Legend />
						{outcomes.map((outcome, index) => (
							<Line
								key={outcome}
								type="monotone"
								dataKey={outcome}
								stroke={COLORS[index % COLORS.length]}
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 6 }}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
