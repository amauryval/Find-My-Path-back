import pytest

import json


@pytest.fixture
def path_nodes():
    return json.dumps({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [4.83971357345581144, 45.74988756794578393]
                },
                "properties": {
                    "position": 1
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [4.83988523483276456, 45.74862982269434042]
                },
                "properties": {
                    "position": 2
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [4.84230995178222745, 45.74818062109320493]
                },
                "properties": {
                    "position": 3
                }
            }
        ]
    })
