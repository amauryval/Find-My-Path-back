
import pyproj
from shapely.ops import transform
from functools import partial


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