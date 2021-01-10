from osmgt.apis.nominatim import NominatimApi
from osmgt.compoments.core import OsmGtCore


class LocationNotFound(Exception):
    pass


class FindLocation:

    def __init__(self, location_name):

        self._location_name = location_name

    def run(self):
        location_found = NominatimApi(logger=OsmGtCore().logger, q=self._location_name, limit=1).data()
        if len(location_found) >= 1:
            return location_found[0]["boundingbox"]
        else:
            raise LocationNotFound("No location found")
