
import os

from flask import Flask
from flask import jsonify
from flask import request
from flask import Blueprint
from flask_cors import CORS

from findmypath.compute_path import ComputePath
from findmypath.compute_path import ReduceYouPathArea

from findmypath.find_location import FindLocation
from findmypath.find_location import LocationNotFound

from osmgt.compoments.core import EmptyData


find_my_path = Blueprint(
    'find_my_path',
    __name__,
    template_folder='templates',
    url_prefix='/api/v1/findmypath'
)

def bad_request(message, error_value):
    response = jsonify({'message': message})
    response.status_code = error_value
    return response


@find_my_path.route('/location', methods=['GET'])
def get_location():

    url_arg_keys = {
        "name": request.args.get('name', type=str),
    }

    try:
        bbox = FindLocation(
            url_arg_keys["name"]
        ).run()
        output = jsonify(
            {
                "bbox": bbox
            }
        )

    except LocationNotFound as _:
        return bad_request("area not found", 400)


    output.headers.add('Access-Control-Allow-Origin', '*')
    return output

@find_my_path.route('/health', methods=['GET'])
def get_api_status():
    output = jsonify(
        {
            "status": "Ready"
        }
    )

    return output

@find_my_path.route('/path', methods=['GET'])
def get_path():

    url_arg_keys = {
        "path_name": request.args.get('path_name', type=str),
        "elevation_mode": request.args.get('elevation_mode', type=bool),
        "mode": request.args.get('mode', type=str),
        "geojson": request.args.get('geojson', type=str),
        "is_loop": request.args.get('is_loop', type=str),

    }

    try:
        geojson_points_data, geojson_line_data, path_stats = ComputePath(
            path_name=url_arg_keys["path_name"],
            mode=url_arg_keys["mode"],
            geojson=url_arg_keys["geojson"],
            elevation_mode=url_arg_keys["elevation_mode"],
            is_loop=url_arg_keys["is_loop"],
        ).run()

    except ReduceYouPathArea as _:
        return bad_request("Reduce your path. Overpass api could be angry ;)", 400)

    except EmptyData as _:
        return bad_request("OsmGT empty data", 400)

    output = jsonify(
        {
            "points_path": geojson_points_data,
            "line_path": geojson_line_data,
            "stats_path": path_stats
        }
    )
    output.headers.add('Access-Control-Allow-Origin', '*')
    return output