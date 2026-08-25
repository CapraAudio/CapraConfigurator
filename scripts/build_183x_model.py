"""Combine the 183X stock assembly with aligned printable replacement parts."""

import argparse

import numpy as np
import trimesh


parser = argparse.ArgumentParser()
parser.add_argument("stock")
parser.add_argument("replacement")
parser.add_argument("destination")
args = parser.parse_args()


def geometry(scene, index):
    return scene.geometry[f"solid_{index:03d}"].copy()


def fit_rigid_transform(source_scene, target_scene, pairs):
    """Fit replacement-space centroids to their stock-space counterparts."""
    source = np.asarray([geometry(source_scene, replacement).centroid for stock, replacement in pairs])
    target = np.asarray([geometry(target_scene, stock).centroid for stock, replacement in pairs])
    source_center = source.mean(axis=0)
    target_center = target.mean(axis=0)
    u, _, vt = np.linalg.svd((source - source_center).T @ (target - target_center))
    rotation = u @ vt
    if np.linalg.det(rotation) < 0:
        u[:, -1] *= -1
        rotation = u @ vt
    transform = np.eye(4)
    transform[:3, :3] = rotation.T
    transform[:3, 3] = target_center - source_center @ rotation
    return transform


stock = trimesh.load(args.stock, force="scene")
replacement = trimesh.load(args.replacement, force="scene")

# The printable STEP is exported in a different coordinate frame and its three
# assemblies have independent placements. Fit each assembly separately.
cup_a_transform = fit_rigid_transform(
    replacement, stock, [(index, index) for index in range(36)]
)
headband_transform = fit_rigid_transform(
    replacement,
    stock,
    [(40, 41), (41, 42), (53, 43), (55, 44), (56, 45), (57, 46),
     (58, 47), (60, 50), (61, 51), (62, 52), (63, 53)],
)
cup_b_transform = fit_rigid_transform(
    replacement,
    stock,
    [(65, 56), (66, 57), (67, 58), (68, 59), (69, 60),
     *[(index, index - 8) for index in range(70, 79)],
     (90, 86), (91, 87), (92, 110)],
)

# Put Y-up CAD into the viewer's Y-up/Z-depth frame used by the configurator.
stock_to_web = np.asarray([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, -1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
])

combined = trimesh.Scene()
for index in range(93):
    mesh = geometry(stock, index)
    mesh.apply_transform(stock_to_web)
    combined.add_geometry(mesh, node_name=f"solid_{index:03d}", geom_name=f"solid_{index:03d}")

replacement_groups = [
    (cup_a_transform, [11, 19, 20, 21, 22, 23]),
    (headband_transform, [42, 48, 49, 54, 55]),
    (cup_b_transform, [68, 82, 84, 85, 86, 87]),
]
for alignment, indices in replacement_groups:
    for index in indices:
        mesh = geometry(replacement, index)
        mesh.apply_transform(alignment)
        mesh.apply_transform(stock_to_web)
        combined.add_geometry(
            mesh,
            node_name=f"replacement_{index:03d}",
            geom_name=f"replacement_{index:03d}",
        )

combined.export(args.destination, file_type="glb")
print(f"Stock solids: 93")
print(f"Replacement solids: {sum(len(indices) for _, indices in replacement_groups)}")
print(f"Output: {args.destination}")
