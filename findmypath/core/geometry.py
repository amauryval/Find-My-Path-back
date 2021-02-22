
from pyproj import Geod


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
        for pair in coordinates_pairs:

            if len(pair[0]) == 3 or len(pair[1]) == 3:
                coords = pair[0][:-1] + pair[1][:-1]  # avoid to catch the elevation coord
            else:
                coords = pair[0] + pair[1]

            wgs84_geod = Geod(ellps='WGS84')
            _, _, length_computed = wgs84_geod.inv(*coords)
            total_length += length_computed

    return total_length
