
from osmgt import OsmGt
import json
import geopandas as gpd
from shapely.geometry import mapping
from shapely.geometry import Point
from shapely.geometry import LineString
from operator import itemgetter

from main.core.geometry import compute_wg84_line_length

import requests


class ReduceYouPathArea(Exception):
    pass


class ErrorComputePath(Exception):
    pass


import string
import random


def id_generator(size=10):
    return ''.join(random.choice(string.ascii_uppercase) for _ in range(size))


class ComputePath:

    __DEFAULT_EPSG = 4326
    __METRIC_EPSG = 3857
    __CHUNK_SIZE = 99  # api mapzen limit == 100
    __AREA_SIZE_TO_WORK = 500  # meters
    __MAX_AREA_SIZE = 10000  # meters
    __API_MAPZEN_URL = "https://api.opentopodata.org/v1/mapzen?"

    def __init__(self, path_name, geojson, mode, elevation_mode, is_loop):

        self._elevation_values = []
        self._distance_value = 0

        self._path_name = path_name
        self._geojson = json.loads(geojson)
        self._mode = mode
        # TODO : elevation should be a boolean
        self._elevation_mode = elevation_mode
        self._is_loop = is_loop

    def prepare_data(self):
        self._input_nodes_data = gpd.GeoDataFrame.from_features(self._geojson["features"])

        bound_proceed = self._input_nodes_data.copy(deep=True)
        bound_proceed.set_crs(epsg=self.__DEFAULT_EPSG, inplace=True)
        bound_proceed.to_crs(epsg=self.__METRIC_EPSG, inplace=True)
        bound_proceed["geometry"] = bound_proceed.geometry.buffer(self.__AREA_SIZE_TO_WORK)

        bbox = bound_proceed.geometry.total_bounds
        min_x, min_y, max_x, max_y = bbox
        if LineString([(min_x, min_y), (max_x, max_y)]).length > self.__MAX_AREA_SIZE:
            raise ReduceYouPathArea()

        bound_proceed.to_crs(epsg=self.__DEFAULT_EPSG, inplace=True)
        return bound_proceed.geometry.total_bounds

    def run(self):
        self._bbox_to_use = self.prepare_data()

        output_path = self.compute_path()
        geojson_points_data = self.to_geojson_points(self._path_name, output_path)
        geojson_line_data = self.to_geojson_linestring(self._path_name, output_path)

        if not self._elevation_mode:
            self._elevation_values = [0]

        path_stats = {
            "nodes_count": len(self._input_nodes_data),
            "height_min": min(self._elevation_values),
            "height_max": max(self._elevation_values),
            "height_diff": max(self._elevation_values) - min(self._elevation_values),
            "length": self._distance_value
        }

        return geojson_points_data, geojson_line_data, path_stats

    def to_geojson_points(self, path_name, data):
        features = []
        point_position = 0
        for path in data:
            for enum, node_coord in enumerate(path["geometry"]):
                nodes_to_proceed = path["geometry"][:enum + 1]
                if len(nodes_to_proceed) > 1:
                    distance_point = compute_wg84_line_length(LineString(nodes_to_proceed))
                else:
                    distance_point = 0

                if self._elevation_mode:
                    # TODO check Z value
                    elevation = node_coord[-1]
                    self._elevation_values.append(elevation)
                else:
                    elevation = -9999

                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "position": str(point_position),
                            "uuid": id_generator(),
                            "path_name": path_name,
                            "height": elevation,
                            "distance": self._distance_value + distance_point,
                        },
                        "geometry": mapping(Point(node_coord))
                    }
                )
                point_position += 1
            self._distance_value += distance_point

        return {
            "type": "FeatureCollection",
            "features": features
        }

    @staticmethod
    def to_geojson_linestring(path_name, data):

        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "path_position": feature["path_step"],
                        "path_name": path_name,
                        "source_node": feature["source_node"],
                        "target_node": feature["target_node"],
                        "length": compute_wg84_line_length(LineString(feature["geometry"]))
                    },
                    "geometry": mapping(LineString(feature["geometry"])),
                }
                for feature in data
            ]
        }

    def compute_path(self):
        output_paths = []

        nodes_path = [
            {
                "position": int(row["position"]), "geometry": row["geometry"]
            }
            for _, row in self._input_nodes_data.iterrows()
        ]

        if self._is_loop:
            loop_position = len(nodes_path) - 1
            loop_geometry = nodes_path[0]["geometry"]
            nodes_path.append(
                {
                    "position": loop_position, "geometry": loop_geometry
                }
            )

        nodes_path_ordered = sorted(nodes_path, key=itemgetter('position'), reverse=False)
        paths_to_compute = list(zip(nodes_path_ordered, nodes_path_ordered[1:]))

        path_ordered = {
            str(enum): (start_node["geometry"], end_node["geometry"])
            for enum, (start_node, end_node) in enumerate(paths_to_compute)
        }

        output_gdf = OsmGt.shortest_path_from_bbox(
            self._bbox_to_use,
            list(path_ordered.values()),
            self._mode,
        )

        for order, path_coord in path_ordered.items():
            source_node_wkt = path_coord[0].wkt
            target_node_wkt = path_coord[-1].wkt

            geom_data = output_gdf.loc[
                (output_gdf["source_node"] == source_node_wkt) & (output_gdf["target_node"] == target_node_wkt)
            ].iloc[0]["geometry"].coords

            if self._elevation_mode:
                geom_data = self.get_elevation(geom_data)

            output_paths.append({
                "source_node": source_node_wkt,
                "target_node": target_node_wkt,
                "path_step": order,
                "geometry": geom_data
            })

        return output_paths

    @staticmethod
    def chunks(features, chunk_size):
        for idx in range(0, len(features), chunk_size):
            yield features[idx:idx + chunk_size]

    def get_elevation(self, coordinates):
        elevation_coords = []

        unique_coordinates = list(set(coordinates))
        for coords_chunk in self.chunks(unique_coordinates, self.__CHUNK_SIZE):

            coords_chunk = "|".join([",".join([str(coord[-1]), str(coord[0])]) for coord in set(coords_chunk)])
            parameters = {
                "locations": coords_chunk
            }

            response_code = 0
            response = None
            while response_code != 200:
                response = requests.get(self.__API_MAPZEN_URL, params=parameters)
                response_code = response.status_code

            if response is not None:
                results = response.json()["results"]
            else:
                raise ErrorComputePath(f"None reponse from {self.__API_MAPZEN_URL}")

            elevation_coords.extend(results)

        coordinates_with_elevation = []
        for orig_coord in coordinates:
            new_coord = list(filter(
                lambda x: orig_coord == tuple([x["location"]["lng"], x["location"]["lat"]]),
                elevation_coords
            ))
            if len(new_coord) == 1:
                new_coord = new_coord[0]
                coordinates_with_elevation.append(
                    tuple(
                        [
                            new_coord["location"]["lng"],
                            new_coord["location"]["lat"],
                            new_coord["elevation"]
                        ]
                    )
                )
            else:
                raise ErrorComputePath(f"Elevation result not found for: {orig_coord}")

        return coordinates_with_elevation
