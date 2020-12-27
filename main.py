
import os

from flask import Flask
from flask import jsonify
from flask import request
from flask import Blueprint
from flask_cors import CORS

from fmp.compute_path import ComputePath
from fmp.compute_path import ReduceYouPathArea

from fmp.find_location import FindLocation
from fmp.find_location import LocationNotFound


def app():

    url_prefix = '/api/v1'
    find_my_path = Blueprint(
        'find_my_path',
        __name__,
        template_folder='templates',
        url_prefix=url_prefix
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
            output = jsonify(
                {
                    "bbox": "Not found"
                }
            )
        # except (ValueError) as err:
        #     err = repr(err)
        #     return bad_request(err, 400)

        output.headers.add('Access-Control-Allow-Origin', '*')
        return output

    @find_my_path.route('/path', methods=['GET'])
    def get_path():

        url_arg_keys = {
            "elevation_mode": request.args.get('elevation_mode', type=str),
            "mode": request.args.get('mode', type=str),
            "geojson": request.args.get('geojson', type=str),
        }

        try:
            geojson_points_data, geojson_line_data, path_stats = ComputePath(
                mode=url_arg_keys["mode"],
                geojson=url_arg_keys["geojson"],
                elevation_mode=url_arg_keys["elevation_mode"],
            ).run()

            output = jsonify(
                {
                    "points_path": geojson_points_data,
                    "line_path": geojson_line_data,
                    "stats_path": path_stats
                }
            )

        except ReduceYouPathArea as _:
            output = jsonify(
                {
                    "points_path": "Reduce your path. Overpass api could be angry ;)"
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
    app.register_blueprint(find_my_path)

    return app


app = app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

# http://127.0.0.1:5000/api/v1/data?geojson=aa