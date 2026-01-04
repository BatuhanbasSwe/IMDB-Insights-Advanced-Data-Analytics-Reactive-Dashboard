import React from "react";
import { Scatter } from "recharts";
import {
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from "recharts";

// Usage: pass `data` prop which is the `scatter` array from movies_charts.json
// each item should be: { title, rating, metascore, duration_min, votes }

export default function ChartsExample({ data }) {
  // map data to numeric-safe values for plotting
  const plotData = data.map((d, i) => ({
    id: i,
    title: d.title,
    rating: d.rating == null ? null : Number(d.rating),
    metascore: d.metascore == null ? null : Number(d.metascore),
    duration: d.duration_min == null ? null : Number(d.duration_min),
    votes: d.votes == null ? 0 : Number(d.votes),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="votes"
          name="votes"
          tickFormatter={(v) => (v > 0 ? (v / 1000).toFixed(0) + "k" : "0")}
        />
        <YAxis type="number" dataKey="rating" name="rating" domain={[0, 10]} />
        <ZAxis
          type="number"
          dataKey="duration"
          range={[60, 400]}
          name="duration"
        />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        <Scatter name="Movies" data={plotData} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
