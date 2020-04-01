CREATE TABLE IF NOT EXISTS _log (
    id TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() PRIMARY KEY,
    message TEXT NOT NULL
);

INSERT INTO _log(message) SELECT concat('Start initialize "', CURRENT_SCHEMA(), '" database');