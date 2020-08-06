
from osmgt import OsmGt
import json
import geopandas as gpd
from shapely.geometry import mapping
from shapely.geometry import Point
from shapely.geometry import LineString
from operator import itemgetter
from graph_tool.topology import shortest_path

from core.geometry import reproject
from core.geometry import multilinestring_continuity
from core.geometry import compute_wg84_line_length


class ReduceYouPathArea(Exception):
    pass


def get_elevation(coordinates):
    import requests
    parameters = {
        "locations": f"{coordinates[-1]},{coordinates[0]}"
    }
    response_code = 0
    while response_code != 200:

        response = requests.get("https://api.opentopodata.org/v1/mapzen?", params=parameters)
        response_code = response.status_code

    print(response.url)
    result = response.json()["results"][0]["elevation"]
    print(result)
    return result


class ComputePath:

    __DEFAULT_EPSG = 4326
    __METRIC_EPSG = 3857

    def __init__(self, geojson, mode, elevation_mode):

        self._geojson = json.loads(geojson)
        self._mode = mode
        self._elevation_mode = elevation_mode
        print("lalalllaaaaa", self._elevation_mode)

    def prepare_data(self):
        self._input_nodes_data = gpd.GeoDataFrame.from_features(self._geojson["features"])
        self._input_nodes_data["bounds"] = self._input_nodes_data["geometry"].apply(lambda x: ", ".join((map(str, x.bounds))))

        bound_proceed = self._input_nodes_data.copy(deep=True)
        bound_proceed.set_crs(epsg=4326, inplace=True)
        bound_proceed.to_crs(epsg=3857, inplace=True)
        bound_proceed["geometry"] = bound_proceed.geometry.buffer(500)

        bbox_3857 = bound_proceed.geometry.total_bounds
        min_x, min_y, max_x, max_y = bbox_3857
        if LineString([(min_x, min_y), (max_x, max_y)]).length > 10000:
            raise ReduceYouPathArea()

        bound_proceed.to_crs(epsg=4326, inplace=True)
        self._min_x, self._min_y, self._max_x, self._max_y = bound_proceed.geometry.total_bounds

        print(self._min_x)
        print(self._min_y)
        print(self._max_x)
        print(self._max_y)

    def run(self):
        self.prepare_data()
        self.compute_path()
        data_formated = self.format_data()
        geojson_points_data = self.to_geojson_points(data_formated)
        geojson_line_data = self.to_geojson_linestring(data_formated)

        return geojson_points_data, geojson_line_data

    def format_data(self):
        paths_merged = []

        if self._mode == "pedestrian":
            last_coordinates = None
            for enum, path in enumerate(self._output_paths):
                if last_coordinates is not None:
                    if last_coordinates != path["path_geom"][0].coords[0]:
                        # we have to revert the coord order of the 1+ elements
                        path["path_geom"] = [LineString(path["path_geom"][0].coords[::-1])] + path["path_geom"][1:]

                path["path_geom"] = multilinestring_continuity(path["path_geom"])
                if self._elevation_mode == "enabled":
                    path["coords_flatten_path"] = [
                        tuple(list(coords) + [get_elevation(coords)])
                        for line in path["path_geom"]
                        for coords in line.coords
                    ]
                else:
                    path["coords_flatten_path"] = [
                        coords
                        for line in path["path_geom"]
                        for coords in line.coords
                    ]
                last_coordinates = path["coords_flatten_path"][-1]
                paths_merged.append(path)

        else:
            for path in self._output_paths:

                if self._elevation_mode == "enabled":
                    path["coords_flatten_path"] = [
                        tuple(list(coords) + [get_elevation(coords)])
                        for line in path["path_geom"]
                        for coords in line.coords
                    ]
                else:
                    path["coords_flatten_path"] = [
                        coords
                        for line in path["path_geom"]
                        for coords in line.coords
                    ]
                paths_merged.append(path)

        return paths_merged

    def to_geojson_points(self, data):
        features = []
        for path in data:
            for enum, coords in enumerate(path["coords_flatten_path"]):
                if enum == 0:
                    distance = 0
                else:
                    print("b", path["coords_flatten_path"][:enum + 1])
                    distance = compute_wg84_line_length(LineString(path["coords_flatten_path"][:enum + 1]))

                if self._elevation_mode == "enabled":
                    elevation = coords[-1]
                else:
                    elevation = "None"

                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "elevation": elevation,
                            "distance": distance
                        },
                        "geometry": mapping(Point(coords))
                    }
                )

        return {
            "type": "FeatureCollection",
            "features": features
        }

    def to_geojson_linestring(self, data):

        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "from_id": feature["from_id"],
                        "to_id": feature["to_id"],
                        "length": compute_wg84_line_length(LineString(feature["coords_flatten_path"]))
                    },
                    "geometry": mapping(LineString(feature["coords_flatten_path"])),
                }
                for feature in data

            ]
        }

    def compute_path(self):
        network_from_web_found_topology_fixed = OsmGt.roads_from_bbox(
            (self._min_y, self._min_x, self._max_y, self._max_x),
            self._mode,
            self._input_nodes_data
        )

        graph = network_from_web_found_topology_fixed.get_graph()
        network_gdf = network_from_web_found_topology_fixed.get_gdf()

        print("aaaa", self._input_nodes_data.shape, network_gdf.shape)
        self._start_node = self._input_nodes_data.loc[self._input_nodes_data["position"] == 1]["geometry"].iloc[0]
        nodes_path = [
            {
                "position": int(row["position"]), "id": int(row["id"]), "geometry": row["geometry"].wkt
            }
            for _, row in self._input_nodes_data.iterrows()
        ]
        nodes_path_ordered = sorted(nodes_path, key=itemgetter('position'), reverse=False)
        paths_to_compute = list(zip(nodes_path_ordered, nodes_path_ordered[1:]))

        self._output_paths = []
        for enum, (start_node, end_node) in enumerate(paths_to_compute):
            source_vertex = graph.find_vertex_from_name(start_node["geometry"])
            target_vertex = graph.find_vertex_from_name(end_node["geometry"])

            path_vertices, path_edges = shortest_path(
                graph,
                source=source_vertex,
                target=target_vertex,
                weights=graph.edge_weights
            )
            print(enum, path_edges)

            network_gdf_copy = network_gdf.copy(deep=True)
            # # get path by using edge names
            path_ids = [
                graph.edge_names[edge]
                for edge in path_edges
            ]
            self._output_paths.append(
                {
                    "from_id": int(start_node["id"]),
                    "to_id": int(end_node["id"]),
                    "path_geom": [
                        network_gdf_copy[network_gdf_copy['topo_uuid'] == path_id]["geometry"].iloc[0]
                        for path_id in path_ids
                    ],
                    "path_ids": path_ids
                }
            )