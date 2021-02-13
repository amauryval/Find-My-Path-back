import pytest

from main.compute_path import ComputePath


def test_pedestrian_path_with_elevation(path_nodes):

    geojson_points_data, geojson_line_data, statistics = ComputePath(
        mode="pedestrian",
        geojson=path_nodes,
        elevation_mode=True,
        path_name="path1",
        is_loop=True
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert set(geojson_points_data["features"][0]["properties"].keys()) == {'height', 'path_name', 'distance', 'position', 'uuid'}
    assert len(geojson_line_data["features"]) > 0
    assert set(geojson_line_data["features"][0]["properties"].keys()) == {'target_node', 'path_name', 'path_position', 'length', 'source_node'}
    assert set(statistics.keys()) == {"height_diff", "height_max", "height_min", "nodes_count", "length"}
    assert sum(statistics.values()) > 0


def test_vehicle_path_with_elevation(path_nodes):

    geojson_points_data, geojson_line_data, statistics = ComputePath(
        mode="vehicle",
        geojson=path_nodes,
        elevation_mode=True,
        path_name="path1",
        is_loop=True
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert set(geojson_points_data["features"][0]["properties"].keys()) == {'height', 'path_name', 'distance', 'position', 'uuid'}
    assert len(geojson_line_data["features"]) > 0
    assert set(geojson_line_data["features"][0]["properties"].keys()) == {'target_node', 'path_name', 'path_position', 'length', 'source_node'}
    assert set(statistics.keys()) == {"height_diff", "height_max", "height_min", "nodes_count", "length"}
    assert sum(statistics.values()) > 0


def test_pedestrian_path_without_elevation(path_nodes):

    geojson_points_data, geojson_line_data, statistics = ComputePath(
        mode="pedestrian",
        geojson=path_nodes,
        elevation_mode=False,
        path_name="path1",
        is_loop=True
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert set(geojson_points_data["features"][0]["properties"].keys()) == {'height', 'path_name', 'distance', 'position', 'uuid'}
    assert len(geojson_line_data["features"]) > 0
    assert set(geojson_line_data["features"][0]["properties"].keys()) == {'target_node', 'path_name', 'path_position', 'length', 'source_node'}
    assert set(statistics.keys()) == {"height_diff", "height_max", "height_min", "nodes_count", "length"}
    assert sum(statistics.values()) > 0


def test_vehicle_path_without_elevation(path_nodes):

    geojson_points_data, geojson_line_data, statistics = ComputePath(
        mode="vehicle",
        geojson=path_nodes,
        elevation_mode=False,
        path_name="path1",
        is_loop=False
    ).run()

    assert len(geojson_points_data["features"]) > 0
    assert set(geojson_points_data["features"][0]["properties"].keys()) == {'height', 'path_name', 'distance', 'position', 'uuid'}
    assert len(geojson_line_data["features"]) > 0
    assert set(geojson_line_data["features"][0]["properties"].keys()) == {'target_node', 'path_name', 'path_position', 'length', 'source_node'}
    assert set(statistics.keys()) == {"height_diff", "height_max", "height_min", "nodes_count", "length"}
    assert statistics.pop("length") > 0
    assert statistics.pop("nodes_count") == 3
    assert sum(statistics.values()) == 0
