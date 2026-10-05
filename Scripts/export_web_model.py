# export_web_model.py
"""
Exports the trained Random Forest (Modelo/best_rf_pm25.pkl) to a compact binary
format that the static web version (GUI/web_predict.js) evaluates in plain JavaScript.

Layout of GUI/model/pm25_rf.bin.gz (gzip of four concatenated arrays, N = total nodes):
    feature  uint8   [N]   split feature index, or 255 for a leaf
    right    uint32  [N]   offset to the right child (relative to the node), 0 for leaves
    thr      float32 [N]   split threshold, or the leaf value for a leaf
Nodes are stored in pre-order, so the left child of node i is always i + 1.
Metadata (feature order, tree roots, sizes) goes to GUI/model/pm25_rf.json.

Usage (from the project root):
    python Scripts/export_web_model.py
"""

from __future__ import annotations

import gzip
import json
import sys
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

MODEL_PATH = ROOT / "Modelo" / "best_rf_pm25.pkl"
OUT_DIR = ROOT / "GUI" / "model"
LEAF = 255


def flatten_tree(tree) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Re-lays out one sklearn tree in pre-order."""
    left, right = tree.children_left, tree.children_right
    n = tree.node_count
    feat = np.empty(n, dtype=np.uint8)
    rel_right = np.zeros(n, dtype=np.uint32)
    thr = np.empty(n, dtype=np.float32)

    new_index = {}
    order = []
    stack = [0]
    while stack:
        node = stack.pop()
        new_index[node] = len(order)
        order.append(node)
        if left[node] != -1:
            stack.append(right[node])
            stack.append(left[node])  # popped first -> left child follows its parent

    for i, node in enumerate(order):
        if left[node] == -1:
            feat[i] = LEAF
            thr[i] = tree.value[node, 0, 0]
        else:
            feat[i] = tree.feature[node]
            # sklearn compares float32 inputs against a float64 threshold. Rounding the
            # threshold DOWN to float32 keeps `x <= thr` identical for every float32 x.
            t64 = tree.threshold[node]
            t32 = np.float32(t64)
            if float(t32) > t64:
                t32 = np.nextafter(t32, np.float32(-np.inf))
            thr[i] = t32
            rel_right[i] = new_index[right[node]] - i
    return feat, rel_right, thr


def main() -> None:
    bundle = joblib.load(MODEL_PATH)
    model, feature_cols = bundle["model"], bundle["feature_cols"]

    feats, rights, thrs, roots = [], [], [], []
    total = 0
    for est in model.estimators_:
        f, r, t = flatten_tree(est.tree_)
        roots.append(total)
        total += len(f)
        feats.append(f)
        rights.append(r)
        thrs.append(t)

    feat = np.concatenate(feats)
    right = np.concatenate(rights).astype("<u4")
    thr = np.concatenate(thrs).astype("<f4")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = feat.tobytes() + right.tobytes() + thr.tobytes()
    with gzip.GzipFile(OUT_DIR / "pm25_rf.bin.gz", "wb", compresslevel=9, mtime=0) as fh:
        fh.write(payload)

    meta = {
        "n_trees": len(roots),
        "n_nodes": int(total),
        "roots": roots,
        "feature_cols": list(feature_cols),
        "leaf": LEAF,
    }
    (OUT_DIR / "pm25_rf.json").write_text(json.dumps(meta), encoding="utf-8")
    size_mb = (OUT_DIR / "pm25_rf.bin.gz").stat().st_size / 1e6
    print(f"{len(roots)} trees, {total} nodes -> {size_mb:.1f} MB (gzip)")


if __name__ == "__main__":
    main()
