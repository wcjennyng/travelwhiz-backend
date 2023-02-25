CREATE TABLE users (
  username VARCHAR(100) PRIMARY KEY,
  password VARCHAR(100) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE pins (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  review TEXT NOT NULL,
  rating VARCHAR(100),
  long NUMERIC,
  lat NUMERIC,
  date VARCHAR(100),
  username VARCHAR(100)
    REFERENCES users ON DELETE CASCADE
);

CREATE TABLE favorites (
  username VARCHAR(100)
    REFERENCES users ON DELETE CASCADE,
  pin_id INTEGER
    REFERENCES pins ON DELETE CASCADE,
  PRIMARY KEY (username, pin_id)
)