#!/usr/bin/env python3

import argparse
import pprint
import json

from advanced_pipeline import run_pipeline


def main():
    p = argparse.ArgumentParser(description='Run the IMDB advanced pipeline (scrape -> clean -> analyze -> export)')
    p.add_argument('--limit', type=int, default=25, help='Number of movies to scrape (default: 25)')
    p.add_argument('--fast', action='store_true', help='Use fast requests-based mode (no browser)')
    p.add_argument('--threads', type=int, default=8, help='Number of threads to use in fast mode')
    args = p.parse_args()

    print(f"Running pipeline: limit={args.limit}, fast={args.fast}, threads={args.threads}")
    df_clean, anomalies, summary = run_pipeline(limit=args.limit, fast=args.fast, threads=args.threads)

    print('\nSummary:')
    pprint.pprint(summary)

    print('\nWrote outputs: movies_cleaned.json, movies_charts.json, movies_analysis.json')


if __name__ == '__main__':
    main()
