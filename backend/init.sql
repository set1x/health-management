-- Schema definition for health_management_db (MySQL 9)

DROP TABLE IF EXISTS `bodymetrics`;
DROP TABLE IF EXISTS `dietitem`;
DROP TABLE IF EXISTS `exerciseitem`;
DROP TABLE IF EXISTS `sleepitem`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `UserID` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PasswordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Gender` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `RegistrationDate` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UQ_Users_Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bodymetrics` (
  `BodyMetricID` int NOT NULL AUTO_INCREMENT,
  `UserID` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HeightCM` decimal(5,2) NOT NULL,
  `WeightKG` decimal(5,2) NOT NULL,
  `RecordDate` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`BodyMetricID`),
  UNIQUE KEY `UQ_BodyMetrics_User_RecordDate` (`UserID`, `RecordDate`),
  KEY `IDX_BodyMetrics_User_Date` (`UserID`, `RecordDate`),
  CONSTRAINT `FK_BodyMetrics_User` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dietitem` (
  `DietItemID` int NOT NULL AUTO_INCREMENT,
  `UserID` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecordDate` date NOT NULL,
  `FoodName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MealType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `EstimatedCalories` int DEFAULT NULL,
  PRIMARY KEY (`DietItemID`),
  KEY `IDX_DietItem_User_Date` (`UserID`, `RecordDate`),
  CONSTRAINT `FK_DietItem_User` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exerciseitem` (
  `ExerciseItemID` int NOT NULL AUTO_INCREMENT,
  `UserID` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecordDate` date NOT NULL,
  `ExerciseType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DurationMinutes` int NOT NULL,
  `EstimatedCaloriesBurned` int DEFAULT NULL,
  PRIMARY KEY (`ExerciseItemID`),
  KEY `IDX_ExerciseItem_User_Date` (`UserID`, `RecordDate`),
  CONSTRAINT `FK_ExerciseItem_User` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sleepitem` (
  `SleepItemID` int NOT NULL AUTO_INCREMENT,
  `UserID` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecordDate` date NOT NULL,
  `BedTime` datetime DEFAULT NULL,
  `WakeTime` datetime DEFAULT NULL,
  PRIMARY KEY (`SleepItemID`),
  KEY `IDX_SleepItem_User_Date` (`UserID`, `RecordDate`),
  CONSTRAINT `FK_SleepItem_User` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of schema definition
