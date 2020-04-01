INSERT INTO _log(message) SELECT concat('Start update "', CURRENT_SCHEMA(), '" database');

UPDATE state SET type ='Associated State' WHERE id IN ('PW', 'FM', 'MH');
