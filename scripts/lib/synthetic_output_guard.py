"""Fail-closed output guard for synthetic catalogue generators (2026-10-12).

Python twin of scripts/lib/synthetic-output-guard.mjs. Generators that invent
universities, courses, intakes, fees or "verification" data may only write to

    ALO_SYNTHETIC_OUTPUT_DIR=fixtures/synthetic-catalogue/<anything>   or
    ALO_SYNTHETIC_OUTPUT_DIR=staging/synthetic/<anything>

Anything else (unset, repository root, src/, docs/import-templates/, data/,
public/, prisma/, other absolute paths, `..` traversal) is refused, and
NODE_ENV=production is always refused. Output is never verified data.
"""
import os
import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
ALLOWED_SYNTHETIC_ROOTS = ("fixtures/synthetic-catalogue", "staging/synthetic")


class SyntheticOutputRefused(Exception):
    pass


def _within(child: pathlib.Path, parent: pathlib.Path) -> bool:
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def resolve_synthetic_output_dir(env=None, repo_root: pathlib.Path = REPO_ROOT) -> pathlib.Path:
    env = os.environ if env is None else env
    if str(env.get("NODE_ENV", "")).lower() == "production":
        raise SyntheticOutputRefused("synthetic generators never run with NODE_ENV=production")
    raw = str(env.get("ALO_SYNTHETIC_OUTPUT_DIR", "")).strip()
    if not raw:
        raise SyntheticOutputRefused(
            "set ALO_SYNTHETIC_OUTPUT_DIR to a directory under " + " or ".join(ALLOWED_SYNTHETIC_ROOTS)
        )
    target = (repo_root / raw).resolve()
    if not any(_within(target, (repo_root / r).resolve()) for r in ALLOWED_SYNTHETIC_ROOTS):
        raise SyntheticOutputRefused(
            f"refusing output directory {raw}: only " + " or ".join(ALLOWED_SYNTHETIC_ROOTS) + " (non-production) are allowed"
        )
    return target


def require_synthetic_output_dir(script_name: str) -> pathlib.Path:
    """Return the output dir, or print the reason and exit 1 before any work."""
    try:
        out = resolve_synthetic_output_dir()
    except SyntheticOutputRefused as exc:
        print(f"[{script_name}] REFUSED: {exc}. No files were written.", file=sys.stderr)
        sys.exit(1)
    print(f"[{script_name}] writing SYNTHETIC, UNVERIFIED output only under {out}", file=sys.stderr)
    return out


def refuse_permanently(script_name: str, reason: str) -> None:
    """For historical generators that rewrite production source or data: always exit 1."""
    print(f"[{script_name}] DISABLED: {reason} No files were written.", file=sys.stderr)
    sys.exit(1)
