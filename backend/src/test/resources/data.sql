INSERT INTO users (UserID, Email, PasswordHash, Nickname, Gender, DateOfBirth, RegistrationDate) VALUES
('user-1', 'user1@example.com', 'salt1$hash1', 'Alpha', 'male', '1990-01-01', '2024-01-01'),
('user-2', 'user2@example.com', 'salt2$hash2', 'Beta', 'female', '1992-02-02', '2024-02-02');

INSERT INTO bodymetrics (UserID, HeightCM, WeightKG, RecordDate) VALUES
('user-1', 175.00, 70.50, '2024-05-01'),
('user-1', 175.00, 71.20, '2024-06-01'),
('user-2', 162.00, 55.30, '2024-06-15');
