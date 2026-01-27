-- Add migration script here

ALTER TABLE muscles
    ADD COLUMN scientific_name VARCHAR(255),
    ADD COLUMN major_group VARCHAR(255),
    ADD COLUMN minor_group VARCHAR(255) NOT NULL;

DROP TABLE muscle_bodypart_relations;
DROP TABLE body_parts;
