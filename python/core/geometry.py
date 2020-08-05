
import pyproj
from shapely.ops import transform
from functools import partial
from shapely.geometry import LineString


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
        geometry = transform(
            partial(
                pyproj.transform,
                pyproj.CRS(from_epsg),
                pyproj.CRS(to_epsg),
            ),
            geometry,
        )

    return geometry