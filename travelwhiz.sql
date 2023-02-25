\echo 'Delete and recreate travelwhiz db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE travelwhiz;
CREATE DATABASE travelwhiz;
\connect travelwhiz

\i travelwhiz-schema.sql

\echo 'Delete and recreate travelwhiz_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE travelwhiz_test;
CREATE DATABASE travelwhiz_test;
\connect travelwhiz_test

\i travelwhiz-schema.sql
