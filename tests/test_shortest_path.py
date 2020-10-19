import pytest

from fmp.compute_path import ComputePath


def test_pedestrian_path_with_elevation(path_nodes):

    geojson_points_data, geojson_line_data = ComputePath(
        mode="pedestrian",
        geojson=path_nodes,
        elevation_mode="enabled",
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert len(geojson_line_data["features"]) > 0


def test_vehicle_path_with_elevation(path_nodes):

    geojson_points_data, geojson_line_data = ComputePath(
        mode="vehicle",
        geojson=path_nodes,
        elevation_mode="enabled",
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert len(geojson_line_data["features"]) > 0


def test_pedestrian_path_without_elevation(path_nodes):

    geojson_points_data, geojson_line_data = ComputePath(
        mode="pedestrian",
        geojson=path_nodes,
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert len(geojson_line_data["features"]) > 0


def test_vehicle_path_without_elevation(path_nodes):

    geojson_points_data, geojson_line_data = ComputePath(
        mode="vehicle",
        geojson=path_nodes,
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert len(geojson_line_data["features"]) > 0