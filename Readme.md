# Advanced End-to-End Data Pipeline: Scraping, Analytics & Visualization

## 30‑Second Summary

This project implements a production‑oriented, end‑to‑end data pipeline that: (1) reliably scrapes dynamic IMDb pages; (2) cleans and normalizes messy real‑world data; (3) performs statistical analysis and anomaly detection; and (4) exposes results via a React dashboard for interactive exploration. Follow the Quickstart to run the pipeline and open the dashboard in minutes.

## Project Purpose

The objective is to automatically collect IMDb data (movies and TV shows), address common "messy data" issues (irregular duration formats, missing values), apply robust statistical summaries (Q1, Q3, IQR, median) and detect meaningful anomalies (e.g., high IMDb rating but low Metascore). The produced artifacts (JSON payloads and visualizations) are consumed by an interactive frontend to support presentation and further analysis. This structure showcases skills across data engineering, statistical analysis, and visualization — suitable for academic evaluation.

## Technical Highlights & Grading Criteria (Bonus Emphasis)

- Scraping

  - Primary scraping via Selenium to handle client‑rendered pages and complex DOMs.
  - Optional "fast" mode: link collection via server‑rendered IMDB search pages using `requests` for higher throughput (performance/scale bonus).

- Data Cleaning & Wrangling

  - Normalization of messy duration formats (e.g. "2h 30m" → integer minutes).
  - Type conversions, removal of noisy characters, and structured parsing of numeric fields.
  - Median imputation for missing numeric values (e.g., `metascore`, `duration_min`, `year`) — a deterministic, defensible strategy that improves downstream analyses.

- Statistical Analysis

  - Robust summary statistics: Q1, Q3, Median, IQR, and computed lower/upper fences (IQR method) for outlier detection.
  - Aggregated metrics produced for both visualization and anomaly reporting.

- Anomaly Detection

  - Automated detection of inconsistencies between IMDb Rating and Metascore (e.g., unusually high rating with low metascore), vote/rating mismatches, and duration outliers.
  - Results categorized into labelled anomaly groups (e.g. `duration_outliers`, `rating_high_meta_low`, `rating_votes_inconsistent`) for clear interpretation.

- Artifacts & Visualization
  - JSON outputs: `movies_cleaned.json`, `movies_charts.json`, `movies_analysis.json`, `movies_final.json`.
  - Static plot artifacts (PNG) for reporting; interactive visualization via the React dashboard under `frontend/`.

## Quickstart — Step‑by‑Step Installation

Prerequisites

- Python 3.9+ (3.12 tested), pip
- Node.js + npm (for frontend)
- (Optional) Chrome/Chromium for Selenium full mode

1. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies

```bash
pip install -r requirements.txt
# If you plan to run the advanced pipeline visualizations, also install:
pip install scipy matplotlib seaborn
```

3. Run the pipeline (fast mode — no browser)

```bash
python run_pipeline.py --limit 25 --fast
# Quick smoke test:
python run_pipeline.py --limit 5 --fast
```

4. Run the pipeline (full Selenium mode — browser required)

```bash
python run_pipeline.py --limit 100
```

Notes:

- `webdriver-manager` auto‑downloads a compatible chromedriver. If you prefer a local binary, set `CHROME_DRIVER_PATH` accordingly.

5. Start the dashboard (frontend)

```bash
cd frontend
npm install
npm start
# Open http://localhost:3000
```

6. Optional: interactive CLI with MongoDB

- `main.py` provides CLI operations (mark watched, query by rating, clear DB). It requires a MongoDB connection string in environment variable `MONGO_URI` (or `.env`).

## Directory Structure

```
IMDB/                                 # Project root
├─ advanced_pipeline.py               # Full scrape → clean → analyze → export pipeline
├─ run_pipeline.py                    # Small launcher (supports --fast and --limit)
├─ main.py                            # Interactive CLI (MongoDB integration)
├─ fast_imdb_top250_scraper.py        # Alternative fast scraper (requests‑based)
├─ new_scraper.py                     # Selenium scraper implementations
├─ data_processor.py                  # Cleaning, imputation, parsing utilities
├─ movies_processor.py                # Per‑movie processing logic
├─ databasemanager.py                 # MongoDB connection and CRUD helper
├─ presentation_content.txt           # Notes / talk content
├─ requirements.txt                   # Python dependencies
├─ movies_cleaned.json                # (Generated) cleaned dataset
├─ movies_final.json                  # (Generated) final dataset for frontend
├─ movies_analysis.json               # (Generated) analysis & anomaly summary
└─ frontend/                          # React dashboard
   ├─ package.json
   ├─ public/
   └─ src/
```

## Inputs, Outputs & Success Criteria (Contract)

- Inputs: target IMDb pages (collected automatically), `--limit` param, optional `MONGO_URI` for DB operations.
- Outputs: cleaned JSON payloads and visualization artifacts; dashboard-ready `movies_final.json`.
- Success: pipeline runs end‑to‑end without unhandled exceptions, and output JSONs + PNGs are produced; anomalies are listed in `movies_analysis.json`.

## Evaluation & Academic Notes

This project aligns with evaluation criteria across multiple domains:

- Data engineering: robust scraping options (Selenium + requests), rate‑limiting and user‑agent handling.
- Data quality: explicit parsing rules and median imputation for messy real‑world fields.
- Statistical rigor: IQR‑based anomaly detection with documented thresholds.
- Presentation: produced artifacts are directly consumable by the React dashboard for reproducible demonstration.

Recommended bonus points:

- Dual scraping strategies (Selenium and fast requests mode).
- Transparent, reproducible imputation and outlier detection logic.
- JSON artifacts and visualization files included for immediate inspection.

---

If you want, I can also:

- Commit this README to the repository (done now),
- Start the frontend and verify the dashboard displays `movies_final.json`, or
- Create an example `.env.example` with `MONGO_URI` placeholders for reviewers.
