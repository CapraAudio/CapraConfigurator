"""Convert the Satyr 4 STEP assembly to a grouped, web-ready GLB.

Solid order and names are preserved as solid_000 through solid_086 so the
configurator can continue mapping CAD solids to customizable part groups.
"""

import sys

import numpy as np
import trimesh
from OCP.BRep import BRep_Tool
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.Quantity import Quantity_Color, Quantity_TOC_sRGB
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDocStd import TDocStd_Document
from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED, TopAbs_SOLID
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ColorSurf, XCAFDoc_DocumentTool


source, destination = sys.argv[1], sys.argv[2]

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

        face_iterator.Next()

    if vertices and triangles:
        mesh = trimesh.Trimesh(np.asarray(vertices), np.asarray(triangles), process=True)
        mesh.update_faces(mesh.nondegenerate_faces())
        mesh.remove_unreferenced_vertices()
        name = f"solid_{solid_index:03d}"

        # The white driver diaphragm surfaces are effectively coplanar with
        # the dark driver bodies in the source assembly. Separate the mirrored
        # pair by less than half a millimeter to prevent browser depth fighting.
        if solid_index == 7:
            mesh.apply_translation((-0.45, 0.0, 0.0))
        elif solid_index == 48:
            mesh.apply_translation((0.45, 0.0, 0.0))

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
