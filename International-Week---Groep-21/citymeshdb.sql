-- Verwijder de tabellen als ze al bestaan
DROP TABLE IF EXISTS drones, users, stations, notificaties, reservaties, verslagen CASCADE;
DROP TYPE IF EXISTS reservatie_status cascade;

-- Maak de tabel 'stations' aan
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    naam VARCHAR(100) UNIQUE,
    straatnaam VARCHAR(100),
    huisnummer VARCHAR(10),
    postcode VARCHAR(10),
    provincie VARCHAR(50),
    beschikbare_plaatsen INT DEFAULT 0,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6)
);

-- Maak de tabel 'drones' aan
CREATE TABLE drones (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    naam VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('beschikbaar', 'bezet', 'defect'))
);

-- Maak de tabel 'users' aan
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    voornaam VARCHAR(50),
    familienaam VARCHAR(50),
    emailadres VARCHAR(100) UNIQUE NOT NULL,
    wachtwoord TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'piloot', 'mechanieker'))
);




CREATE TABLE notificaties (
    id SERIAL PRIMARY KEY,
    gebruiker_id INTEGER REFERENCES users(id),
    boodschap TEXT NOT NULL,
    gelezen BOOLEAN DEFAULT FALSE,
    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Eerst maak je het enum type aan
CREATE TYPE reservatie_status AS ENUM ('pending', 'accepted', 'rejected');

-- Dan gebruik je het in je tabel
CREATE TABLE reservaties (
    id SERIAL PRIMARY KEY,
    drone_id INTEGER REFERENCES drones(id),
    gebruiker_id INTEGER REFERENCES users(id),
    status reservatie_status DEFAULT 'pending',
    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE verslagen (
    id SERIAL PRIMARY KEY,
    gebruiker_id INTEGER REFERENCES users(id),
    titel TEXT NOT NULL,
    inhoud TEXT NOT NULL,
    aangemaakt_op TIMESTAMP DEFAULT NOW()
);


-- Triggerfunctie om de kolom 'beschikbare_plaatsen' bij te werken
CREATE OR REPLACE FUNCTION update_beschikbare_plaatsen() 
RETURNS TRIGGER AS $$
BEGIN
    -- Werk de 'beschikbare_plaatsen' bij door het aantal drones te tellen per station
    UPDATE stations 
    SET beschikbare_plaatsen = (SELECT COUNT(*) FROM drones WHERE station_id = NEW.station_id)
    WHERE id = NEW.station_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger bij het toevoegen van een nieuwe drone
CREATE TRIGGER after_insert_drones
AFTER INSERT ON drones
FOR EACH ROW
EXECUTE FUNCTION update_beschikbare_plaatsen();

-- Trigger bij het verwijderen van een drone
CREATE TRIGGER after_delete_drones
AFTER DELETE ON drones
FOR EACH ROW
EXECUTE FUNCTION update_beschikbare_plaatsen();




-- Voeg stations toe
INSERT INTO stations (naam, straatnaam, huisnummer, postcode, provincie, beschikbare_plaatsen, latitude, longitude) VALUES
('Station Antwerpen', 'Meir', '25', '2000', 'Antwerpen', 0, 51.2199, 4.4035),
('Station Vlaams-Brabant', 'Bondgenotenlaan', '15', '3000', 'Vlaams-Brabant', 0, 50.8798, 4.7005),
('Station Limburg', 'Diesterstraat', '7', '3500', 'Limburg', 0, 50.9307, 5.3371),
('Station Oost-Vlaanderen', 'Veldstraat', '12', '9000', 'Oost-Vlaanderen', 0, 51.0535, 3.7304),
('Station West-Vlaanderen', 'Zuidzandstraat', '9', '8000', 'West-Vlaanderen', 0, 51.2089, 3.2247),
('Station Henegouwen', 'Rue de Nimy', '38', '7000', 'Henegouwen', 0, 50.4542, 3.9523),
('Station Waals-Brabant', 'Chaussée de Louvain', '102', '1300', 'Waals-Brabant', 0, 50.6833, 4.6139),
('Station Luik', 'Rue Vinâve d''Île', '45', '4000', 'Luik', 0, 50.6403, 5.5718),
('Station Namen', 'Rue de Fer', '17', '5000', 'Namen', 0, 50.4674, 4.8718),
('Station Luxemburg', 'Rue de Neufchâteau', '20', '6700', 'Luxemburg', 0, 49.8460, 5.3843),
('Station Brussel', 'Nieuwstraat', '50', '1000', 'Brussel', 0, 50.8503, 4.3517);




-- Voeg drones toe (10 per station)
-- Station 1 (Antwerpen)
INSERT INTO drones (station_id, naam, status) VALUES
(1, 'Drone-ANT-1', 'beschikbaar'),
(1, 'Drone-ANT-2', 'bezet'),
(1, 'Drone-ANT-3', 'defect'),
(1, 'Drone-ANT-4', 'beschikbaar'),
(1, 'Drone-ANT-5', 'beschikbaar'),
(1, 'Drone-ANT-6', 'defect'),
(1, 'Drone-ANT-7', 'bezet'),
(1, 'Drone-ANT-8', 'beschikbaar'),
(1, 'Drone-ANT-9', 'beschikbaar'),
(1, 'Drone-ANT-10', 'defect'),

-- Station 2 (Vlaams-Brabant)
(2, 'Drone-VB-1', 'beschikbaar'),
(2, 'Drone-VB-2', 'bezet'),
(2, 'Drone-VB-3', 'beschikbaar'),
(2, 'Drone-VB-4', 'defect'),
(2, 'Drone-VB-5', 'beschikbaar'),
(2, 'Drone-VB-6', 'bezet'),
(2, 'Drone-VB-7', 'defect'),
(2, 'Drone-VB-8', 'beschikbaar'),
(2, 'Drone-VB-9', 'beschikbaar'),
(2, 'Drone-VB-10', 'bezet'),

-- Station 3 (Limburg)
(3, 'Drone-LIM-1', 'beschikbaar'),
(3, 'Drone-LIM-2', 'bezet'),
(3, 'Drone-LIM-3', 'beschikbaar'),
(3, 'Drone-LIM-4', 'defect'),
(3, 'Drone-LIM-5', 'beschikbaar'),
(3, 'Drone-LIM-6', 'defect'),
(3, 'Drone-LIM-7', 'beschikbaar'),
(3, 'Drone-LIM-8', 'bezet'),
(3, 'Drone-LIM-9', 'beschikbaar'),
(3, 'Drone-LIM-10', 'bezet'),

-- Station 4 (Oost-Vlaanderen)
(4, 'Drone-OV-1', 'beschikbaar'),
(4, 'Drone-OV-2', 'defect'),
(4, 'Drone-OV-3', 'bezet'),
(4, 'Drone-OV-4', 'beschikbaar'),
(4, 'Drone-OV-5', 'beschikbaar'),
(4, 'Drone-OV-6', 'defect'),
(4, 'Drone-OV-7', 'bezet'),
(4, 'Drone-OV-8', 'beschikbaar'),
(4, 'Drone-OV-9', 'bezet'),
(4, 'Drone-OV-10', 'beschikbaar'),

-- Station 5 (West-Vlaanderen)
(5, 'Drone-WV-1', 'beschikbaar'),
(5, 'Drone-WV-2', 'bezet'),
(5, 'Drone-WV-3', 'beschikbaar'),
(5, 'Drone-WV-4', 'defect'),
(5, 'Drone-WV-5', 'bezet'),
(5, 'Drone-WV-6', 'defect'),
(5, 'Drone-WV-7', 'beschikbaar'),
(5, 'Drone-WV-8', 'beschikbaar'),
(5, 'Drone-WV-9', 'bezet'),
(5, 'Drone-WV-10', 'beschikbaar'),

-- Station 6 (Henegouwen)
(6, 'Drone-HEN-1', 'beschikbaar'),
(6, 'Drone-HEN-2', 'defect'),
(6, 'Drone-HEN-3', 'bezet'),
(6, 'Drone-HEN-4', 'beschikbaar'),
(6, 'Drone-HEN-5', 'defect'),
(6, 'Drone-HEN-6', 'beschikbaar'),
(6, 'Drone-HEN-7', 'bezet'),
(6, 'Drone-HEN-8', 'beschikbaar'),
(6, 'Drone-HEN-9', 'bezet'),
(6, 'Drone-HEN-10', 'beschikbaar'),

-- Station 7 (Waals-Brabant)
(7, 'Drone-WB-1', 'beschikbaar'),
(7, 'Drone-WB-2', 'bezet'),
(7, 'Drone-WB-3', 'defect'),
(7, 'Drone-WB-4', 'beschikbaar'),
(7, 'Drone-WB-5', 'bezet'),
(7, 'Drone-WB-6', 'beschikbaar'),
(7, 'Drone-WB-7', 'defect'),
(7, 'Drone-WB-8', 'bezet'),
(7, 'Drone-WB-9', 'beschikbaar'),
(7, 'Drone-WB-10', 'beschikbaar'),

-- Station 8 (Luik)
(8, 'Drone-LUIK-1', 'beschikbaar'),
(8, 'Drone-LUIK-2', 'bezet'),
(8, 'Drone-LUIK-3', 'defect'),
(8, 'Drone-LUIK-4', 'beschikbaar'),
(8, 'Drone-LUIK-5', 'beschikbaar'),
(8, 'Drone-LUIK-6', 'defect'),
(8, 'Drone-LUIK-7', 'bezet'),
(8, 'Drone-LUIK-8', 'beschikbaar'),
(8, 'Drone-LUIK-9', 'bezet'),
(8, 'Drone-LUIK-10', 'defect'),

-- Station 9 (Namen)
(9, 'Drone-NAM-1', 'beschikbaar'),
(9, 'Drone-NAM-2', 'bezet'),
(9, 'Drone-NAM-3', 'defect'),
(9, 'Drone-NAM-4', 'beschikbaar'),
(9, 'Drone-NAM-5', 'bezet'),
(9, 'Drone-NAM-6', 'defect'),
(9, 'Drone-NAM-7', 'beschikbaar'),
(9, 'Drone-NAM-8', 'bezet'),
(9, 'Drone-NAM-9', 'beschikbaar'),
(9, 'Drone-NAM-10', 'bezet'),

-- Station 10 (Luxemburg)
(10, 'Drone-LUX-1', 'beschikbaar'),
(10, 'Drone-LUX-2', 'bezet'),
(10, 'Drone-LUX-3', 'defect'),
(10, 'Drone-LUX-4', 'beschikbaar'),
(10, 'Drone-LUX-5', 'bezet'),
(10, 'Drone-LUX-6', 'defect'),
(10, 'Drone-LUX-7', 'beschikbaar'),
(10, 'Drone-LUX-8', 'bezet'),
(10, 'Drone-LUX-9', 'beschikbaar'),
(10, 'Drone-LUX-10', 'defect'),

-- Station 11 (Brussel)
(11, 'Drone-BXL-1', 'beschikbaar'),
(11, 'Drone-BXL-2', 'bezet'),
(11, 'Drone-BXL-3', 'defect'),
(11, 'Drone-BXL-4', 'beschikbaar'),
(11, 'Drone-BXL-5', 'beschikbaar'),
(11, 'Drone-BXL-6', 'defect'),
(11, 'Drone-BXL-7', 'bezet'),
(11, 'Drone-BXL-8', 'beschikbaar'),
(11, 'Drone-BXL-9', 'beschikbaar'),
(11, 'Drone-BXL-10', 'defect');



-- Voeg gebruikers toe
-- 1 admin
INSERT INTO users (voornaam, familienaam, emailadres, wachtwoord, rol) VALUES
('Admin', 'Flexso', 'admin@flexso.com', 'hashed_wachtwoord_admin', 'admin');

-- 10 piloten
INSERT INTO users (voornaam, familienaam, emailadres, wachtwoord, rol) VALUES
('Piloot1', 'Jansen', 'piloot1@flexso.com', 'hashed_pw1', 'piloot'),
('Piloot2', 'Peeters', 'piloot2@flexso.com', 'hashed_pw2', 'piloot'),
('Piloot3', 'Vermeulen', 'piloot3@flexso.com', 'hashed_pw3', 'piloot'),
('Piloot4', 'Van Dijk', 'piloot4@flexso.com', 'hashed_pw4', 'piloot'),
('Piloot5', 'Declerck', 'piloot5@flexso.com', 'hashed_pw5', 'piloot'),
('Piloot6', 'Maes', 'piloot6@flexso.com', 'hashed_pw6', 'piloot'),
('Piloot7', 'Goossens', 'piloot7@flexso.com', 'hashed_pw7', 'piloot'),
('Piloot8', 'Wouters', 'piloot8@flexso.com', 'hashed_pw8', 'piloot'),
('Piloot9', 'De Smet', 'piloot9@flexso.com', 'hashed_pw9', 'piloot'),
('Piloot10', 'Aerts', 'piloot10@flexso.com', 'hashed_pw10', 'piloot');

-- 5 mechaniekers
INSERT INTO users (voornaam, familienaam, emailadres, wachtwoord, rol) VALUES
('Mek1', 'Jacobs', 'mek1@flexso.com', 'hashed_mek1', 'mechanieker'),
('Mek2', 'Lemmens', 'mek2@flexso.com', 'hashed_mek2', 'mechanieker'),
('Mek3', 'Bogaert', 'mek3@flexso.com', 'hashed_mek3', 'mechanieker'),
('Mek4', 'Van den Bossche', 'mek4@flexso.com', 'hashed_mek4', 'mechanieker'),
('Mek5', 'Desmet', 'mek5@flexso.com', 'hashed_mek5', 'mechanieker');
