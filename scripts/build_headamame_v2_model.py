"""Orient the assembled Head(amame) v2 CAD model for the web viewer."""

import argparse

import numpy as np
import trimesh


parser = argparse.ArgumentParser()
parser.add_argument("source")
parser.add_argument("destination")
args = parser.parse_args()

source = trimesh.load(args.source, force="scene")
destination = trimesh.Scene()

# Fusion exports this assembly with cup-to-cup on Y, height on Z, and depth on
# X. Map that right-handed frame to the configurator's X/Y/Z display frame.
cad_to_web = np.asarray([
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
])

for index in range(24):
    name = f"solid_{index:03d}"
    mesh = source.geometry[name].copy()
    mesh.apply_transform(cad_to_web)
    destination.add_geometry(mesh, node_name=name, geom_name=name)

destination.export(args.destination, file_type="glb")
print("Solids: 24")
print(f"Output: {args.destination}")
