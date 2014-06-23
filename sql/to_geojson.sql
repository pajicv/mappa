CREATE TABLE test_utm AS
SELECT * FROM padej_parcele_utm WHERE id < 100

INSERT INTO geojson (name, json)

SELECT 'test_utm', row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features 
		FROM (SELECT 'Feature' As type , ST_AsGeoJSON(c.geom)::json As geometry , row_to_json((SELECT a FROM (SELECT id) As a
		)) As properties FROM test_utm As c  ) As f )  As fc;

DELETE FROM geojson WHERE name='statep010'

SELECT json FROM geojson WHERE name='us_border'

SELECT row_to_json(c) FROM countries c WHERE c.name LIKE 'A%'