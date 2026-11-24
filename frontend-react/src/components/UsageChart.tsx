import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  type ChartOptions,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler)

function formatTimeLabel(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toTimeString().slice(0, 5)
}

function fillGradient(ctx: CanvasRenderingContext2D, color: string) {
  const g = ctx.createLinearGradient(0, 0, 0, 150)
  g.addColorStop(0, color + "55")
  g.addColorStop(1, color + "00")
  return g
}

const CHART_OPTS: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 200 },
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: "#7d8694", font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 5 },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      ticks: { display: false },
      grid: { color: "#262d3d" },
      border: { display: false },
    },
  },
}

type UsageChartProps = {
  labels: string[]
  data: number[]
  color: string
}

export function UsageChart({ labels, data, color }: UsageChartProps) {
  return (
    <div className="h-[150px]">
      <Line
        data={{
          labels: labels.map(formatTimeLabel),
          datasets: [
            {
              data,
              borderColor: color,
              backgroundColor: (ctx) =>
                ctx.chart.ctx ? fillGradient(ctx.chart.ctx, color) : color,
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              borderWidth: 2,
            },
          ],
        }}
        options={CHART_OPTS}
      />
    </div>
  )
}
