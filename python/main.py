
import os

from flask import Flask
from flask import jsonify
from flask import request
from flask import Blueprint
from flask_cors import CORS

# from graph_tool.topology import shortest_path
from osmgt import OsmGt
import json
import geopandas as gpd
from shapely.ops import linemerge
from shapely.geometry import mapping
from shapely.geometry import Point
from shapely.geometry import LineString
from shapely.wkt import loads
import pandas as pd
from operator import itemgetter
from shapely.ops import cascaded_union



def multilinestring_continuity(multilinestring):

    """

    :param multilinestring: MultiLineString with different orientations
    :type multilinestring: shapely.geometry.MultiLineString
    :return: re-oriented MultiLineSting
    :rtype: shapely.geometry.MultiLineString
    """

    dict_line = {key: value for key, value in enumerate(multilinestring)}
    for key, line in dict_line.items():
        if key != 0 and dict_line[key - 1].coords[-1] == line.coords[-1]:
            dict_line[key] = LineString(line.coords[::-1])
    return [v for _, v in dict_line.items()]


class ReduceYouPathArea(Exception):
    pass


class computePath:

    def __init__(self, geojson):

        self._geojson = json.loads(geojson)

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
        points_data = self.compute_points_data()
        # return {
        #     "type": "FeatureCollection",
        #     "features": [
        #         {
        #             "type": "Feature",
        #             "properties": {
        #                 "length": float(self._output_path.length)
        #             },
        #             "geometry": mapping(self._output_path)
        #         }
        #     ]
        # }
        return {
            # "length": float(self._total_length),
            "data": points_data
        }

    def compute_points_data(self):

        # paths_merged = linemerge(self._output_path)
        paths_merged = self._output_path

        path = []
        for path_found in paths_merged:
            coordinates = path_found.coords
            for coord in coordinates:
                # if coord not in path:
                path.append(coord)
        paths_merged = LineString(path)
        print(paths_merged)
        # for f in paths_merged:
        #     print("PATH", f)
        # paths_merged = linemerge(paths_merged)


        # print(paths_merged.wkt, self._start_node.wkt)
        # if paths_merged.coords[0] != self._start_node.coords[0]:
        #     paths_merged = LineString(paths_merged.coords[::-1])
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": mapping(Point(coords))

                }
                for coords in paths_merged.coords
            ]
        }

    def compute_path(self):
        from graph_tool.topology import shortest_path

        network_from_web_found_topology_fixed = OsmGt.roads_from_bbox(
            (self._min_y, self._min_x, self._max_y, self._max_x),
            self._input_nodes_data
        )

        graph = network_from_web_found_topology_fixed.get_graph()
        network_gdf = network_from_web_found_topology_fixed.get_gdf()

        print("aaaa", self._input_nodes_data.shape, network_gdf.shape)
        self._start_node = self._input_nodes_data.loc[self._input_nodes_data["position"] == 1]["geometry"].iloc[0]
        nodes_path = [
            {
                "position": int(row["position"]), "geometry": row["geometry"].wkt
            }
            for _, row in self._input_nodes_data.iterrows()
        ]
        # print(nodes_path)
        nodes_path_ordered = sorted(nodes_path, key=itemgetter('position'), reverse=False)
        paths_to_compute = list(zip(nodes_path_ordered, nodes_path_ordered[1:]))
        # print("paaths", paths_to_compute)

        self._output_path = []
        path_ids = []
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
            print()

            shortest_path_gdf = network_gdf.copy(deep=True)
            # # get path by using edge names
            for edge in path_edges:
                path_ids.append(graph.edge_names[edge])

            # print("GDF", len(shortest_path_gdf))
            # shortest_path_gdf = shortest_path_gdf[shortest_path_gdf['topo_uuid'].isin(path_ids)]
            # self._total_length = sum(shortest_path.geometry.length.to_list())

            # get path by using nodes names
            # path_ids = [
            #     graph.vertex_names[vertex]
            #     for vertex in path_vertices
            # ]
            # nodes_wkt = pd.Series(path_ids).drop_duplicates().tolist()

            # self._output_path.extend(nodes_wkt)
            # for f in shortest_path_gdf["geometry"]:
            #     print(f.wkt)
            #     self._output_path.append(f)
        for path_id in path_ids:
            print(path_id)
            self._output_path.append(shortest_path_gdf[shortest_path_gdf['topo_uuid'] == path_id]["geometry"].iloc[0])


def app():

    url_prefix = '/api/v1'
    compute_path = Blueprint(
        'compute_path',
        __name__,
        template_folder='templates',
        url_prefix=url_prefix
    )

    def bad_request(message, error_value):
        response = jsonify({'message': message})
        response.status_code = error_value
        return response

    @compute_path.route('/data', methods=['GET'])
    def get_eq_data():

        url_arg_keys = {
            "geojson": request.args.get('geojson', type=str, default="aaaa"),
        }

        try:
            data = computePath(
                geojson=url_arg_keys["geojson"]
            ).run()

            output = jsonify(
                {
                    "path": data
                }
            )

        except ReduceYouPathArea as _:
            output = jsonify(
                {
                    "path": "Reduce your path. Overpass api could be angry ;)"
                }
            )
        # except (ValueError) as err:
        #     err = repr(err)
        #     return bad_request(err, 400)

        output.headers.add('Access-Control-Allow-Origin', '*')
        return output

    app = Flask(__name__)
    CORS(app)

    app.config['TRAP_BAD_REQUEST_ERRORS'] = True
    app.register_blueprint(compute_path)

    return app


app = app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

# http://127.0.0.1:5000/api/v1/data?geojson=aa