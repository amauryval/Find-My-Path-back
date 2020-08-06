
from pyproj import Proj
from pyproj import Transformer
import shapely.ops as sp_ops

from shapely.ops import transform
from functools import partial
from shapely.geometry import LineString

from pyproj import Geod


def multilinestring_continuity(linestrings):

    """
    :param linestrings: linestring with different orientations, directed with the last coords of the first element
    :type linestrings: list of shapely.geometry.MultiLineString
    :return: re-oriented MultiLineSting
    :rtype: shapely.geometry.MultiLineString
    """

    dict_line = {key: value for key, value in enumerate(linestrings)}
    for key, line in dict_line.items():
        if key != 0 and dict_line[key - 1].coords[-1] == line.coords[-1]:
            dict_line[key] = LineString(line.coords[::-1])
    return [v for _, v in dict_line.items()]


def reproject(geometry, from_epsg, to_epsg):
    """
    pyproj_reprojection

    :type geometry: shapely.geometry.*
    :type from_epsg: int
    :type to_epsg: int
    :rtype: shapely.geometry.*
    """

    if from_epsg != to_epsg:
        proj_transformer = Transformer.from_crs(f'EPSG:{from_epsg}', f'EPSG:{to_epsg}', always_xy=True)
        geometry = sp_ops.transform(proj_transformer.transform, geometry)

    return geometry


def compute_wg84_line_length(input_geom):
    """
    Compute the length of a wg84 line (LineString and MultiLineString)

    :param input_geom: input geometry
    :type input_geom: shapely.geometry.LineString or shapely.geometry.MultiLineString
    :return: the line length
    :rtype: float

    """
    total_length = 0

    if input_geom.geom_type == "MultiLineString":
        for geom_line in input_geom.geoms:
            total_length += compute_wg84_line_length(geom_line)

    elif input_geom.geom_type == "LineString":
        coordinates_pairs = list(zip(input_geom.coords, input_geom.coords[1:]))
        print("trololo", coordinates_pairs)
        for pair in coordinates_pairs:

            if len(pair[0]) == 3 or len(pair[1]) == 3:
                coords = pair[0][:-1] + pair[1][:-1]  # avoid to catch the elevation coord
            else:
                coords = pair[0] + pair[1]

            wgs84_geod = Geod(ellps='WGS84')
            _, _, length_computed = wgs84_geod.inv(*coords)
            total_length += length_computed

    return total_length