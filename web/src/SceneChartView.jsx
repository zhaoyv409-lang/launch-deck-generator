import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
const colors = [
  "#5a7db8",
  "#b87d5a",
  "#5ab87d",
  "#8a6ab8",
  "#b85a6e",
  "#5ab0a8",
];
const tooltipStyle = {
  background: "rgba(255,255,255,.9)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,.7)",
  borderRadius: 12,
  fontSize: 13,
};
function SceneChartView({ chart: e, ink: t, animate: n }) {
  let __stageChartInk = t;
  let r = e.series.map((e, t) => e.id || `series-${t}`),
    i = e.series.map((e, t) => e.color || colors[t % colors.length]),
    a = { fontSize: 12, fill: t, opacity: 0.72 };
  if (e.type === `pie`) {
    let t = e.series[0],
      r = e.categories
        .map((e, n) => ({ name: e, value: t?.values[n] ?? 0 }))
        .filter((e) => e.value > 0);
    return (
      <Card className={`scene-chart`}>
        {
          <CardContent>
            {
              <ResponsiveContainer width={`100%`} height={`100%`}>
                {
                  <PieChart>
                    {
                      <Pie
                        data={r}
                        dataKey={`value`}
                        nameKey={`name`}
                        innerRadius={`50%`}
                        outerRadius={`86%`}
                        paddingAngle={2.5}
                        stroke={`none`}
                        isAnimationActive={n}
                        animationDuration={700}
                      >
                        {r.map((e, t) => (
                          <Cell fill={i[t % i.length]} key={t} />
                        ))}
                      </Pie>
                    }
                    {
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(e, t) => [e, String(t)]}
                      />
                    }
                    {
                      <Legend
                        verticalAlign={`bottom`}
                        iconType={`circle`}
                        iconSize={7}
                        formatter={(e) => <span style={a}>{e}</span>}
                      />
                    }
                  </PieChart>
                }
              </ResponsiveContainer>
            }
          </CardContent>
        }
      </Card>
    );
  }
  let c = e.categories.map((t, n) =>
    Object.fromEntries([
      [`name`, t],
      ...e.series.map((e, t) => [r[t], e.values[n] ?? null]),
    ]),
  );
  return e.type === `bar` ? (
    <Card className={`scene-chart`}>
      {
        <CardContent>
          {
            <ResponsiveContainer width={`100%`} height={`100%`}>
              {
                <BarChart
                  data={c}
                  margin={{ top: 20, right: 28, bottom: 10, left: 0 }}
                  barCategoryGap={`28%`}
                >
                  {
                    <CartesianGrid
                      stroke={`rgba(120,132,158,.24)`}
                      strokeDasharray={`3 6`}
                      vertical={!1}
                    />
                  }
                  {
                    <XAxis
                      dataKey={`name`}
                      tick={{ fill: t, fontSize: 13, opacity: 0.72 }}
                      tickLine={!1}
                      axisLine={{ stroke: t, strokeOpacity: 0.22 }}
                    />
                  }
                  {
                    <YAxis
                      width={56}
                      allowDecimals={
                        !e.series.every((CardContent) =>
                          CardContent.values.every(Number.isInteger),
                        )
                      }
                      tick={{ fill: t, fontSize: 16, opacity: 0.8 }}
                      tickLine={!1}
                      axisLine={!1}
                    />
                  }
                  {
                    <Tooltip
                      cursor={{ fill: t, fillOpacity: 0.06 }}
                      contentStyle={tooltipStyle}
                      formatter={(t, n) => [
                        t,
                        e.series.find((e, t) => r[t] === n)?.label ??
                          String(n ?? ``),
                      ]}
                    />
                  }
                  {e.series.map((e, t) => (
                    <Bar
                      name={e.label}
                      dataKey={r[t]}
                      fill={i[t]}
                      radius={[7, 7, 0, 0]}
                      label={{
                        position: "top",
                        fill: __stageChartInk,
                        fontSize: 16,
                      }}
                      maxBarSize={64}
                      isAnimationActive={n}
                      animationDuration={700}
                      animationBegin={t * 160}
                      key={r[t]}
                    />
                  ))}
                </BarChart>
              }
            </ResponsiveContainer>
          }
        </CardContent>
      }
    </Card>
  ) : (
    <Card className={`scene-chart`}>
      {
        <CardContent>
          {
            <ResponsiveContainer width={`100%`} height={`100%`}>
              {
                <LineChart
                  data={c}
                  margin={{ top: 20, right: 28, bottom: 10, left: 0 }}
                >
                  {
                    <CartesianGrid
                      stroke={`rgba(120,132,158,.24)`}
                      strokeDasharray={`3 6`}
                      vertical={!1}
                    />
                  }
                  {
                    <XAxis
                      dataKey={`name`}
                      tick={{ fill: t, fontSize: 13, opacity: 0.72 }}
                      tickLine={!1}
                      axisLine={{ stroke: t, strokeOpacity: 0.22 }}
                    />
                  }
                  {
                    <YAxis
                      width={56}
                      allowDecimals={
                        !e.series.every((CardContent) =>
                          CardContent.values.every(Number.isInteger),
                        )
                      }
                      tick={{ fill: t, fontSize: 16, opacity: 0.8 }}
                      tickLine={!1}
                      axisLine={!1}
                    />
                  }
                  {
                    <Tooltip
                      cursor={{ stroke: t, strokeOpacity: 0.2 }}
                      contentStyle={tooltipStyle}
                      formatter={(t, n) => [
                        t,
                        e.series.find((e, t) => r[t] === n)?.label ??
                          String(n ?? ``),
                      ]}
                    />
                  }
                  {e.series.map((e, t) => (
                    <Line
                      name={e.label}
                      type={`monotone`}
                      dataKey={r[t]}
                      stroke={i[t]}
                      strokeWidth={2.6}
                      dot={{ r: 3.4, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={n}
                      animationDuration={700}
                      animationBegin={t * 160}
                      key={r[t]}
                    />
                  ))}
                </LineChart>
              }
            </ResponsiveContainer>
          }
        </CardContent>
      }
    </Card>
  );
}

export default SceneChartView;
