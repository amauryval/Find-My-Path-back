
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
from shapely.wkt import loads
import pandas as pd


class computePath:

    def __init__(self, geojson):

        self._geojson = json.loads(geojson)

    def prepare_data(self):
        self._input_nodes_data = gpd.GeoDataFrame.from_features(self._geojson["features"])
        self._input_nodes_data["bounds"] = self._input_nodes_data["geometry"].apply(lambda x: ", ".join((map(str, x.bounds))))
        self._min_x, self._min_y, self._max_x, self._max_y = self._input_nodes_data.geometry.total_bounds

    def run(self):
        self.prepare_data()
        self.compute_path()

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
            "data": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": mapping(loads(node))

                    }
                    for node in self._output_path
                ]
            }
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
        nodes_path = [
            {
                "position": row["position"], "geometry": row["geometry"].wkt
            }
            for _, row in self._input_nodes_data.iterrows()
        ]
        paths_to_compute = list(zip(nodes_path, nodes_path[1:]))

        self._output_path = []
        for start_node, end_node in paths_to_compute:
            print("a")
            source_vertex = graph.find_vertex_from_name(start_node["geometry"])
            target_vertex = graph.find_vertex_from_name(end_node["geometry"])

            path_vertices, path_edges = shortest_path(
                graph,
                source=source_vertex,
                target=target_vertex,
                weights=graph.edge_weights
            )

            # # get path by using edge names
            # path_ids = [
            #     graph.edge_names[edge]
            #     for edge in path_edges
            # ]
            # shortest_path = network_gdf.copy(deep=True)
            # shortest_path = shortest_path[shortest_path['topo_uuid'].isin(path_ids)]
            # self._total_length = sum(shortest_path.geometry.length.to_list())

            # get path by using nodes names
            path_ids = [
                graph.vertex_names[vertex]
                for vertex in path_vertices
            ]
            nodes_wkt = pd.Series(path_ids).drop_duplicates().tolist()

            self._output_path.extend(nodes_wkt)

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

            output.headers.add('Access-Control-Allow-Origin', '*')

            return output

        except (ValueError) as err:
            err = repr(err)
            return bad_request(err, 400)

    app = Flask(__name__)
    CORS(app)

    app.config['TRAP_BAD_REQUEST_ERRORS'] = True
    app.register_blueprint(compute_path)

    return app


app = app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)

# http://127.0.0.1:5000/api/v1/data?geojson=aa