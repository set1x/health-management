DROP TABLE IF EXISTS bodymetrics;
CREATE TABLE bodymetrics (
    BodyMetricID INTEGER PRIMARY KEY AUTO_INCREMENT,
    UserID VARCHAR(64) NOT NULL,
    HeightCM DECIMAL(5,2) NOT NULL,
    WeightKG DECIMAL(5,2) NOT NULL,
    RecordDate DATE NOT NULL
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    UserID VARCHAR(64) PRIMARY KEY,
    Email VARCHAR(128) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Nickname VARCHAR(64),
    Gender VARCHAR(16),
    DateOfBirth DATE,
    RegistrationDate DATE
);
