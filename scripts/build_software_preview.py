import sys
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image, ImageDraw

CUSTOMIZABLE_SOLIDS = [
    'S000', 'S001', 'S002', 'S003', 'S004', 'S005',
    'S006', 'S013', 'S014', 'S015', 'S016', 'S017', 'S018', 'S021',
    'S046', 'S054', 'S055', 'S056', 'S059', 'S060', 'S061', 'S063',
]

source = Path(sys.argv[1])
output = Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
scene = trimesh.load(source, force='scene')
center = (scene.bounds[0] + scene.bounds[1]) / 2

angle_y, angle_x = np.radians(-22), np.radians(8)
ry = np.array([[np.cos(angle_y), 0, np.sin(angle_y)], [0, 1, 0], [-np.sin(angle_y), 0, np.cos(angle_y)]])
rx = np.array([[1, 0, 0], [0, np.cos(angle_x), -np.sin(angle_x)], [0, np.sin(angle_x), np.cos(angle_x)]])
rotation = rx @ ry
solid_codes = {solid: index + 1 for index, solid in enumerate(CUSTOMIZABLE_SOLIDS)}

records = []
projected_points = []
for name, mesh in scene.geometry.items():
    solid = 'S' + name.split('_')[-1]
    code = solid_codes.get(solid, 0)
    vertices = (np.asarray(mesh.vertices, dtype=np.float64) - center) @ rotation.T
    projected_points.append(vertices[:, :2])
    for face in np.asarray(mesh.faces):
        tri = vertices[face]
        normal = np.cross(tri[1] - tri[0], tri[2] - tri[0])
        length = np.linalg.norm(normal)
        if length == 0 or normal[2] <= 0:
            continue
        brightness = int(72 + 120 * min(1.0, normal[2] / length))
        records.append((float(tri[:, 2].mean()), tri[:, :2], code, brightness))

points = np.concatenate(projected_points)
minimum, maximum = points.min(axis=0), points.max(axis=0)
width, height, margin = 1400, 1000, 55
scale = min((width - margin * 2) / (maximum[0] - minimum[0]), (height - margin * 2) / (maximum[1] - minimum[1]))
offset_x = (width - (maximum[0] - minimum[0]) * scale) / 2
offset_y = (height - (maximum[1] - minimum[1]) * scale) / 2

def pixels(poly):
    return [(int((p[0] - minimum[0]) * scale + offset_x), int((maximum[1] - p[1]) * scale + offset_y)) for p in poly]

base = Image.new('RGB', (width, height), '#e8e4dc')
segments = Image.new('L', (width, height), 0)
base_draw, segment_draw = ImageDraw.Draw(base), ImageDraw.Draw(segments)
for _, poly, code, brightness in sorted(records, key=lambda item: item[0]):
    coords = pixels(poly)
    base_draw.polygon(coords, fill=(brightness, brightness, brightness))
    segment_draw.polygon(coords, fill=code)

base.save(output / 'satyr-4-preview.png', optimize=True)
segment_array = np.asarray(segments)
for solid, code in solid_codes.items():
    mask = Image.fromarray(np.where(segment_array == code, 255, 0).astype(np.uint8), mode='L')
    mask.save(output / f'mask-{solid.lower()}.png', optimize=True)

print(f'Rendered {len(records):,} visible triangles and {len(CUSTOMIZABLE_SOLIDS)} color masks')
