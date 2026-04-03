#!/usr/bin/env python3
"""One-time importer for syncing products from seo-main DB into this app via API."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Any
from urllib import error, request

import psycopg


DEFAULT_SOURCE_DB_URL = "postgresql://techload:techload@localhost:5433/techload"
DEFAULT_TARGET_API_BASE = "http://localhost:9000/api"


@dataclass
class ImportConfig:
    source_db_url: str
    target_api_base: str
    commission_rate: float
    stock: int
    replace_all: bool
    upsert_by_name: bool
    dry_run: bool
    limit: int | None


def parse_args() -> ImportConfig:
    parser = argparse.ArgumentParser(
        description=(
            "Import products from seo-main PostgreSQL into optimisation-store-front-back-optimize "
            "through /api/products."
        )
    )
    parser.add_argument(
        "--source-db-url",
        default=os.getenv("SOURCE_DATABASE_URL", DEFAULT_SOURCE_DB_URL),
        help="Source seo-main PostgreSQL connection string.",
    )
    parser.add_argument(
        "--target-api-base",
        default=os.getenv("TARGET_API_BASE", DEFAULT_TARGET_API_BASE),
        help="Destination API base URL (example: http://localhost:9000/api).",
    )
    parser.add_argument(
        "--commission-rate",
        type=float,
        default=1.0,
        help="Default commission_rate for imported products.",
    )
    parser.add_argument(
        "--stock",
        type=int,
        default=100,
        help="Default stock for imported products.",
    )
    parser.add_argument(
        "--replace-all",
        action="store_true",
        help="Delete all destination products before import.",
    )
    parser.add_argument(
        "--upsert-by-name",
        action="store_true",
        help=(
            "Update destination products matched by name (PUT /products/{id}) and create missing ones. "
            "This avoids duplicates while re-syncing fields like image_url."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview import/delete actions without making API changes.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only import the first N source rows (testing helper).",
    )
    args = parser.parse_args()

    if args.stock < 0:
        parser.error("--stock must be >= 0")
    if args.commission_rate < 0:
        parser.error("--commission-rate must be >= 0")
    if args.limit is not None and args.limit <= 0:
        parser.error("--limit must be > 0")

    return ImportConfig(
        source_db_url=args.source_db_url,
        target_api_base=args.target_api_base.rstrip("/"),
        commission_rate=args.commission_rate,
        stock=args.stock,
        replace_all=args.replace_all,
        upsert_by_name=args.upsert_by_name,
        dry_run=args.dry_run,
        limit=args.limit,
    )


def status_to_destination(source_status: str | None) -> str:
    normalized = (source_status or "").strip().lower()
    if normalized == "active":
        return "Active"
    if normalized == "inactive":
        return "Inactive"
    if normalized in {"out_of_stock", "out of stock"}:
        return "Out of Stock"
    return "Active"


def http_json(method: str, url: str, payload: dict[str, Any] | None = None) -> Any:
    body = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url=url, method=method.upper(), data=body, headers=headers)
    try:
        with request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} for {method} {url}: {details}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Network error for {method} {url}: {exc}") from exc


def read_source_products(config: ImportConfig) -> list[dict[str, Any]]:
    query = """
        SELECT
            name,
            description,
            price,
            image_url,
            status
        FROM products
        ORDER BY id
    """

    with psycopg.connect(config.source_db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    if config.limit is not None:
        rows = rows[: config.limit]

    mapped: list[dict[str, Any]] = []
    for name, description, price, image_url, status in rows:
        mapped.append(
            {
                "name": name,
                "description": description,
                "image_url": image_url,
                "price": float(price),
                "commission_rate": config.commission_rate,
                "stock": config.stock,
                "status": status_to_destination(status),
            }
        )
    return mapped


def build_destination_name_index(products: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for item in products:
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        index[name.lower()] = item
    return index


def main() -> int:
    config = parse_args()
    print("Reading source products...")
    source_products = read_source_products(config)
    print(f"Found {len(source_products)} source product(s).")

    destination_products = http_json("GET", f"{config.target_api_base}/products")
    if not isinstance(destination_products, list):
        raise RuntimeError("Unexpected destination response from GET /products")

    print(f"Destination currently has {len(destination_products)} product(s).")
    print(
        "Mode: "
        + ("DRY RUN" if config.dry_run else "LIVE")
        + (
            " + replace-all"
            if config.replace_all
            else (" + upsert-by-name" if config.upsert_by_name else " + append")
        )
    )

    if source_products:
        preview = source_products[0]
        print("First mapped product preview:")
        print(json.dumps(preview, indent=2))

    if config.dry_run:
        delete_count = len(destination_products) if config.replace_all else 0
        update_count = 0
        create_count = len(source_products)
        if config.upsert_by_name:
            destination_by_name = build_destination_name_index(destination_products)
            update_count = sum(
                1
                for source in source_products
                if str(source.get("name") or "").strip().lower() in destination_by_name
            )
            create_count = len(source_products) - update_count
        print(
            f"Dry-run summary: would delete {delete_count} destination product(s), "
            f"would update {update_count} product(s), would create {create_count} product(s)."
        )
        return 0

    if config.replace_all:
        print("Deleting existing destination products...")
        for product in destination_products:
            product_id = product.get("id")
            if product_id is None:
                continue
            http_json("DELETE", f"{config.target_api_base}/products/{product_id}")

    destination_by_name = build_destination_name_index(destination_products) if config.upsert_by_name else {}

    print("Creating destination products...")
    created = 0
    updated = 0
    failures: list[tuple[str, str]] = []
    for product in source_products:
        try:
            if config.upsert_by_name:
                product_name = str(product.get("name") or "").strip().lower()
                existing = destination_by_name.get(product_name)
                if existing and existing.get("id") is not None:
                    http_json("PUT", f"{config.target_api_base}/products/{existing['id']}", product)
                    updated += 1
                else:
                    http_json("POST", f"{config.target_api_base}/products", product)
                    created += 1
            else:
                http_json("POST", f"{config.target_api_base}/products", product)
                created += 1
        except Exception as exc:  # noqa: BLE001 - report and continue for batch import
            failures.append((product.get("name", "<unknown>"), str(exc)))

    print(f"Import result: updated={updated}, created={created}, failed={len(failures)}")
    if failures:
        print("Failures:")
        for name, message in failures:
            print(f"- {name}: {message}")
        return 1

    final_products = http_json("GET", f"{config.target_api_base}/products")
    final_count = len(final_products) if isinstance(final_products, list) else "unknown"
    print(f"Destination final count: {final_count}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Interrupted.")
        raise SystemExit(130)