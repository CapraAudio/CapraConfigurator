import argparse
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image, ImageDraw

SATYR_CUSTOMIZABLE_SOLIDS = [
    'S000', 'S001', 'S002', 'S003', 'S004', 'S005',
    'S006', 'S013', 'S014', 'S015', 'S016', 'S017', 'S018', 'S021',
    'S046', 'S054', 'S055', 'S056', 'S059', 'S060', 'S061', 'S063',
]

parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('output')
parser.add_argument('--name', default='satyr-4')
parser.add_argument('--mask-prefix', default='')
parser.add_argument('--solids', help='Comma-separated customizable solid IDs')
parser.add_argument('--groups', help='Semicolon-separated mask groups in GROUP:S001,S002 format')
parser.add_argument('--hidden-solids', default='', help='Comma-separated solid IDs omitted from the preview')
args = parser.parse_args()
hidden_solids = set(filter(None, args.hidden_solids.split(',')))

if args.groups:
    mask_groups = {}
    for group in args.groups.split(';'):
        group_id, solids = group.split(':', 1)
        mask_groups[group_id] = solids.split(',')
else:
    customizable_solids = args.solids.split(',') if args.solids else SATYR_CUSTOMIZABLE_SOLIDS
    mask_groups = {solid: [solid] for solid in customizable_solids}
source = Path(args.source)
output = Path(args.output)
output.mkdir(parents=True, exist_ok=True)
scene = trimesh.load(source, force='scene')
center = (scene.bounds[0] + scene.bounds[1]) / 2

angle_y, angle_x = np.radians(-22), np.radians(8)
ry = np.array([[np.cos(angle_y), 0, np.sin(angle_y)], [0, 1, 0], [-np.sin(angle_y), 0, np.cos(angle_y)]])
rx = np.array([[1, 0, 0], [0, np.cos(angle_x), -np.sin(angle_x)], [0, np.sin(angle_x), np.cos(angle_x)]])
rotation = rx @ ry
group_codes = {group_id: index + 1 for index, group_id in enumerate(mask_groups)}
solid_codes = {
    solid: group_codes[group_id]
    for group_id, solids in mask_groups.items()
    for solid in solids
}

records = []
projected_points = []
for name, mesh in scene.geometry.items():
    if name.lower().startswith('replacement_'):
        continue
    solid = 'S' + name.split('_')[-1]
    if solid in hidden_solids:
        continue
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

base.save(output / f'{args.name}-preview.png', optimize=True)
segment_array = np.asarray(segments)
for group_id, code in group_codes.items():
    mask = Image.fromarray(np.where(segment_array == code, 255, 0).astype(np.uint8), mode='L')
    mask.save(output / f'mask-{args.mask_prefix}{group_id.lower()}.png', optimize=True)

print(f'Rendered {len(records):,} visible triangles and {len(mask_groups)} color masks')
