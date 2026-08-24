"""Convert a STEP assembly to a grouped, web-ready GLB.

Solid order and names are preserved as solid_000 onward so product definitions
can map CAD solids to customizable parts.
"""

import argparse
import numpy as np
import trimesh
from OCP.BRepAdaptor import BRepAdaptor_Curve, BRepAdaptor_Surface
from OCP.BRep import BRep_Tool
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.GeomAbs import GeomAbs_Circle, GeomAbs_Cone
from OCP.Quantity import Quantity_Color, Quantity_TOC_sRGB
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDocStd import TDocStd_Document
from OCP.TopAbs import TopAbs_EDGE, TopAbs_FACE, TopAbs_REVERSED, TopAbs_SOLID
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ColorSurf, XCAFDoc_DocumentTool


parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('destination')
parser.add_argument(
    '--satyr-driver-offsets',
    action='store_true',
    help='Apply the small Satyr 4 diaphragm offsets used by its production GLB.',
)
parser.add_argument(
    '--solid-offset',
    action='append',
    default=[],
    metavar='INDEX,DX,DY,DZ',
    help='Translate one solid by the supplied millimeter offsets; may be repeated.',
)
args = parser.parse_args()
source, destination = args.source, args.destination
solid_offsets = {}
for offset in args.solid_offset:
    index, dx, dy, dz = offset.split(',')
    solid_offsets[int(index)] = (float(dx), float(dy), float(dz))

document = TDocStd_Document(TCollection_ExtendedString("BinXCAF"))
reader = STEPCAFControl_Reader()
reader.SetColorMode(True)
if reader.ReadFile(source) != 1:
    raise RuntimeError(f"Could not read STEP file: {source}")
if not reader.Transfer(document):
    raise RuntimeError(f"Could not transfer STEP assembly: {source}")
shape = reader.Reader().OneShape()
color_tool = XCAFDoc_DocumentTool.ColorTool_s(document.Main())

# The original web model used 0.8 / 0.7. These tighter tolerances preserve
# smooth headphone curves without producing an impractically large asset.
BRepMesh_IncrementalMesh(shape, 0.18, False, 0.18, True).Perform()

scene = trimesh.Scene()
solids = TopExp_Explorer(shape, TopAbs_SOLID)
solid_index = 0


def edge_polygon_points(edge, missing_face, solid):
    face_iterator = TopExp_Explorer(solid, TopAbs_FACE)
    while face_iterator.More():
        adjacent_face = TopoDS.Face_s(face_iterator.Current())
        if not adjacent_face.IsSame(missing_face):
            edge_iterator = TopExp_Explorer(adjacent_face, TopAbs_EDGE)
            while edge_iterator.More():
                if edge.IsSame(edge_iterator.Current()):
                    location = adjacent_face.Location()
                    triangulation = BRep_Tool.Triangulation_s(adjacent_face, location)
                    if triangulation:
                        polygon = BRep_Tool.PolygonOnTriangulation_s(edge, triangulation, location)
                        if polygon:
                            transform = location.Transformation()
                            return np.asarray([
                                tuple(triangulation.Node(polygon.Node(index)).Transformed(transform).Coord())
                                for index in range(1, polygon.NbNodes() + 1)
                            ])
                edge_iterator.Next()
        face_iterator.Next()
    return None


def append_missing_cone(face, solid, vertices, triangles):
    """Tessellate full-period conical faces skipped by OpenCascade's mesher."""
    surface = BRepAdaptor_Surface(face)
    if surface.GetType() != GeomAbs_Cone:
        return False

    rings = []
    missing_circles = []
    edge_iterator = TopExp_Explorer(face, TopAbs_EDGE)
    while edge_iterator.More():
        edge = TopoDS.Edge_s(edge_iterator.Current())
        points = edge_polygon_points(edge, face, solid)
        if points is not None and len(points) > 2:
            if np.linalg.norm(points[0] - points[-1]) < 1e-7:
                points = points[:-1]
            rings.append(points)
        elif BRepAdaptor_Curve(edge).GetType() == GeomAbs_Circle:
            missing_circles.append(edge)
        edge_iterator.Next()
    if len(rings) == 1 and len(missing_circles) == 1:
        curve = BRepAdaptor_Curve(missing_circles[0])
        count = len(rings[0])
        first_parameter, last_parameter = curve.FirstParameter(), curve.LastParameter()
        rings.append(np.asarray([
            tuple(curve.Value(first_parameter + (last_parameter - first_parameter) * index / count).Coord())
            for index in range(count)
        ]))
    if len(rings) != 2 or len(rings[0]) != len(rings[1]):
        return False

    first, second = rings
    count = len(first)
    start = int(np.argmin(np.linalg.norm(second - first[0], axis=1)))
    forward = np.linalg.norm(first[1] - second[(start + 1) % count])
    reverse = np.linalg.norm(first[1] - second[(start - 1) % count])
    direction = 1 if forward <= reverse else -1
    second = np.asarray([second[(start + direction * index) % count] for index in range(count)])
    vertex_offset = len(vertices)
    vertices.extend(map(tuple, first))
    vertices.extend(map(tuple, second))

    for index in range(count):
        next_index = (index + 1) % count
        a, b = vertex_offset + index, vertex_offset + next_index
        d, c = vertex_offset + count + index, vertex_offset + count + next_index
        face_triangles = [(a, b, c), (a, c, d)]
        if face.Orientation() == TopAbs_REVERSED:
            face_triangles = [(x, z, y) for x, y, z in face_triangles]
        triangles.extend(face_triangles)

    return True

while solids.More():
    solid = TopoDS.Solid_s(solids.Current())
    vertices, triangles = [], []
    face_iterator = TopExp_Explorer(solid, TopAbs_FACE)

    while face_iterator.More():
        face = TopoDS.Face_s(face_iterator.Current())
        location = face.Location()
        triangulation = BRep_Tool.Triangulation_s(face, location)

        if triangulation:
            vertex_offset = len(vertices)
            transform = location.Transformation()
            for node_index in range(1, triangulation.NbNodes() + 1):
                point = triangulation.Node(node_index).Transformed(transform)
                vertices.append((point.X(), point.Y(), point.Z()))

            for triangle_index in range(1, triangulation.NbTriangles() + 1):
                a, b, c = triangulation.Triangle(triangle_index).Get()
                if face.Orientation() == TopAbs_REVERSED:
                    b, c = c, b
                triangles.append(
                    (vertex_offset + a - 1, vertex_offset + b - 1, vertex_offset + c - 1)
                )
        else:
            append_missing_cone(face, solid, vertices, triangles)

        face_iterator.Next()

    if vertices and triangles:
        mesh = trimesh.Trimesh(np.asarray(vertices), np.asarray(triangles), process=True)
        mesh.update_faces(mesh.nondegenerate_faces())
        mesh.remove_unreferenced_vertices()
        name = f"solid_{solid_index:03d}"

        if args.satyr_driver_offsets:
            # The Satyr 4 diaphragm surfaces are effectively coplanar with the
            # driver bodies. Its published asset separates the mirrored pair.
            if solid_index == 7:
                mesh.apply_translation((-0.45, 0.0, 0.0))
            elif solid_index == 48:
                mesh.apply_translation((0.45, 0.0, 0.0))
        if solid_index in solid_offsets:
            mesh.apply_translation(solid_offsets[solid_index])

        cad_color = Quantity_Color()
        if color_tool.GetColor(solid, XCAFDoc_ColorSurf, cad_color):
            red, green, blue = cad_color.Values(Quantity_TOC_sRGB)
            rgba = [round(red * 255), round(green * 255), round(blue * 255), 255]
            is_metal = solid_index in {9, 10, 50, 51}
            mesh.visual.material = trimesh.visual.material.PBRMaterial(
                name=f"step_color_{solid_index:03d}",
                baseColorFactor=rgba,
                metallicFactor=0.75 if is_metal else 0.0,
                roughnessFactor=0.32 if is_metal else 0.68,
            )
        scene.add_geometry(mesh, node_name=name, geom_name=name)

    solid_index += 1
    solids.Next()

scene.export(destination, file_type="glb")
print(f"Grouped solids: {len(scene.geometry)}")
print(f"Vertices: {sum(len(mesh.vertices) for mesh in scene.geometry.values()):,}")
print(f"Triangles: {sum(len(mesh.faces) for mesh in scene.geometry.values()):,}")
print(f"Output: {destination}")
