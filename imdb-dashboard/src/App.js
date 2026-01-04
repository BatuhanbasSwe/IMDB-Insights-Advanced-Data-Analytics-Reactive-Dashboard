import React, { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Database,
  Star,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";

import "./App.css";

const styles = {
  page: {
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    background: "#0f172a",
    color: "#e6eef8",
    minHeight: "100vh",
    padding: 24,
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: "#9fb0d8", fontSize: 13, marginTop: 2 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 18,
  },
  card: {
    background: "#071233",
    border: "1px solid #1f2a44",
    padding: 14,
    borderRadius: 10,
    minHeight: 84,
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  chartCard: {
    background: "#071233",
    border: "1px solid #1f2a44",
    padding: 12,
    borderRadius: 10,
    minHeight: 220,
  },
  smallText: { color: "#9fb0d8", fontSize: 13 },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #1f2a44",
    background: "#071233",
    marginTop: 14,
    marginBottom: 14,
  },
  input: {
    width: "100%",
    background: "#0b163d",
    border: "1px solid #1f2a44",
    color: "#e6eef8",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
  },
  select: {
    width: "100%",
    background: "#0b163d",
    border: "1px solid #1f2a44",
    color: "#e6eef8",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
  },
  checkboxRow: { display: "flex", gap: 10, alignItems: "center" },
  checkbox: { transform: "scale(1.1)" },
  tableCard: {
    background: "#071233",
    border: "1px solid #1f2a44",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 860 },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#9fb0d8",
    padding: "10px 10px",
    borderBottom: "1px solid #1f2a44",
    position: "sticky",
    top: 0,
    background: "#071233",
    cursor: "pointer",
    userSelect: "none",
  },
  td: {
    padding: "10px 10px",
    borderBottom: "1px solid #13213a",
    fontSize: 13,
    color: "#e6eef8",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #1f2a44",
    background: "#0b163d",
    color: "#9fb0d8",
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  badgeDanger: {
    border: "1px solid rgba(255,107,107,0.35)",
    background: "rgba(255,107,107,0.10)",
    color: "#ff6b6b",
  },
  link: { color: "#7dd3fc", textDecoration: "none" },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
  },
  button: {
    background: "#0b163d",
    border: "1px solid #1f2a44",
    color: "#e6eef8",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
  note: {
    marginTop: 10,
    color: "#9fb0d8",
    fontSize: 13,
    lineHeight: 1.4,
  },
  // Minimal “responsive” support without extra CSS files
  // (kept inline so CRA build stays simple)
  responsiveHint: {
    display: "none",
  },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeLower(s) {
  return typeof s === "string" ? s.toLowerCase() : "";
}

function compareMaybeNumber(a, b, dir = "desc") {
  const aN = typeof a === "number" && !Number.isNaN(a);
  const bN = typeof b === "number" && !Number.isNaN(b);
  if (!aN && !bN) return 0;
  if (!aN) return 1;
  if (!bN) return -1;
  return dir === "asc" ? a - b : b - a;
}

function isRecordAnomaly(r) {
  return Boolean(
    r?.is_anomaly ||
      r?.anomaly_rating_high_meta_low ||
      r?.anomaly_duration_outlier ||
      r?.anomaly_rating_votes_inconsistent
  );
}

function getAnomalyReasons(r) {
  const reasons = [];
  if (r?.anomaly_rating_high_meta_low)
    reasons.push("High rating + low metascore");
  if (r?.anomaly_duration_outlier) reasons.push("Duration outlier (IQR)");
  if (r?.anomaly_rating_votes_inconsistent)
    reasons.push("Rating-votes inconsistency (residual)");
  return reasons;
}

function quantile(sorted, p) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined)
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

function computeStats(arr) {
  const clean = arr
    .filter((x) => typeof x === "number" && !Number.isNaN(x))
    .sort((a, b) => a - b);
  if (!clean.length) return null;

  const q1 = quantile(clean, 0.25);
  const q3 = quantile(clean, 0.75);
  const median = quantile(clean, 0.5);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const mean = clean.reduce((s, v) => s + v, 0) / clean.length;

  return { q1, q3, median, iqr, lower, upper, mean, count: clean.length };
}

function RechartsBoxPlot({ stats }) {
  if (!stats) return <div style={{ color: "#9fb0d8" }}>No data</div>;

  const { q1, q3, median, lower, upper } = stats;

  // Recharts needs a dataset even for a single custom shape.
  const data = [
    {
      name: "Rating",
      q1,
      q3,
      median,
      lower,
      upper,
      // dummy value; we use a custom shape to draw the full box-and-whisker
      value: 1,
    },
  ];

  const domainPadding = 0.25;
  const domainMin = Math.min(lower, q1, median, q3, upper) - domainPadding;
  const domainMax = Math.max(lower, q1, median, q3, upper) + domainPadding;

  const BoxShape = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;

    // Convert a value in [domainMin, domainMax] to pixel x in [x, x+width]
    const scaleX = (v) => {
      if (domainMax === domainMin) return x + width / 2;
      return x + ((v - domainMin) / (domainMax - domainMin)) * width;
    };

    const centerY = y + height / 2;
    const boxTop = y + height * 0.2;
    const boxBottom = y + height * 0.8;
    const boxHeight = boxBottom - boxTop;

    const xLower = scaleX(payload.lower);
    const xQ1 = scaleX(payload.q1);
    const xMedian = scaleX(payload.median);
    const xQ3 = scaleX(payload.q3);
    const xUpper = scaleX(payload.upper);

    return (
      <g>
        {/* whiskers */}
        <line
          x1={xLower}
          y1={centerY}
          x2={xQ1}
          y2={centerY}
          stroke="#9fb0d8"
          strokeWidth="2"
        />
        <line
          x1={xQ3}
          y1={centerY}
          x2={xUpper}
          y2={centerY}
          stroke="#9fb0d8"
          strokeWidth="2"
        />
        {/* end caps */}
        <line
          x1={xLower}
          y1={centerY - 8}
          x2={xLower}
          y2={centerY + 8}
          stroke="#9fb0d8"
          strokeWidth="2"
        />
        <line
          x1={xUpper}
          y1={centerY - 8}
          x2={xUpper}
          y2={centerY + 8}
          stroke="#9fb0d8"
          strokeWidth="2"
        />
        {/* box */}
        <rect
          x={Math.min(xQ1, xQ3)}
          y={boxTop}
          width={Math.max(2, Math.abs(xQ3 - xQ1))}
          height={boxHeight}
          fill="#1e3a8a"
          stroke="#6ea8ff"
          rx="4"
        />
        {/* median */}
        <line
          x1={xMedian}
          y1={boxTop - 2}
          x2={xMedian}
          y2={boxBottom + 2}
          stroke="#ffd166"
          strokeWidth="3"
        />
      </g>
    );
  };

  return (
    <div style={{ width: "100%", height: 140, marginTop: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 24, bottom: 10, left: 24 }}
        >
          <CartesianGrid stroke="#10243b" />
          <XAxis
            type="number"
            domain={[domainMin, domainMax]}
            tick={{ fill: "#9fb0d8", fontSize: 12 }}
            axisLine={{ stroke: "#1f2a44" }}
            tickLine={{ stroke: "#1f2a44" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#9fb0d8", fontSize: 12 }}
            axisLine={{ stroke: "#1f2a44" }}
            tickLine={{ stroke: "#1f2a44" }}
            width={60}
          />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "#0b163d",
              border: "1px solid #1f2a44",
              color: "#e6eef8",
            }}
            formatter={() => null}
            labelFormatter={() => "Rating boxplot"}
          />
          <Bar dataKey="value" fill="transparent" shape={BoxShape} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryCard({ icon, title, value }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {icon}
        <div>
          <div style={{ fontSize: 12, color: "#9fb0d8" }}>{title}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("rating");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    fetch("/movies_final.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load");
        setLoading(false);
      });
  }, []);

  const records = useMemo(
    () => (Array.isArray(data?.records) ? data.records : []),
    [data]
  );

  const allGenres = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      const gs = Array.isArray(r.genres) ? r.genres : [];
      for (const g of gs) {
        if (typeof g === "string" && g.trim()) set.add(g.trim());
      }
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [records]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, genre, onlyAnomalies, pageSize, sortBy, sortDir]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (onlyAnomalies && !isRecordAnomaly(r)) return false;
      if (genre !== "all") {
        const gs = Array.isArray(r.genres) ? r.genres : [];
        if (!gs.includes(genre)) return false;
      }
      if (q) {
        const hay = `${r.title ?? ""} ${r.year ?? ""} ${
          Array.isArray(r.genres) ? r.genres.join(" ") : ""
        }`;
        if (!safeLower(hay).includes(q)) return false;
      }
      return true;
    });
  }, [records, query, genre, onlyAnomalies]);

  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      if (sortBy === "title") {
        const aa = (a.title ?? "").toString();
        const bb = (b.title ?? "").toString();
        return sortDir === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
      }
      if (sortBy === "anomaly") {
        const aa = isRecordAnomaly(a) ? 1 : 0;
        const bb = isRecordAnomaly(b) ? 1 : 0;
        return sortDir === "asc" ? aa - bb : bb - aa;
      }
      return compareMaybeNumber(a[sortBy], b[sortBy], sortDir);
    });
    return list;
  }, [filteredRecords, sortBy, sortDir]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedRecords.length / pageSize)),
    [sortedRecords.length, pageSize]
  );

  const currentPage = useMemo(
    () => clamp(page, 1, totalPages),
    [page, totalPages]
  );
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const ratings = useMemo(
    () =>
      filteredRecords
        .map((r) => (typeof r.rating === "number" ? r.rating : null))
        .filter((x) => x != null),
    [filteredRecords]
  );
  const ratingStats = useMemo(() => computeStats(ratings), [ratings]);

  const anomalyCount = useMemo(
    () => filteredRecords.filter((r) => isRecordAnomaly(r)).length,
    [filteredRecords]
  );

  const scatterData = useMemo(
    () =>
      filteredRecords
        .filter(
          (r) => typeof r.rating === "number" && typeof r.metascore === "number"
        )
        .map((r) => ({
          rating: r.rating,
          metascore: r.metascore,
          title: r.title,
          is_anomaly: isRecordAnomaly(r),
        })),
    [filteredRecords]
  );

  if (loading)
    return (
      <div style={{ padding: 24, color: "#9fb0d8" }}>Loading dashboard…</div>
    );
  if (error)
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "#ff6b6b", marginBottom: 10 }}>Error: {error}</div>
        <div style={{ color: "#9fb0d8", fontSize: 13 }}>
          Make sure <code>imdb-dashboard/public/movies_final.json</code> exists.
        </div>
      </div>
    );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Database size={28} color="#7dd3fc" />
        <div>
          <div style={styles.title}>IMDB Movie Data Analysis Dashboard</div>
          <div style={styles.subtitle}>
            Loaded from <strong>/movies_final.json</strong> • Showing{" "}
            <strong>{filteredRecords.length}</strong> / {records.length}
          </div>
        </div>
      </header>

      <section style={styles.grid}>
        <SummaryCard
          icon={<Star color="#ffd166" />}
          title="Total movies"
          value={records.length}
        />
        <SummaryCard
          icon={<AlertCircle color="#ff6b6b" />}
          title="Anomalies detected"
          value={anomalyCount}
        />
        <SummaryCard
          icon={<Star color="#93c5fd" />}
          title="Average rating"
          value={ratingStats ? ratingStats.mean.toFixed(2) : "N/A"}
        />
      </section>

      <section className="toolbar" style={styles.toolbar}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Search size={18} color="#9fb0d8" />
          <input
            style={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, year or genre…"
            aria-label="Search"
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Filter size={18} color="#9fb0d8" />
          <select
            style={styles.select}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            aria-label="Genre"
          >
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g === "all" ? "All genres" : g}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={onlyAnomalies}
            onChange={(e) => setOnlyAnomalies(e.target.checked)}
            style={styles.checkbox}
            id="onlyAnomalies"
          />
          <label htmlFor="onlyAnomalies" style={{ color: "#9fb0d8" }}>
            Only anomalies
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <select
            style={styles.select}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="chartsRow" style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={{ margin: 0 }}>Rating Distribution (Box-and-Whisker)</h3>
          <RechartsBoxPlot stats={ratingStats} />
          <div style={{ marginTop: 8, color: "#9fb0d8", fontSize: 13 }}>
            Q1: {ratingStats ? ratingStats.q1.toFixed(2) : "-"} | Median:{" "}
            {ratingStats ? ratingStats.median.toFixed(2) : "-"} | Q3:{" "}
            {ratingStats ? ratingStats.q3.toFixed(2) : "-"}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={{ margin: 0 }}>Rating vs Metascore (Scatter)</h3>
          <div style={{ width: "100%", height: 340, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid stroke="#10243b" />
                <XAxis
                  type="number"
                  dataKey="rating"
                  name="Rating"
                  domain={[0, 10]}
                />
                <YAxis
                  type="number"
                  dataKey="metascore"
                  name="Metascore"
                  domain={[0, 100]}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend />
                <Scatter
                  name="Normal"
                  data={scatterData.filter((d) => !d.is_anomaly)}
                  fill="#60a5fa"
                />
                <Scatter
                  name="Anomaly"
                  data={scatterData.filter((d) => d.is_anomaly)}
                  fill="#ff6b6b"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8, color: "#9fb0d8", fontSize: 13 }}>
            Points: {scatterData.length}
          </div>
        </div>
      </section>

      <section style={styles.tableCard}>
        <h3 style={{ margin: 0 }}>Movie list</h3>
        <div style={{ marginTop: 6, color: "#9fb0d8", fontSize: 13 }}>
          Click headers to sort. Anomalies are highlighted.
        </div>

        <div
          className="tableWrap"
          style={{ marginTop: 10, ...styles.tableWrap }}
        >
          <table style={styles.table}>
            <thead>
              <tr>
                <th
                  style={styles.th}
                  onClick={() => {
                    setSortBy("title");
                    setSortDir(
                      sortBy === "title" && sortDir === "asc" ? "desc" : "asc"
                    );
                  }}
                >
                  Title{" "}
                  <ArrowUpDown size={14} style={{ verticalAlign: "-2px" }} />
                </th>
                <th
                  style={styles.th}
                  onClick={() => {
                    setSortBy("year");
                    setSortDir(
                      sortBy === "year" && sortDir === "asc" ? "desc" : "asc"
                    );
                  }}
                >
                  Year{" "}
                  <ArrowUpDown size={14} style={{ verticalAlign: "-2px" }} />
                </th>
                <th
                  style={styles.th}
                  onClick={() => {
                    setSortBy("rating");
                    setSortDir(
                      sortBy === "rating" && sortDir === "asc" ? "desc" : "asc"
                    );
                  }}
                >
                  Rating{" "}
                  <ArrowUpDown size={14} style={{ verticalAlign: "-2px" }} />
                </th>
                <th
                  style={styles.th}
                  onClick={() => {
                    setSortBy("metascore");
                    setSortDir(
                      sortBy === "metascore" && sortDir === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                >
                  Metascore{" "}
                  <ArrowUpDown size={14} style={{ verticalAlign: "-2px" }} />
                </th>
                <th
                  style={styles.th}
                  onClick={() => {
                    setSortBy("duration_min");
                    setSortDir(
                      sortBy === "duration_min" && sortDir === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                >
                  Duration{" "}
                  <ArrowUpDown size={14} style={{ verticalAlign: "-2px" }} />
                </th>
                <th style={styles.th}>Genres</th>
                <th
                  style={styles.th}
                  onClick={() => {
                    setSortBy("anomaly");
                    setSortDir(
                      sortBy === "anomaly" && sortDir === "asc" ? "desc" : "asc"
                    );
                  }}
                >
                  Anomaly{" "}
                  <ArrowUpDown size={14} style={{ verticalAlign: "-2px" }} />
                </th>
                <th style={styles.th}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={8}>
                    <span style={{ color: "#9fb0d8" }}>
                      No movies match the current filters.
                    </span>
                  </td>
                </tr>
              ) : (
                pageSlice.map((r, idx) => {
                  const anomaly = isRecordAnomaly(r);
                  const reasons = getAnomalyReasons(r);
                  const rowBg = anomaly
                    ? "rgba(255,107,107,0.06)"
                    : "transparent";
                  return (
                    <tr
                      key={`${r.title}-${r.year}-${idx}`}
                      style={{ background: rowBg }}
                    >
                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <a
                            href={r.url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.link}
                            title="Open on IMDB"
                          >
                            {r.title || "(untitled)"}
                          </a>
                          {r.url ? (
                            <ExternalLink size={14} color="#9fb0d8" />
                          ) : null}
                        </div>
                      </td>
                      <td style={styles.td}>{r.year ?? "-"}</td>
                      <td style={styles.td}>
                        {typeof r.rating === "number"
                          ? r.rating.toFixed(1)
                          : "-"}
                      </td>
                      <td style={styles.td}>
                        {typeof r.metascore === "number" ? r.metascore : "-"}
                      </td>
                      <td style={styles.td}>
                        {typeof r.duration_min === "number"
                          ? `${r.duration_min} min`
                          : "-"}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge}>
                          {(Array.isArray(r.genres) ? r.genres : [])
                            .slice(0, 3)
                            .join(", ") || "-"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(anomaly ? styles.badgeDanger : {}),
                          }}
                        >
                          {anomaly ? "Anomaly" : "Normal"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {reasons.length ? (
                          <span
                            style={{ ...styles.badge, ...styles.badgeDanger }}
                          >
                            {reasons.join(" • ")}
                          </span>
                        ) : (
                          <span style={styles.badge}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <div style={{ color: "#9fb0d8", fontSize: 13 }}>
            Page {currentPage} / {totalPages} • {sortedRecords.length} rows
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                ...styles.button,
                ...(currentPage <= 1 ? styles.buttonDisabled : {}),
              }}
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              style={{
                ...styles.button,
                ...(currentPage >= totalPages ? styles.buttonDisabled : {}),
              }}
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: 18, color: "#9fb0d8", fontSize: 13 }}>
        Tip: If the dashboard shows old data, re-run the pipeline and make sure
        the file <code>imdb-dashboard/public/movies_final.json</code> is
        updated.
      </footer>
    </div>
  );
}
