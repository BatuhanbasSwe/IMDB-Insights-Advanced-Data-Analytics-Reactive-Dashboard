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
  chartCard: {
    background: "#071233",
    border: "1px solid #1f2a44",
    padding: 12,
    borderRadius: 10,
    minHeight: 220,
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
  button: {
    background: "#0b163d",
    border: "1px solid #1f2a44",
    color: "#e6eef8",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
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
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    background: "linear-gradient(180deg,#071233 0%,#051029 100%)",
    border: "1px solid #153049",
    padding: 14,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#071233",
    border: "1px solid #12314a",
  },
  statTitle: { fontSize: 12, color: "#9fb0d8" },
  statValue: { fontSize: 22, fontWeight: 800 },
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
  const data = [{ name: "Rating", q1, q3, median, lower, upper, value: 1 }];
  const domainPadding = 0.25;
  const domainMin = Math.min(lower, q1, median, q3, upper) - domainPadding;
  const domainMax = Math.max(lower, q1, median, q3, upper) + domainPadding;
  const BoxShape = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;
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
        <rect
          x={Math.min(xQ1, xQ3)}
          y={boxTop}
          width={Math.max(2, Math.abs(xQ3 - xQ1))}
          height={boxHeight}
          fill="#1e3a8a"
          stroke="#6ea8ff"
          rx="4"
        />
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
            content={({ active }) => {
              if (!active) return null;
              return (
                <div
                  style={{
                    background: "#0b163d",
                    border: "1px solid #1f2a44",
                    color: "#e6eef8",
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Rating boxplot
                  </div>
                  <div>
                    Q1:{" "}
                    {stats && typeof stats.q1 === "number"
                      ? stats.q1.toFixed(2)
                      : "-"}
                  </div>
                  <div>
                    Median:{" "}
                    {stats && typeof stats.median === "number"
                      ? stats.median.toFixed(2)
                      : "-"}
                  </div>
                  <div>
                    Q3:{" "}
                    {stats && typeof stats.q3 === "number"
                      ? stats.q3.toFixed(2)
                      : "-"}
                  </div>
                  <div style={{ marginTop: 6, color: "#9fb0d8" }}>
                    Count: {stats ? stats.count : "-"}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="transparent" shape={BoxShape} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload || {};
  return (
    <div
      style={{
        background: "#0b163d",
        border: "1px solid #1f2a44",
        color: "#e6eef8",
        padding: 10,
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.title || "-"}</div>
      <div style={{ fontSize: 13 }}>
        Type: {p.type || "-"} • Rating:{" "}
        {typeof p.rating === "number" ? p.rating.toFixed(1) : "-"}
      </div>
      <div style={{ fontSize: 13 }}>
        Metascore: {typeof p.metascore === "number" ? p.metascore : "-"} •
        Votes: {p.votes != null ? p.votes : "-"}
      </div>
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
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("rating");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedType, setSelectedType] = useState("all"); // all | movie | tv
  const [pageInput, setPageInput] = useState("");

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

  const typeCounts = useMemo(() => {
    return (records || []).reduce(
      (acc, r) => {
        const t = r?.type || "movie";
        acc[t] = (acc[t] || 0) + 1;
        acc.all = (acc.all || 0) + 1;
        return acc;
      },
      { all: 0 }
    );
  }, [records]);

  const overallAnomalyCount = useMemo(
    () => records.filter((r) => isRecordAnomaly(r)).length,
    [records]
  );

  const overallMeanRating = useMemo(() => {
    const vals = records
      .map((r) => (typeof r.rating === "number" ? r.rating : null))
      .filter((x) => x != null);
    if (!vals.length) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [records]);

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

  useEffect(() => {
    setPage(1);
  }, [query, genre, onlyAnomalies, pageSize, sortBy, sortDir]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (selectedType !== "all" && (r?.type || "movie") !== selectedType)
        return false;
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
  }, [records, query, genre, onlyAnomalies, selectedType]);

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

  // keep the page input field in sync with the actual current page
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);
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

  // jump-to-page helper: validate pageInput and navigate
  const goToInputPage = () => {
    const v = (pageInput || "").trim();
    if (!v) return;
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    const tgt = clamp(Math.floor(n), 1, totalPages);
    setPage(tgt);
    setPageInput(String(tgt));
  };

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
          type: r.type || "movie",
          votes: typeof r.votes === "number" ? r.votes : null,
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
          Make sure <code>/movies_final.json</code> exists in frontend/public.
        </div>
      </div>
    );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Database size={28} color="#7dd3fc" />
        <div>
          <div style={styles.title}>IMDB Data Analysis Dashboard</div>
          <div style={styles.subtitle}>
            Loaded from <strong>/movies_final.json</strong> • Showing{" "}
            <strong>{filteredRecords.length}</strong> / {records.length} •{" "}
            {selectedType === "all"
              ? "All"
              : selectedType === "movie"
              ? "Movies"
              : "TV Shows"}
          </div>
        </div>
      </header>

      {/* Top summary: counts / anomalies / avg rating */}
      <section style={styles.summaryRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <Database size={22} color="#7dd3fc" />
          </div>
          <div>
            <div style={styles.statTitle}>Movies</div>
            <div style={styles.statValue}>{typeCounts.movie || 0}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <Star size={20} color="#60a5fa" />
          </div>
          <div>
            <div style={styles.statTitle}>TV Shows</div>
            <div style={styles.statValue}>{typeCounts.tv || 0}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{ ...styles.statIcon, background: "rgba(255,107,107,0.06)" }}
          >
            <AlertCircle size={20} color="#ff6b6b" />
          </div>
          <div>
            <div style={styles.statTitle}>Anomalies</div>
            <div style={styles.statValue}>{overallAnomalyCount}</div>
            <div style={{ fontSize: 12, color: "#9fb0d8", marginTop: 4 }}>
              {(records.length > 0 &&
                Math.round((overallAnomalyCount / records.length) * 100)) ||
                0}
              % of data
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <Star size={20} color="#ffd166" />
          </div>
          <div>
            <div style={styles.statTitle}>Avg Rating</div>
            <div style={styles.statValue}>
              {overallMeanRating != null ? overallMeanRating.toFixed(2) : "-"}
            </div>
            <div style={{ fontSize: 12, color: "#9fb0d8", marginTop: 4 }}>
              Based on {records.length} items
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <div>
          <button
            onClick={() => setSelectedType("all")}
            style={{
              ...styles.button,
              background:
                selectedType === "all" ? "#15316b" : styles.button.background,
            }}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType("movie")}
            style={{
              ...styles.button,
              background:
                selectedType === "movie" ? "#15316b" : styles.button.background,
              marginLeft: 8,
            }}
          >
            Movies
          </button>
          <button
            onClick={() => setSelectedType("tv")}
            style={{
              ...styles.button,
              background:
                selectedType === "tv" ? "#15316b" : styles.button.background,
              marginLeft: 8,
            }}
          >
            TV Shows
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <input
            style={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, year or genre…"
            aria-label="Search"
          />
        </div>

        <div style={{ width: 200 }}>
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
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
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
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CustomScatterTooltip />}
                />
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

      <section
        style={{
          background: "#071233",
          border: "1px solid #1f2a44",
          padding: 12,
          borderRadius: 10,
        }}
      >
        <h3 style={{ margin: 0 }}>Item list</h3>
        <div style={{ marginTop: 6, color: "#9fb0d8", fontSize: 13 }}>
          Click headers to sort. Anomalies are highlighted.
        </div>
        <div style={{ marginTop: 10 }} className="tableWrap">
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Year
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Rating
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Metascore
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Duration
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Genres
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Anomaly
                </th>
                <th
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "#9fb0d8",
                    padding: "10px 10px",
                    borderBottom: "1px solid #1f2a44",
                  }}
                >
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 ? (
                <tr>
                  <td style={{ color: "#9fb0d8" }} colSpan={8}>
                    No items match the current filters.
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
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
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
                          >
                            {r.title || "(untitled)"}
                          </a>
                          {r.url ? (
                            <ExternalLink size={14} color="#9fb0d8" />
                          ) : null}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
                        {r.year ?? "-"}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
                        {typeof r.rating === "number"
                          ? r.rating.toFixed(1)
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
                        {typeof r.metascore === "number" ? r.metascore : "-"}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
                        {typeof r.duration_min === "number"
                          ? `${r.duration_min} min`
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
                        <span style={styles.badge}>
                          {(Array.isArray(r.genres) ? r.genres : [])
                            .slice(0, 3)
                            .join(", ") || "-"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
                        <span
                          style={{
                            ...styles.badge,
                            ...(anomaly ? styles.badgeDanger : {}),
                          }}
                        >
                          {anomaly ? "Anomaly" : "Normal"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          borderBottom: "1px solid #13213a",
                        }}
                      >
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
      </section>

      {/* Bottom pagination: page-size, numbered quick links, Prev/Next */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ color: "#9fb0d8", fontSize: 13 }}>Show</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ ...styles.select, width: 120 }}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <div style={{ color: "#9fb0d8", fontSize: 13 }}>items per page</div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={styles.button}
            onClick={() => setPage(clamp(currentPage - 1, 1, totalPages))}
          >
            Prev
          </button>

          {/* numbered pages */}
          {(() => {
            const nums = [];
            let start = Math.max(1, currentPage - 3);
            let end = Math.min(totalPages, start + 6);
            if (end - start < 6) start = Math.max(1, end - 6);
            for (let p = start; p <= end; p++) nums.push(p);
            return nums.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border:
                    p === currentPage
                      ? "1px solid #7dd3fc"
                      : "1px solid #1f2a44",
                  background: p === currentPage ? "#0b3b6b" : "#071233",
                  color: p === currentPage ? "#7dd3fc" : "#9fb0d8",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ));
          })()}

          <button
            style={styles.button}
            onClick={() => setPage(clamp(currentPage + 1, 1, totalPages))}
          >
            Next
          </button>

          {/* Jump-to-page input (type a page and press Enter or click Go) */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            <input
              aria-label="Go to page"
              value={pageInput}
              onChange={(e) => {
                // allow only digits (empty allowed)
                const v = e.target.value.replace(/[^0-9]/g, "");
                setPageInput(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToInputPage();
              }}
              placeholder={`${currentPage}/${totalPages}`}
              style={{
                ...styles.input,
                width: 84,
                padding: "6px 8px",
                textAlign: "center",
                fontSize: 13,
              }}
            />
            <button
              onClick={goToInputPage}
              style={{ ...styles.button, padding: "6px 10px" }}
            >
              Go
            </button>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: 18, color: "#9fb0d8", fontSize: 13 }}>
        Tip: If the dashboard shows old data, re-run the pipeline and make sure
        the file <code>/movies_final.json</code> in frontend/public is updated.
      </footer>
    </div>
  );
}
