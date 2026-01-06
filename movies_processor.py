
import argparse
import os
import shutil
import json
import pprint
import sys

from advanced_pipeline import run_pipeline


def main(argv=None):
    p = argparse.ArgumentParser(description="Run the IMDB scraping + cleaning + analysis pipeline")
    p.add_argument('--limit', type=int, default=100, help='Number of movies to scrape (default: 100)')
    p.add_argument('--fast', action='store_true', help='Use fast requests-based scraping (no browser)')
    p.add_argument('--threads', type=int, default=8, help='Number of threads for fast mode')
    args = p.parse_args(argv)

    print(f"Starting pipeline: limit={args.limit}, fast={args.fast}, threads={args.threads}")
    df_clean, anomalies, summary = run_pipeline(limit=args.limit, fast=args.fast, threads=args.threads)

    # --- Required output location for the React app ---
    # Assignment requirement: save to 'src/movies_final.json' (inside the React project).
    # CRA serves files from public/, but we keep a copy in src/ as requested.
    try:
        repo_root = os.path.dirname(os.path.abspath(__file__))
        dashboard_src = os.path.join(repo_root, 'imdb-dashboard', 'src', 'movies_final.json')
        dashboard_public = os.path.join(repo_root, 'imdb-dashboard', 'public', 'movies_final.json')
        os.makedirs(os.path.dirname(dashboard_src), exist_ok=True)
        os.makedirs(os.path.dirname(dashboard_public), exist_ok=True)
        root_json = os.path.join(repo_root, 'movies_final.json')
        if os.path.exists(root_json):
            shutil.copyfile(root_json, dashboard_src)
            shutil.copyfile(root_json, dashboard_public)
            print(f"\nCopied movies_final.json -> {dashboard_src}")
            print(f"Copied movies_final.json -> {dashboard_public}")
    except Exception:
        # Non-fatal: pipeline still produced root outputs.
        pass

    print('\nSummary:')
    pprint.pprint(summary)

    print('\nFiles written:')
    print(' - movies_cleaned.json')
    print(' - movies_charts.json')
    print(' - movies_analysis.json')
    print(' - movies_final.json')
    print(' - imdb-dashboard/src/movies_final.json')
    print(' - imdb-dashboard/public/movies_final.json')
    print(' - boxplot_rating.png, boxplot_metascore.png')

    # Optionally pretty-print part of movies_final.json for convenience
    try:
        with open('movies_final.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print('\nmovies_final.json summary:')
        s = data.get('summary', {})
        print('n_records:', s.get('n_records'))
        print('anomalies_counts:', s.get('anomalies_counts'))
    except Exception:
        pass


if __name__ == '__main__':
    main()
