-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 06, 2026 at 02:16 PM
-- Server version: 8.0.30
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nstp_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` bigint UNSIGNED NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`id`, `academic_year`, `semester`, `start_date`, `end_date`, `is_current`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '2024-2025', '1st', '2024-06-01', '2024-10-31', 0, 1, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(2, '2024-2025', '2nd', '2024-11-01', '2025-03-31', 0, 1, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(3, '2025-2026', '1st', '2025-06-01', '2025-10-31', 1, 1, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(4, '2025-2026', '2nd', '2025-11-01', '2026-03-31', 0, 1, '2026-09-02 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `component_type` enum('cwts','rotc','lts','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `geofence_radius` int NOT NULL DEFAULT '100',
  `training_hours` int NOT NULL DEFAULT '0',
  `max_participants` int DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `created_by` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `title`, `description`, `component_type`, `start_datetime`, `end_datetime`, `venue`, `latitude`, `longitude`, `geofence_radius`, `training_hours`, `max_participants`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'CWTS Community Cleanup Drive', 'Community cleanup and environmental awareness campaign for CWTS students. Join us in making our community cleaner and greener.', 'cwts', '2026-09-07 08:00:00', '2026-09-07 17:00:00', 'Barangay Hall, Manila', NULL, NULL, 100, 8, 50, 'upcoming', 3, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(2, 'ROTC Basic Military Training', 'Basic military training for ROTC students. Learn discipline, leadership, and military skills.', 'rotc', '2026-09-12 06:00:00', '2026-09-12 18:00:00', 'Camp Aguinaldo, QC', NULL, NULL, 100, 10, 40, 'upcoming', 4, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(3, 'LTS Literacy Program', 'Literacy training for community children by LTS students. Help children learn to read and write.', 'lts', '2026-09-05 09:00:00', '2026-09-05 16:00:00', 'Community Learning Center', NULL, NULL, 100, 6, 30, 'upcoming', 5, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(4, 'All-Component General Assembly', 'General assembly for all NSTP components. Important announcements and updates for the semester.', 'all', '2026-09-09 10:00:00', '2026-09-09 12:00:00', 'University Auditorium', NULL, NULL, 100, 2, 100, 'upcoming', 2, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(5, 'CWTS Medical Mission', 'Medical mission for underserved communities. CWTS students will assist in medical outreach.', 'cwts', '2026-09-17 07:00:00', '2026-09-17 18:00:00', 'Barangay Health Center', NULL, NULL, 100, 10, 45, 'upcoming', 3, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(6, 'ROTC Field Training Exercise', 'Field training exercise for ROTC students. Practical application of military skills.', 'rotc', '2026-09-22 05:00:00', '2026-09-22 20:00:00', 'Training Grounds, Rizal', NULL, NULL, 100, 12, 35, 'upcoming', 4, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(7, 'testing', '123', 'all', '2026-09-03 15:18:00', '2026-09-04 15:17:00', NULL, 8.52182608, 124.57249492, 100, 1, 0, 'upcoming', 1, '2026-09-03 07:18:11', '2026-09-03 07:18:11');

-- --------------------------------------------------------

--
-- Table structure for table `activity_feedback`
--

CREATE TABLE `activity_feedback` (
  `id` bigint UNSIGNED NOT NULL,
  `activity_id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `rating` int UNSIGNED NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `suggestions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_participations`
--

CREATE TABLE `activity_participations` (
  `id` bigint UNSIGNED NOT NULL,
  `activity_id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `attendance_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_verification',
  `hours_earned` int NOT NULL DEFAULT '0',
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `attended_at` timestamp NULL DEFAULT NULL,
  `check_in_at` timestamp NULL DEFAULT NULL,
  `checkin_latitude` decimal(10,8) DEFAULT NULL,
  `checkin_longitude` decimal(11,8) DEFAULT NULL,
  `is_within_geofence` tinyint(1) NOT NULL DEFAULT '0',
  `distance_from_venue` decimal(10,2) DEFAULT NULL,
  `is_tracking_location` tinyint(1) NOT NULL DEFAULT '0',
  `tracking_started_at` timestamp NULL DEFAULT NULL,
  `tracking_ended_at` timestamp NULL DEFAULT NULL,
  `face_image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_participations`
--

INSERT INTO `activity_participations` (`id`, `activity_id`, `student_id`, `attendance_status`, `hours_earned`, `feedback`, `attended_at`, `check_in_at`, `checkin_latitude`, `checkin_longitude`, `is_within_geofence`, `distance_from_venue`, `is_tracking_location`, `tracking_started_at`, `tracking_ended_at`, `face_image_path`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(1, 5, 7, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(2, 1, 8, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(3, 3, 8, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(4, 4, 8, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(5, 5, 9, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(6, 1, 12, 'present', 8, NULL, '2026-09-02 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(7, 3, 12, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(8, 6, 12, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(9, 5, 13, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(10, 6, 14, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(11, 4, 15, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(12, 4, 18, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(13, 2, 19, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(14, 4, 19, 'present', 2, NULL, '2026-09-01 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(15, 6, 20, 'present', 12, NULL, '2026-08-28 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(16, 1, 21, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(17, 2, 21, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(18, 1, 23, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(19, 5, 23, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(20, 1, 24, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(21, 4, 24, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(22, 5, 24, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(23, 1, 25, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(24, 2, 25, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(25, 5, 25, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(26, 1, 27, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(27, 5, 27, 'present', 10, NULL, '2026-09-01 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(28, 2, 28, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(29, 5, 28, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(30, 6, 28, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(31, 5, 29, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(32, 3, 30, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(33, 1, 31, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(34, 2, 32, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(35, 5, 33, 'present', 10, NULL, '2026-08-30 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(36, 6, 33, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(37, 4, 34, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(38, 6, 34, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(39, 1, 36, 'present', 8, NULL, '2026-08-31 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(40, 4, 36, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(41, 5, 36, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(42, 1, 40, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(43, 1, 41, 'present', 8, NULL, '2026-08-31 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(44, 3, 41, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(45, 1, 42, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(46, 4, 42, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(47, 5, 42, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(48, 5, 43, 'present', 10, NULL, '2026-08-31 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(49, 1, 44, 'present', 8, NULL, '2026-08-29 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(50, 3, 44, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(51, 6, 44, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(52, 6, 45, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(53, 1, 46, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(54, 6, 46, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(55, 2, 47, 'present', 10, NULL, '2026-08-31 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(56, 4, 47, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(57, 6, 47, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(58, 1, 48, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(59, 3, 48, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(60, 4, 48, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(61, 1, 49, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(62, 3, 49, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(63, 4, 49, 'present', 2, NULL, '2026-09-02 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(64, 4, 50, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(65, 1, 51, 'present', 8, NULL, '2026-09-01 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(66, 4, 51, 'present', 2, NULL, '2026-09-02 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(67, 4, 52, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(68, 5, 52, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(69, 6, 52, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(70, 2, 53, 'registered', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(71, 3, 53, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(72, 5, 53, 'present', 10, NULL, '2026-08-31 09:12:36', NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(73, 1, 54, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(74, 3, 54, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(75, 1, 55, 'excused', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(76, 5, 55, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(77, 6, 55, 'absent', 0, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `activity_registrations`
--

CREATE TABLE `activity_registrations` (
  `id` bigint UNSIGNED NOT NULL,
  `activity_id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `registration_date` datetime NOT NULL,
  `status` enum('pending','confirmed','cancelled','waitlisted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_action_logs`
--

CREATE TABLE `admin_action_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `admin_id` bigint UNSIGNED NOT NULL,
  `action_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` bigint UNSIGNED DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `session_id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `check_in_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('present','late','absent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  `face_confidence` double DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `minutes_late` int DEFAULT '0',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`id`, `session_id`, `student_id`, `check_in_at`, `status`, `face_confidence`, `location_lat`, `location_lng`, `minutes_late`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 4, 7, '2026-08-31 01:03:00', 'present', 0.96, 14.60400000, 120.97710000, 0, NULL, '2026-08-31 01:03:00', '2026-08-31 01:03:00'),
(2, 4, 14, '2026-08-31 01:04:00', 'present', 0.99, 14.59250000, 120.98120000, 0, NULL, '2026-08-31 01:04:00', '2026-08-31 01:04:00'),
(3, 4, 16, '2026-08-31 01:10:00', 'present', 0.9, 14.59200000, 120.99040000, 0, NULL, '2026-08-31 01:10:00', '2026-08-31 01:10:00'),
(4, 4, 24, '2026-08-31 01:01:00', 'present', 0.89, 14.59610000, 120.98230000, 0, NULL, '2026-08-31 01:01:00', '2026-08-31 01:01:00'),
(5, 4, 26, '2026-08-31 01:09:00', 'present', 0.93, 14.60060000, 120.98720000, 0, NULL, '2026-08-31 01:09:00', '2026-08-31 01:09:00'),
(6, 4, 27, '2026-08-31 01:12:00', 'present', 0.88, 14.59170000, 120.98610000, 0, NULL, '2026-08-31 01:12:00', '2026-08-31 01:12:00'),
(7, 4, 28, '2026-08-31 01:10:00', 'present', 0.95, 14.58980000, 120.99110000, 0, NULL, '2026-08-31 01:10:00', '2026-08-31 01:10:00'),
(8, 4, 31, '2026-08-31 01:04:00', 'present', 0.91, 14.60870000, 120.98400000, 0, NULL, '2026-08-31 01:04:00', '2026-08-31 01:04:00'),
(9, 4, 32, '2026-08-31 01:15:00', 'present', 0.88, 14.60720000, 120.97880000, 0, NULL, '2026-08-31 01:15:00', '2026-08-31 01:15:00'),
(10, 4, 34, '2026-08-31 01:08:00', 'present', 0.9, 14.59610000, 120.98330000, 0, NULL, '2026-08-31 01:08:00', '2026-08-31 01:08:00'),
(11, 4, 36, '2026-08-31 01:00:00', 'present', 0.97, 14.60080000, 120.98010000, 0, NULL, '2026-08-31 01:00:00', '2026-08-31 01:00:00'),
(12, 4, 39, '2026-08-31 01:00:00', 'present', 0.93, 14.60370000, 120.97820000, 0, NULL, '2026-08-31 01:00:00', '2026-08-31 01:00:00'),
(13, 4, 40, '2026-08-31 01:07:00', 'present', 0.92, 14.60140000, 120.97450000, 0, NULL, '2026-08-31 01:07:00', '2026-08-31 01:07:00'),
(14, 4, 41, '2026-08-31 01:17:00', 'late', 0.97, 14.60250000, 120.99280000, 14, 'Late by 14 minutes', '2026-08-31 01:17:00', '2026-08-31 01:17:00'),
(15, 4, 44, '2026-08-31 01:01:00', 'present', 0.98, 14.59110000, 120.98010000, 0, NULL, '2026-08-31 01:01:00', '2026-08-31 01:01:00'),
(16, 4, 45, '2026-08-31 01:09:00', 'present', 0.98, 14.60290000, 120.98170000, 0, NULL, '2026-08-31 01:09:00', '2026-08-31 01:09:00'),
(17, 4, 50, '2026-08-31 01:05:00', 'present', 0.88, 14.59720000, 120.99280000, 0, NULL, '2026-08-31 01:05:00', '2026-08-31 01:05:00'),
(18, 4, 53, '2026-08-31 01:08:00', 'present', 0.97, 14.60080000, 120.98720000, 0, NULL, '2026-08-31 01:08:00', '2026-08-31 01:08:00'),
(19, 4, 54, '2026-08-31 01:12:00', 'present', 0.96, 14.59730000, 120.98210000, 0, NULL, '2026-08-31 01:12:00', '2026-08-31 01:12:00'),
(20, 5, 9, '2026-08-30 00:02:00', 'present', 0.85, 14.59180000, 120.98180000, 0, NULL, '2026-08-30 00:02:00', '2026-08-30 00:02:00'),
(21, 5, 13, '2026-08-30 00:09:00', 'present', 0.95, 14.59040000, 120.98710000, 0, NULL, '2026-08-30 00:09:00', '2026-08-30 00:09:00'),
(22, 5, 16, '2026-08-30 00:31:00', 'late', 0.94, 14.60640000, 120.98110000, 29, 'Late by 29 minutes', '2026-08-30 00:31:00', '2026-08-30 00:31:00'),
(23, 5, 17, '2026-08-30 00:08:00', 'present', 0.89, 14.59100000, 120.98680000, 0, NULL, '2026-08-30 00:08:00', '2026-08-30 00:08:00'),
(24, 5, 18, '2026-08-30 00:01:00', 'present', 0.91, 14.60610000, 120.97860000, 0, NULL, '2026-08-30 00:01:00', '2026-08-30 00:01:00'),
(25, 5, 19, '2026-08-30 00:00:00', 'present', 0.91, 14.60100000, 120.98190000, 0, NULL, '2026-08-30 00:00:00', '2026-08-30 00:00:00'),
(26, 5, 26, '2026-08-30 00:12:00', 'present', 0.86, 14.60640000, 120.97950000, 0, NULL, '2026-08-30 00:12:00', '2026-08-30 00:12:00'),
(27, 5, 28, '2026-08-30 00:06:00', 'present', 0.95, 14.60600000, 120.97840000, 0, NULL, '2026-08-30 00:06:00', '2026-08-30 00:06:00'),
(28, 5, 32, '2026-08-30 00:14:00', 'present', 0.99, 14.60300000, 120.97550000, 0, NULL, '2026-08-30 00:14:00', '2026-08-30 00:14:00'),
(29, 5, 43, '2026-08-30 00:07:00', 'present', 0.86, 14.59250000, 120.98720000, 0, NULL, '2026-08-30 00:07:00', '2026-08-30 00:07:00'),
(30, 5, 46, '2026-08-30 00:14:00', 'present', 0.94, 14.60640000, 120.99190000, 0, NULL, '2026-08-30 00:14:00', '2026-08-30 00:14:00'),
(31, 5, 49, '2026-08-30 00:13:00', 'present', 0.94, 14.59690000, 120.99180000, 0, NULL, '2026-08-30 00:13:00', '2026-08-30 00:13:00'),
(32, 6, 10, '2026-08-29 01:07:00', 'present', 0.9, 14.60850000, 120.99280000, 0, NULL, '2026-08-29 01:07:00', '2026-08-29 01:07:00'),
(33, 6, 22, '2026-08-29 01:00:00', 'present', 0.98, 14.59710000, 120.98080000, 0, NULL, '2026-08-29 01:00:00', '2026-08-29 01:00:00'),
(34, 6, 25, '2026-08-29 01:14:00', 'present', 0.87, 14.60300000, 120.98360000, 0, NULL, '2026-08-29 01:14:00', '2026-08-29 01:14:00'),
(35, 6, 26, '2026-08-29 01:06:00', 'present', 0.96, 14.60100000, 120.99200000, 0, NULL, '2026-08-29 01:06:00', '2026-08-29 01:06:00'),
(36, 6, 28, '2026-08-29 01:19:00', 'late', 0.86, 14.59680000, 120.97640000, 9, 'Late by 9 minutes', '2026-08-29 01:19:00', '2026-08-29 01:19:00'),
(37, 6, 29, '2026-08-29 01:12:00', 'present', 0.92, 14.60220000, 120.99330000, 0, NULL, '2026-08-29 01:12:00', '2026-08-29 01:12:00'),
(38, 6, 34, '2026-08-29 01:19:00', 'late', 0.91, 14.60600000, 120.98980000, 5, 'Late by 5 minutes', '2026-08-29 01:19:00', '2026-08-29 01:19:00'),
(39, 6, 37, '2026-08-29 01:21:00', 'late', 0.85, 14.59340000, 120.98730000, 17, 'Late by 17 minutes', '2026-08-29 01:21:00', '2026-08-29 01:21:00'),
(40, 6, 38, '2026-08-29 01:20:00', 'late', 0.9, 14.59330000, 120.97440000, 23, 'Late by 23 minutes', '2026-08-29 01:20:00', '2026-08-29 01:20:00'),
(41, 6, 53, '2026-08-29 01:12:00', 'present', 0.9, 14.60380000, 120.97600000, 0, NULL, '2026-08-29 01:12:00', '2026-08-29 01:12:00');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_sessions`
--

CREATE TABLE `attendance_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `faculty_id` bigint UNSIGNED DEFAULT NULL,
  `component` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `scheduled_start` timestamp NULL DEFAULT NULL,
  `scheduled_end` timestamp NULL DEFAULT NULL,
  `grace_period_minutes` int NOT NULL DEFAULT '15',
  `is_scheduled` tinyint(1) NOT NULL DEFAULT '0',
  `session_time` time DEFAULT NULL,
  `day_of_week` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `require_location` tinyint(1) NOT NULL DEFAULT '0',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `geofence_radius` int NOT NULL DEFAULT '100',
  `status` enum('active','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_sessions`
--

INSERT INTO `attendance_sessions` (`id`, `faculty_id`, `component`, `course`, `section`, `start_time`, `end_time`, `scheduled_start`, `scheduled_end`, `grace_period_minutes`, `is_scheduled`, `session_time`, `day_of_week`, `require_location`, `latitude`, `longitude`, `geofence_radius`, `status`, `description`, `created_at`, `updated_at`) VALUES
(1, 3, 'cwts', 'BSIT', 'A', '2026-09-03 01:00:00', '2026-09-03 04:00:00', '2026-09-03 01:00:00', '2026-09-03 04:00:00', 15, 1, NULL, NULL, 0, NULL, NULL, 100, 'active', 'CWTS Morning Session - Week 1', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(2, 4, 'rotc', 'BEED', 'B', '2026-09-04 00:00:00', '2026-09-04 03:00:00', '2026-09-04 00:00:00', '2026-09-04 03:00:00', 15, 1, NULL, NULL, 0, NULL, NULL, 100, 'active', 'ROTC Training Session - Basic Drills', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(3, 5, 'lts', 'BSFM', 'C', '2026-09-05 01:00:00', '2026-09-05 04:00:00', '2026-09-05 01:00:00', '2026-09-05 04:00:00', 15, 1, NULL, NULL, 0, NULL, NULL, 100, 'active', 'LTS Literacy Session - Reading Program', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(4, 3, 'cwts', 'BSIT', 'A', '2026-08-31 01:00:00', '2026-08-31 04:00:00', '2026-08-31 01:00:00', '2026-08-31 04:00:00', 15, 1, NULL, NULL, 0, NULL, NULL, 100, 'closed', 'CWTS Morning Session - Week 1 (Past)', '2026-08-28 09:12:36', '2026-08-31 09:12:36'),
(5, 4, 'rotc', 'BEED', 'B', '2026-08-30 00:00:00', '2026-08-30 03:00:00', '2026-08-30 00:00:00', '2026-08-30 03:00:00', 15, 1, NULL, NULL, 0, NULL, NULL, 100, 'closed', 'ROTC Training Session - Basic Drills (Past)', '2026-08-27 09:12:36', '2026-08-30 09:12:36'),
(6, 5, 'lts', 'BSFM', 'C', '2026-08-29 01:00:00', '2026-08-29 04:00:00', '2026-08-29 01:00:00', '2026-08-29 04:00:00', 15, 1, NULL, NULL, 0, NULL, NULL, 100, 'closed', 'LTS Literacy Session - Reading Program (Past)', '2026-08-26 09:12:36', '2026-08-29 09:12:36'),
(7, 3, 'cwts', 'BSA', 'A', '2026-09-03 01:27:00', '2026-09-04 03:12:00', '2026-09-03 01:27:00', '2026-09-04 03:12:00', 15, 1, NULL, NULL, 1, 8.52174347, 124.57239539, 100, 'active', NULL, '2026-09-02 09:13:14', '2026-09-02 09:13:14'),
(8, 3, 'cwts', 'BSPsych', 'A', '2026-09-02 09:15:00', '2026-09-03 03:13:00', '2026-09-02 09:15:00', '2026-09-03 03:13:00', 15, 1, NULL, NULL, 1, 8.52159492, 124.57237395, 100, 'active', NULL, '2026-09-02 09:14:29', '2026-09-02 09:14:29'),
(9, 3, 'cwts', 'BSPsych', 'A', '2026-09-02 09:21:00', '2026-09-03 03:15:00', '2026-09-02 09:21:00', '2026-09-03 03:15:00', 15, 1, NULL, NULL, 1, 8.52182608, 124.57249492, 100, 'active', NULL, '2026-09-02 09:16:11', '2026-09-02 09:16:11'),
(10, 3, 'cwts', 'BSPsych', 'A', '2026-09-02 09:21:00', '2026-09-03 03:17:00', '2026-09-02 09:21:00', '2026-09-03 03:17:00', 15, 1, NULL, NULL, 1, 8.56821519, 124.42492356, 100, 'active', NULL, '2026-09-02 09:19:17', '2026-09-02 09:19:17'),
(11, 3, 'cwts', 'BSPsych', 'A', 'BMNQJ5', '2026-09-02 09:23:00', '2026-09-03 03:22:00', '2026-09-02 09:23:00', '2026-09-03 03:22:00', 15, 1, NULL, NULL, 1, 8.52182608, 124.57249492, 100, 'active', NULL, '2026-09-02 09:22:26', '2026-09-02 09:22:26'),
(12, 3, 'cwts', NULL, NULL, '2026-09-02 09:27:00', '2026-09-03 03:22:00', '2026-09-02 09:27:00', '2026-09-03 03:22:00', 15, 1, NULL, NULL, 1, 8.56825445, 124.42487000, 100, 'active', NULL, '2026-09-02 09:26:24', '2026-09-02 09:26:24'),
(13, 3, 'cwts', 'BSCS', 'E', '2026-09-02 01:36:54', '2026-09-02 03:36:54', '2026-09-02 01:36:54', '2026-09-02 03:36:54', 15, 1, NULL, NULL, 1, 8.56814067, 124.42493431, 100, 'active', 'Sushsua', '2026-09-02 09:33:45', '2026-09-02 09:33:45');

-- --------------------------------------------------------

--
-- Table structure for table `batch_certificates`
--

CREATE TABLE `batch_certificates` (
  `id` bigint UNSIGNED NOT NULL,
  `batch_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_type` enum('completion','participation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_students` int NOT NULL,
  `generated_count` int NOT NULL DEFAULT '0',
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `generated_by` bigint UNSIGNED NOT NULL,
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bulletin_board`
--

CREATE TABLE `bulletin_board` (
  `id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `target_audience` enum('all','students','faculty','cwts','rotc','lts') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_from` datetime NOT NULL,
  `display_until` datetime DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `views` int NOT NULL DEFAULT '0',
  `created_by` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bulletin_board`
--

INSERT INTO `bulletin_board` (`id`, `title`, `content`, `category`, `target_audience`, `image_path`, `display_from`, `display_until`, `is_featured`, `views`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Welcome to NSTP Program!', 'Welcome to the new academic year. All NSTP activities are now available for registration. Please check your schedules and complete your requirements on time.', 'announcement', 'all', NULL, '2026-08-26 17:12:36', '2026-10-02 17:12:36', 1, 150, 1, '2026-08-26 09:12:36', '2026-08-26 09:12:36'),
(2, 'CWTS Community Service Schedule', 'CWTS community service activities will be held every Saturday starting this month. Please check your assigned schedule and report to your designated area.', 'update', 'cwts', NULL, '2026-08-31 17:12:36', '2026-09-17 17:12:36', 0, 80, 3, '2026-08-31 09:12:36', '2026-08-31 09:12:36'),
(3, 'ROTC Schedule Adjustment', 'ROTC training will be moved to Saturdays starting next week. Please check the updated schedule posted on the bulletin board.', 'update', 'rotc', NULL, '2026-09-01 17:12:36', '2026-09-22 17:12:36', 0, 65, 4, '2026-09-01 09:12:36', '2026-09-01 09:12:36'),
(4, 'LTS Literacy Program Update', 'LTS literacy program now accepting volunteers for the community outreach. Interested students please sign up at the NSTP office.', 'announcement', 'lts', NULL, '2026-08-30 17:12:36', '2026-09-12 17:12:36', 0, 45, 5, '2026-08-30 09:12:36', '2026-08-30 09:12:36'),
(5, 'NSTP General Assembly', 'All NSTP students are required to attend the General Assembly on Friday, 10:00 AM at the University Auditorium. Attendance is mandatory.', 'event', 'all', NULL, '2026-09-07 17:12:36', '2026-09-09 17:12:36', 1, 200, 2, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(6, 'Face Registration Reminder', 'All students must register their face for attendance purposes. Please visit the NSTP office to complete your face registration.', 'announcement', 'students', NULL, '2026-09-02 17:12:36', '2026-09-16 17:12:36', 0, 120, 1, '2026-09-02 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `certificate_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_type` enum('completion','participation','training') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` bigint UNSIGNED DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','issued','revoked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `issued_by` bigint UNSIGNED NOT NULL,
  `issued_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificate_templates`
--

CREATE TABLE `certificate_templates` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('completion','participation','training') COLLATE utf8mb4_unicode_ci NOT NULL,
  `html_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `css_styles` text COLLATE utf8mb4_unicode_ci,
  `background_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placeholders` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` bigint UNSIGNED NOT NULL,
  `teacher_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `component_type` enum('cwts','rotc','lts','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `join_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `teacher_id`, `name`, `description`, `component_type`, `join_code`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 'CWTS Section A - 2025', 'CWTS class for BSIT students. Focus on community service and civic welfare training.', 'cwts', 'CWTS2025A', 'active', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(2, 4, 'ROTC Basic Training - 2025', 'ROTC class for BEED students. Focus on military training and discipline.', 'rotc', 'ROTC2025B', 'active', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(3, 5, 'LTS Literacy Program - 2025', 'LTS class for BSFM students. Focus on literacy training and community outreach.', 'lts', 'LTS2025C', 'active', '2026-09-02 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `class_students`
--

CREATE TABLE `class_students` (
  `id` bigint UNSIGNED NOT NULL,
  `class_id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','removed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_students`
--

INSERT INTO `class_students` (`id`, `class_id`, `student_id`, `joined_at`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 6, '2026-08-14 09:12:36', 'active', NULL, NULL),
(2, 1, 11, '2026-08-17 09:12:36', 'active', NULL, NULL),
(3, 1, 12, '2026-08-10 09:12:36', 'active', NULL, NULL),
(4, 3, 15, '2026-08-10 09:12:36', 'active', NULL, NULL),
(5, 2, 18, '2026-08-28 09:12:36', 'active', NULL, NULL),
(6, 1, 20, '2026-08-04 09:12:36', 'active', NULL, NULL),
(7, 1, 22, '2026-08-28 09:12:36', 'active', NULL, NULL),
(8, 1, 23, '2026-08-03 09:12:36', 'active', NULL, NULL),
(9, 2, 27, '2026-08-26 09:12:36', 'active', NULL, NULL),
(10, 2, 28, '2026-08-18 09:12:36', 'active', NULL, NULL),
(11, 3, 29, '2026-08-18 09:12:36', 'active', NULL, NULL),
(12, 1, 32, '2026-08-15 09:12:36', 'active', NULL, NULL),
(13, 1, 33, '2026-09-02 09:12:36', 'active', NULL, NULL),
(14, 1, 34, '2026-09-01 09:12:36', 'active', NULL, NULL),
(15, 2, 39, '2026-08-27 09:12:36', 'active', NULL, NULL),
(16, 3, 42, '2026-08-29 09:12:36', 'active', NULL, NULL),
(17, 1, 45, '2026-08-12 09:12:36', 'active', NULL, NULL),
(18, 3, 47, '2026-08-24 09:12:36', 'active', NULL, NULL),
(19, 1, 50, '2026-08-26 09:12:36', 'active', NULL, NULL),
(20, 2, 51, '2026-08-14 09:12:36', 'active', NULL, NULL),
(21, 1, 53, '2026-08-17 09:12:36', 'active', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `communication_dashboard`
--

CREATE TABLE `communication_dashboard` (
  `id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'announcement',
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_from` datetime DEFAULT NULL,
  `display_until` datetime DEFAULT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `component_change_requests`
--

CREATE TABLE `component_change_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `from_component` enum('cwts','rotc','lts') COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_component` enum('cwts','rotc','lts') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_remarks` text COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `component_change_requests`
--

INSERT INTO `component_change_requests` (`id`, `student_id`, `from_component`, `to_component`, `reason`, `status`, `admin_remarks`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 9, 'lts', 'cwts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'approved', 'Request approved by admin', 2, '2026-08-28 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(2, 11, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(3, 12, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 1, '2026-08-30 09:12:36', '2026-08-19 09:12:36', '2026-09-02 09:12:36'),
(4, 14, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(5, 19, 'lts', 'rotc', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'approved', 'Request approved by admin', 2, '2026-08-26 09:12:36', '2026-08-18 09:12:36', '2026-09-02 09:12:36'),
(6, 20, 'cwts', 'rotc', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'approved', 'Request approved by admin', 1, '2026-08-23 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(7, 23, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'approved', 'Request approved by admin', 1, '2026-08-23 09:12:36', '2026-08-20 09:12:36', '2026-09-02 09:12:36'),
(8, 24, 'rotc', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-27 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(9, 25, 'lts', 'cwts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-29 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(10, 27, 'rotc', 'cwts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-18 09:12:36', '2026-09-02 09:12:36'),
(11, 33, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-25 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(12, 36, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-19 09:12:36', '2026-09-02 09:12:36'),
(13, 37, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-27 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(14, 41, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(15, 42, 'lts', 'cwts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-27 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(16, 44, 'rotc', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(17, 45, 'cwts', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-23 09:12:36', '2026-08-21 09:12:36', '2026-09-02 09:12:36'),
(18, 47, 'lts', 'cwts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 2, '2026-08-25 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(19, 51, 'rotc', 'cwts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-21 09:12:36', '2026-09-02 09:12:36'),
(20, 52, 'lts', 'rotc', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(21, 53, 'cwts', 'rotc', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'approved', 'Request approved by admin', 1, '2026-08-29 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(22, 54, 'rotc', 'lts', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'rejected', 'Request rejected by admin', 1, '2026-09-01 09:12:36', '2026-08-21 09:12:36', '2026-09-02 09:12:36'),
(23, 55, 'lts', 'rotc', 'Personal preference for component change. I believe this component better fits my interests and career goals.', 'pending', NULL, NULL, NULL, '2026-08-22 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `extracted_text` longtext COLLATE utf8mb4_unicode_ci,
  `ocr_processed` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `verified_by` bigint UNSIGNED DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `student_id`, `document_type`, `file_path`, `file_name`, `file_type`, `file_size`, `extracted_text`, `ocr_processed`, `status`, `rejection_reason`, `verified_by`, `verified_at`, `created_at`, `updated_at`) VALUES
(1, 6, 'Medical Certificate', 'documents/STU-0006/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 63075, NULL, 0, 'approved', NULL, 1, '2026-09-01 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(2, 7, 'Certificate of Registration', 'documents/STU-0007/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 75662, NULL, 0, 'approved', NULL, 2, '2026-09-02 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(3, 7, 'Good Moral Certificate', 'documents/STU-0007/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 108271, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(4, 8, 'Good Moral Certificate', 'documents/STU-0008/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 102780, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-09-01 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(5, 9, 'Certificate of Registration', 'documents/STU-0009/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 133542, NULL, 0, 'approved', NULL, 2, '2026-08-31 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(6, 10, 'Good Moral Certificate', 'documents/STU-0010/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 147937, NULL, 0, 'approved', NULL, 2, '2026-09-01 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(7, 10, 'Medical Certificate', 'documents/STU-0010/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 87630, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-29 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(8, 10, 'Parent Consent', 'documents/STU-0010/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 57512, NULL, 0, 'approved', NULL, 2, '2026-09-01 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(9, 11, 'Certificate of Registration', 'documents/STU-0011/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 80278, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(10, 12, 'NSTP Waiver', 'documents/STU-0012/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 127201, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-01 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(11, 13, 'Certificate of Registration', 'documents/STU-0013/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 64223, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-29 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(12, 13, 'NSTP Waiver', 'documents/STU-0013/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 75881, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-31 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(13, 13, 'Parent Consent', 'documents/STU-0013/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 133385, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(14, 14, 'NSTP Waiver', 'documents/STU-0014/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 103787, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-09-01 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(15, 15, 'Certificate of Registration', 'documents/STU-0015/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 196146, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(16, 15, 'Parent Consent', 'documents/STU-0015/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 70738, NULL, 0, 'pending', NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(17, 16, 'Certificate of Registration', 'documents/STU-0016/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 142200, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(18, 16, 'Medical Certificate', 'documents/STU-0016/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 100429, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(19, 16, 'Parent Consent', 'documents/STU-0016/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 156478, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-28 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(20, 17, 'Medical Certificate', 'documents/STU-0017/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 110366, NULL, 0, 'approved', NULL, 1, '2026-08-30 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(21, 17, 'Parent Consent', 'documents/STU-0017/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 96462, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-09-02 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(22, 18, 'Medical Certificate', 'documents/STU-0018/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 188637, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(23, 18, 'NSTP Waiver', 'documents/STU-0018/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 53407, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-01 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(24, 18, 'Parent Consent', 'documents/STU-0018/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 155949, NULL, 0, 'approved', NULL, 2, '2026-08-29 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(25, 19, 'NSTP Waiver', 'documents/STU-0019/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 68482, NULL, 0, 'approved', NULL, 1, '2026-08-28 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(26, 19, 'Parent Consent', 'documents/STU-0019/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 162955, NULL, 0, 'approved', NULL, 2, '2026-08-29 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(27, 20, 'NSTP Waiver', 'documents/STU-0020/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 162725, NULL, 0, 'approved', NULL, 2, '2026-08-29 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(28, 21, 'NSTP Waiver', 'documents/STU-0021/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 167727, NULL, 0, 'approved', NULL, 2, '2026-08-29 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(29, 22, 'Good Moral Certificate', 'documents/STU-0022/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 166025, NULL, 0, 'pending', NULL, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(30, 22, 'Parent Consent', 'documents/STU-0022/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 167693, NULL, 0, 'approved', NULL, 2, '2026-08-29 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(31, 23, 'Certificate of Registration', 'documents/STU-0023/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 114654, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-01 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(32, 23, 'Medical Certificate', 'documents/STU-0023/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 53341, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-30 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(33, 23, 'Parent Consent', 'documents/STU-0023/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 157954, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-31 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(34, 24, 'Good Moral Certificate', 'documents/STU-0024/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 180796, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-09-01 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(35, 25, 'Medical Certificate', 'documents/STU-0025/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 117374, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(36, 26, 'Good Moral Certificate', 'documents/STU-0026/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 58965, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(37, 26, 'Medical Certificate', 'documents/STU-0026/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 198101, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-28 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(38, 26, 'Parent Consent', 'documents/STU-0026/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 153973, NULL, 0, 'approved', NULL, 1, '2026-08-30 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(39, 27, 'Parent Consent', 'documents/STU-0027/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 155603, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-28 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(40, 28, 'Certificate of Registration', 'documents/STU-0028/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 170644, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-28 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(41, 29, 'Certificate of Registration', 'documents/STU-0029/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 170673, NULL, 0, 'pending', NULL, NULL, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(42, 29, 'NSTP Waiver', 'documents/STU-0029/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 102277, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-09-02 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(43, 30, 'Medical Certificate', 'documents/STU-0030/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 94832, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-29 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(44, 31, 'Certificate of Registration', 'documents/STU-0031/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 92527, NULL, 0, 'approved', NULL, 2, '2026-09-02 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(45, 31, 'Medical Certificate', 'documents/STU-0031/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 133649, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-29 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(46, 32, 'Good Moral Certificate', 'documents/STU-0032/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 158150, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(47, 33, 'NSTP Waiver', 'documents/STU-0033/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 170572, NULL, 0, 'approved', NULL, 2, '2026-09-02 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(48, 34, 'Good Moral Certificate', 'documents/STU-0034/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 197248, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-28 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(49, 35, 'Certificate of Registration', 'documents/STU-0035/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 173256, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-28 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(50, 35, 'Medical Certificate', 'documents/STU-0035/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 133440, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-02 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(51, 36, 'Certificate of Registration', 'documents/STU-0036/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 163648, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-29 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(52, 36, 'Medical Certificate', 'documents/STU-0036/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 146372, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-09-01 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(53, 37, 'Certificate of Registration', 'documents/STU-0037/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 105950, NULL, 0, 'approved', NULL, 1, '2026-08-31 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(54, 37, 'NSTP Waiver', 'documents/STU-0037/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 178038, NULL, 0, 'approved', NULL, 2, '2026-08-28 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(55, 37, 'Parent Consent', 'documents/STU-0037/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 82916, NULL, 0, 'approved', NULL, 2, '2026-08-31 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(56, 38, 'Good Moral Certificate', 'documents/STU-0038/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 151509, NULL, 0, 'approved', NULL, 2, '2026-08-29 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(57, 38, 'Medical Certificate', 'documents/STU-0038/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 193993, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(58, 39, 'Certificate of Registration', 'documents/STU-0039/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 75672, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-29 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(59, 40, 'Parent Consent', 'documents/STU-0040/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 176746, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-30 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(60, 41, 'NSTP Waiver', 'documents/STU-0041/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 62807, NULL, 0, 'approved', NULL, 1, '2026-08-29 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(61, 42, 'NSTP Waiver', 'documents/STU-0042/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 162573, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-02 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(62, 42, 'Parent Consent', 'documents/STU-0042/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 51116, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-02 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(63, 43, 'Parent Consent', 'documents/STU-0043/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 85140, NULL, 0, 'approved', NULL, 1, '2026-08-30 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(64, 44, 'Certificate of Registration', 'documents/STU-0044/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 155205, NULL, 0, 'approved', NULL, 1, '2026-08-28 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(65, 44, 'Good Moral Certificate', 'documents/STU-0044/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 111004, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-01 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(66, 44, 'Medical Certificate', 'documents/STU-0044/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 128304, NULL, 0, 'approved', NULL, 1, '2026-08-29 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(67, 45, 'Good Moral Certificate', 'documents/STU-0045/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 62445, NULL, 0, 'approved', NULL, 2, '2026-08-28 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(68, 45, 'Medical Certificate', 'documents/STU-0045/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 132770, NULL, 0, 'approved', NULL, 1, '2026-08-30 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(69, 45, 'NSTP Waiver', 'documents/STU-0045/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 138755, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(70, 46, 'Certificate of Registration', 'documents/STU-0046/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 126890, NULL, 0, 'approved', NULL, 1, '2026-09-02 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(71, 46, 'Good Moral Certificate', 'documents/STU-0046/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 130302, NULL, 0, 'approved', NULL, 2, '2026-09-02 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(72, 47, 'Good Moral Certificate', 'documents/STU-0047/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 112975, NULL, 0, 'approved', NULL, 1, '2026-08-31 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(73, 48, 'Certificate of Registration', 'documents/STU-0048/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 117585, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-08-29 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(74, 48, 'NSTP Waiver', 'documents/STU-0048/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 141462, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(75, 49, 'NSTP Waiver', 'documents/STU-0049/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 150324, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-30 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(76, 50, 'Good Moral Certificate', 'documents/STU-0050/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 169056, NULL, 0, 'approved', NULL, 1, '2026-08-30 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(77, 50, 'Medical Certificate', 'documents/STU-0050/medical-certificate.pdf', 'medical-certificate.pdf', 'application/pdf', 93247, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-30 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(78, 50, 'NSTP Waiver', 'documents/STU-0050/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 160010, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-01 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(79, 51, 'NSTP Waiver', 'documents/STU-0051/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 94473, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(80, 52, 'Good Moral Certificate', 'documents/STU-0052/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 149387, NULL, 0, 'approved', NULL, 1, '2026-09-02 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(81, 52, 'Parent Consent', 'documents/STU-0052/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 84436, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(82, 53, 'NSTP Waiver', 'documents/STU-0053/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 104297, NULL, 0, 'approved', NULL, 1, '2026-09-02 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(83, 53, 'Parent Consent', 'documents/STU-0053/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 80541, NULL, 0, 'approved', NULL, 1, '2026-08-28 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(84, 54, 'Certificate of Registration', 'documents/STU-0054/certificate-of-registration.pdf', 'certificate-of-registration.pdf', 'application/pdf', 88845, NULL, 0, 'pending', NULL, NULL, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(85, 54, 'Good Moral Certificate', 'documents/STU-0054/good-moral-certificate.pdf', 'good-moral-certificate.pdf', 'application/pdf', 195766, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 1, '2026-08-29 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(86, 55, 'NSTP Waiver', 'documents/STU-0055/nstp-waiver.pdf', 'nstp-waiver.pdf', 'application/pdf', 72346, NULL, 0, 'rejected', 'Document is incomplete. Please resubmit with complete information.', 2, '2026-09-01 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(87, 55, 'Parent Consent', 'documents/STU-0055/parent-consent.pdf', 'parent-consent.pdf', 'application/pdf', 55048, NULL, 0, 'approved', NULL, 2, '2026-08-30 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `eligibility_monitoring`
--

CREATE TABLE `eligibility_monitoring` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `hours_requirement_met` tinyint(1) NOT NULL DEFAULT '0',
  `documents_requirement_met` tinyint(1) NOT NULL DEFAULT '0',
  `activities_requirement_met` tinyint(1) NOT NULL DEFAULT '0',
  `overall_eligible` tinyint(1) NOT NULL DEFAULT '0',
  `eligibility_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `checked_by` bigint UNSIGNED DEFAULT NULL,
  `checked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `graduation_batches`
--

CREATE TABLE `graduation_batches` (
  `id` bigint UNSIGNED NOT NULL,
  `batch_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `graduation_date` date NOT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_students` int NOT NULL DEFAULT '0',
  `status` enum('upcoming','ongoing','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `learning_materials`
--

CREATE TABLE `learning_materials` (
  `id` bigint UNSIGNED NOT NULL,
  `class_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int UNSIGNED DEFAULT NULL,
  `topic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `learning_materials`
--

INSERT INTO `learning_materials` (`id`, `class_id`, `title`, `description`, `file_path`, `file_name`, `file_type`, `file_size`, `topic`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'CWTS Module 1: Introduction', 'Introduction to CWTS program. Overview of community service and civic welfare training.', 'learning_materials/1/cwts_module1.pdf', 'cwts_module1.pdf', 'application/pdf', 1024000, 'Introduction', 3, '2026-08-23 09:12:36', '2026-08-23 09:12:36'),
(2, 1, 'CWTS Module 2: Community Engagement', 'Understanding community engagement and its importance in CWTS.', 'learning_materials/1/cwts_module2.pdf', 'cwts_module2.pdf', 'application/pdf', 2048000, 'Community Engagement', 3, '2026-08-26 09:12:36', '2026-08-26 09:12:36'),
(3, 2, 'ROTC Manual: Basic Training', 'ROTC Basic Training Manual. Covers military drills and discipline.', 'learning_materials/2/rotc_manual.pdf', 'rotc_manual.pdf', 'application/pdf', 3072000, 'Basic Training', 4, '2026-08-19 09:12:36', '2026-08-19 09:12:36'),
(4, 3, 'LTS Module 1: Literacy Basics', 'Introduction to literacy training and teaching techniques.', 'learning_materials/3/lts_module1.pdf', 'lts_module1.pdf', 'application/pdf', 1536000, 'Literacy Basics', 5, '2026-08-25 09:12:36', '2026-08-25 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `memos`
--

CREATE TABLE `memos` (
  `id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_audience` enum('all','students','faculty','cwts','rotc','lts','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `is_urgent` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` bigint UNSIGNED NOT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `memos`
--

INSERT INTO `memos` (`id`, `title`, `content`, `file_path`, `file_name`, `target_audience`, `is_urgent`, `status`, `created_by`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'NSTP Office Memo: Schedule Changes', 'All NSTP schedules for the second semester have been updated. Please check the new schedule posted on the bulletin board.', NULL, NULL, 'all', 0, 'published', 2, '2026-08-28 09:12:36', '2026-08-28 09:12:36', '2026-08-28 09:12:36'),
(2, 'Memo: Face Registration Schedule', 'Face registration for students will be held from Monday to Friday, 9:00 AM to 4:00 PM at the NSTP office.', NULL, NULL, 'students', 1, 'published', 1, '2026-08-30 09:12:36', '2026-08-30 09:12:36', '2026-08-30 09:12:36'),
(3, 'Memo: CWTS Activity Guidelines', 'Updated guidelines for CWTS community service activities. Please read carefully before starting your community service.', NULL, NULL, 'cwts', 0, 'published', 3, '2026-08-26 09:12:36', '2026-08-26 09:12:36', '2026-08-26 09:12:36'),
(4, 'Memo: ROTC Training Schedule', 'ROTC training schedule has been updated. Please check the new schedule for your section.', NULL, NULL, 'rotc', 0, 'published', 4, '2026-08-29 09:12:36', '2026-08-29 09:12:36', '2026-08-29 09:12:36'),
(5, 'Memo: LTS Community Outreach', 'LTS community outreach program will be held next week. All LTS students are required to attend.', NULL, NULL, 'lts', 1, 'published', 5, '2026-08-31 09:12:36', '2026-08-31 09:12:36', '2026-08-31 09:12:36'),
(6, 'Memo: Faculty Meeting', 'All NSTP faculty members are required to attend the monthly meeting on Friday at 3:00 PM.', NULL, NULL, 'faculty', 0, 'published', 1, '2026-09-01 09:12:36', '2026-09-01 09:12:36', '2026-09-01 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '2026_03_26_053713_create_users_table', 1),
(3, '2026_03_26_053720_create_password_reset_tokens_table', 1),
(4, '2026_03_26_053729_create_failed_jobs_table', 1),
(5, '2026_03_26_053737_create_jobs_table', 1),
(6, '2026_03_26_053743_create_sessions_table', 1),
(7, '2026_03_26_053750_create_personal_access_tokens_table', 1),
(8, '2026_03_26_053808_create_students_table', 1),
(9, '2026_03_26_053814_create_activities_table', 1),
(10, '2026_03_26_053915_create_academic_years_table', 1),
(11, '2026_03_26_053922_create_graduation_batches_table', 1),
(12, '2026_03_26_053929_create_year_level_progressions_table', 1),
(13, '2026_03_26_053941_create_activity_registrations_table', 1),
(14, '2026_03_26_053951_create_activity_participations_table', 1),
(15, '2026_03_26_054001_create_activity_feedback_table', 1),
(16, '2026_03_26_054009_create_documents_table', 1),
(17, '2026_03_26_054015_create_certificates_table', 1),
(18, '2026_03_26_054023_create_certificate_templates_table', 1),
(19, '2026_03_26_054031_create_batch_certificates_table', 1),
(20, '2026_03_26_054039_create_nstp_component_selections_table', 1),
(21, '2026_03_26_054048_create_component_change_requests_table', 1),
(22, '2026_03_26_054057_create_training_hours_logs_table', 1),
(23, '2026_03_26_054105_create_eligibility_monitoring_table', 1),
(24, '2026_03_26_054117_create_memos_table', 1),
(25, '2026_03_26_054124_create_bulletin_board_table', 1),
(26, '2026_03_26_054132_create_communication_dashboard_table', 1),
(27, '2026_03_26_054139_create_notifications_table', 1),
(28, '2026_03_26_054148_create_activity_logs_table', 1),
(29, '2026_03_26_054155_create_admin_action_logs_table', 1),
(30, '2026_03_26_054208_create_reports_table', 1),
(31, '2026_03_26_054216_create_sis_integration_table', 1),
(32, '2026_03_26_054224_create_settings_table', 1),
(33, '2026_03_26_054232_create_system_backups_table', 1),
(34, '2026_06_28_202629_create_classes_table', 1),
(35, '2026_06_28_202630_create_attendance_sessions_table', 1),
(36, '2026_06_28_202630_create_class_students_table', 1),
(37, '2026_06_28_202631_create_attendance_logs_table', 1),
(38, '2026_06_28_202631_create_learning_materials_table', 1),
(39, '2026_06_28_202631_create_ocr_texts_table', 1),
(40, '2026_07_16_000000_create_password_reset_otps_table', 1),
(41, '2026_07_17_000000_add_grade_fields_to_students_table', 1),
(42, '2026_08_01_000000_create_student_locations_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'announcement',
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `data`, `is_read`, `read_at`, `created_at`, `updated_at`) VALUES
(1, 6, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 6}', 0, '2026-08-29 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(2, 6, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 6}', 0, '2026-08-30 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(3, 6, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 6}', 1, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(4, 7, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 7}', 1, '2026-09-01 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(5, 8, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 8}', 0, '2026-08-29 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(6, 8, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 8}', 0, '2026-09-02 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(7, 8, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 8}', 1, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(8, 9, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 9}', 0, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(9, 10, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 10}', 1, '2026-08-29 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(10, 11, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 11}', 1, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(11, 11, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 11}', 0, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(12, 12, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 12}', 1, '2026-08-31 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(13, 13, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 13}', 1, '2026-08-29 09:12:36', '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(14, 13, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 13}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(15, 14, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 14}', 0, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(16, 14, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 14}', 0, '2026-09-01 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(17, 14, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 14}', 0, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(18, 15, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 15}', 1, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(19, 15, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 15}', 0, '2026-09-01 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(20, 15, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 15}', 1, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(21, 16, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 16}', 0, '2026-09-01 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(22, 16, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 16}', 0, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(23, 16, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 16}', 1, '2026-09-02 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(24, 17, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 17}', 1, '2026-08-28 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(25, 17, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 17}', 0, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(26, 18, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 18}', 1, '2026-09-02 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(27, 18, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 18}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(28, 19, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 19}', 0, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(29, 19, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 19}', 1, '2026-08-28 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(30, 20, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 20}', 1, '2026-09-02 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(31, 20, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 20}', 1, '2026-08-30 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(32, 21, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 21}', 1, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(33, 21, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 21}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(34, 21, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 21}', 0, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(35, 22, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 22}', 1, '2026-08-29 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(36, 23, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 23}', 1, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(37, 23, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 23}', 0, '2026-08-31 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(38, 23, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 23}', 0, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(39, 24, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 24}', 1, '2026-08-30 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(40, 24, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 24}', 0, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(41, 24, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 24}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(42, 25, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 25}', 1, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(43, 26, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 26}', 0, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(44, 26, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 26}', 1, '2026-09-01 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(45, 27, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 27}', 0, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(46, 27, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 27}', 1, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(47, 27, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 27}', 0, '2026-08-28 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(48, 28, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 28}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(49, 28, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 28}', 1, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(50, 29, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 29}', 1, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(51, 30, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 30}', 0, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(52, 30, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 30}', 0, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(53, 30, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 30}', 0, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(54, 31, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 31}', 1, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(55, 31, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 31}', 1, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(56, 31, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 31}', 1, '2026-09-02 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(57, 32, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 32}', 1, '2026-08-30 09:12:36', '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(58, 33, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 33}', 0, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(59, 33, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 33}', 0, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(60, 33, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 33}', 0, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(61, 34, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 34}', 0, '2026-08-31 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(62, 34, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 34}', 0, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(63, 34, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 34}', 1, '2026-08-30 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(64, 35, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 35}', 1, '2026-09-02 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(65, 35, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 35}', 0, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(66, 36, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 36}', 1, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(67, 36, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 36}', 0, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(68, 36, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 36}', 1, '2026-08-28 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(69, 37, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 37}', 1, '2026-09-02 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(70, 38, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 38}', 0, '2026-08-28 09:12:36', '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(71, 38, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 38}', 1, '2026-08-28 09:12:36', '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(72, 38, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 38}', 1, '2026-08-30 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(73, 39, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 39}', 1, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(74, 39, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 39}', 1, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(75, 39, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 39}', 1, '2026-08-28 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(76, 40, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 40}', 0, '2026-09-02 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(77, 40, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 40}', 1, '2026-08-31 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(78, 41, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 41}', 1, '2026-08-30 09:12:36', '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(79, 41, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 41}', 1, '2026-09-02 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(80, 42, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 42}', 1, NULL, '2026-08-25 09:12:36', '2026-09-02 09:12:36'),
(81, 42, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 42}', 1, '2026-08-31 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(82, 43, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 43}', 0, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(83, 44, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 44}', 0, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(84, 44, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 44}', 1, NULL, '2026-08-30 09:12:36', '2026-09-02 09:12:36'),
(85, 44, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 44}', 1, '2026-08-30 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(86, 45, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 45}', 0, NULL, '2026-09-01 09:12:36', '2026-09-02 09:12:36'),
(87, 45, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 45}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(88, 45, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 45}', 0, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(89, 46, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 46}', 1, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(90, 46, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 46}', 1, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(91, 46, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 46}', 1, '2026-09-02 09:12:36', '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(92, 47, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 47}', 0, '2026-09-02 09:12:36', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(93, 48, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 48}', 1, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(94, 48, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 48}', 0, '2026-08-29 09:12:36', '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(95, 48, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 48}', 0, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(96, 49, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 49}', 1, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(97, 50, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 50}', 0, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(98, 50, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 50}', 0, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(99, 50, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 50}', 1, NULL, '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(100, 51, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 51}', 1, NULL, '2026-08-27 09:12:36', '2026-09-02 09:12:36'),
(101, 52, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 52}', 1, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(102, 52, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 52}', 1, '2026-09-02 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(103, 53, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 53}', 0, NULL, '2026-08-24 09:12:36', '2026-09-02 09:12:36'),
(104, 53, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 53}', 1, NULL, '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(105, 53, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 53}', 0, '2026-08-28 09:12:36', '2026-08-23 09:12:36', '2026-09-02 09:12:36'),
(106, 54, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 54}', 0, NULL, '2026-08-29 09:12:36', '2026-09-02 09:12:36'),
(107, 54, 'Activity Reminder', 'Don\'t forget to attend your scheduled NSTP activity this week.', 'reminder', '{\"student_id\": 54}', 0, NULL, '2026-08-31 09:12:36', '2026-09-02 09:12:36'),
(108, 54, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 54}', 1, '2026-08-29 09:12:36', '2026-08-26 09:12:36', '2026-09-02 09:12:36'),
(109, 55, 'Welcome to NSTP', 'Welcome to the NSTP program! Please complete your registration and face registration.', 'announcement', '{\"student_id\": 55}', 1, NULL, '2026-08-28 09:12:36', '2026-09-02 09:12:36'),
(110, 55, 'Document Verification', 'Your document has been verified. Check your status in the app.', 'update', '{\"student_id\": 55}', 1, '2026-08-30 09:12:36', '2026-08-25 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `nstp_component_selections`
--

CREATE TABLE `nstp_component_selections` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `component_type` enum('cwts','rotc','lts') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ocr_texts`
--

CREATE TABLE `ocr_texts` (
  `id` bigint UNSIGNED NOT NULL,
  `document_id` bigint UNSIGNED NOT NULL,
  `extracted_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `confidence` double NOT NULL DEFAULT '0',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_otps`
--

CREATE TABLE `password_reset_otps` (
  `id` bigint UNSIGNED NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 3, 'auth_token', 'b7bb3ddea9f9ba3b48bc19cd3bec0518459c8716dcef76ed52660cd2b217a5fb', '[\"*\"]', '2026-09-02 09:39:53', NULL, '2026-09-02 09:12:50', '2026-09-02 09:39:53'),
(4, 'App\\Models\\User', 10, 'auth_token', '96146cd6a4c2efc30fa60a0cfb6be1bd9055e04adc5784c4ee4f7973e1148aa1', '[\"*\"]', '2026-09-02 09:38:08', NULL, '2026-09-02 09:35:49', '2026-09-02 09:38:08'),
(5, 'App\\Models\\User', 1, 'auth_token', '4b1cccf82270f58a846a02e5ccd8160526e8ce3eb8ad80703b2b92e29c192f6b', '[\"*\"]', '2026-09-03 07:18:22', NULL, '2026-09-03 07:01:39', '2026-09-03 07:18:22'),
(6, 'App\\Models\\User', 3, 'auth_token', '7353e6bb0a69c8874e76368f72833a244ca5f6f07975ed65891f45aa37f982f8', '[\"*\"]', '2026-09-03 07:34:52', NULL, '2026-09-03 07:28:07', '2026-09-03 07:34:52'),
(7, 'App\\Models\\User', 1, 'auth_token', '79e5d5571526c2f7f2cab668f75bec25dc0ec92be21c424d31f1574893dbee06', '[\"*\"]', '2026-09-03 07:36:46', NULL, '2026-09-03 07:35:18', '2026-09-03 07:36:46');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` bigint UNSIGNED NOT NULL,
  `report_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` enum('compliance','deficiency','certificate','attendance','summary') COLLATE utf8mb4_unicode_ci NOT NULL,
  `filters` json DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','generating','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `generated_by` bigint UNSIGNED NOT NULL,
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` bigint UNSIGNED NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`, `type`, `description`, `created_at`, `updated_at`) VALUES
(1, 'app_name', 'NSTP Management System', 'string', 'Application name', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(2, 'training_hours_required', '90', 'integer', 'Total training hours required for completion', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(3, 'max_activity_registrations', '5', 'integer', 'Maximum number of activities a student can register for', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(4, 'default_grace_period', '15', 'integer', 'Default grace period in minutes for attendance', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(5, 'face_confidence_threshold', '0.85', 'float', 'Minimum face recognition confidence threshold', '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(6, 'allow_component_change', 'true', 'boolean', 'Allow students to request component changes', '2026-09-02 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `sis_integration`
--

CREATE TABLE `sis_integration` (
  `id` bigint UNSIGNED NOT NULL,
  `sis_student_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `sis_data` json DEFAULT NULL,
  `last_sync_at` datetime DEFAULT NULL,
  `sync_status` enum('pending','synced','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `sync_error` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `student_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serial_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `face_encoding` json DEFAULT NULL,
  `face_confidence` double DEFAULT NULL,
  `face_registered_at` timestamp NULL DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `emergency_contact_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_level` int DEFAULT NULL,
  `section` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nstp_component_selected` enum('cwts','rotc','lts') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_training_hours` int NOT NULL DEFAULT '0',
  `completed_training_hours` int NOT NULL DEFAULT '0',
  `training_grade` decimal(3,2) DEFAULT NULL,
  `training_grade_percentage` decimal(5,2) DEFAULT NULL,
  `training_grade_remarks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade_updated_at` timestamp NULL DEFAULT NULL,
  `is_eligible_for_completion` tinyint(1) NOT NULL DEFAULT '0',
  `completion_status` enum('pending','in_progress','completed','deficient') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `user_id`, `student_id`, `serial_no`, `face_encoding`, `face_confidence`, `face_registered_at`, `birth_date`, `gender`, `address`, `emergency_contact_name`, `emergency_contact_number`, `course`, `year_level`, `section`, `nstp_component_selected`, `total_training_hours`, `completed_training_hours`, `training_grade`, `training_grade_percentage`, `training_grade_remarks`, `grade_updated_at`, `is_eligible_for_completion`, `completion_status`, `completed_at`, `created_at`, `updated_at`) VALUES
(6, 6, 'STU-0006', NULL, '\"[-0.19692087173461914,0.08506374806165695,0.04550999030470848,0.016476301476359367,-0.006314839236438274,0.02309267781674862,-0.020636627450585365,-0.08702044934034348,0.11274243891239166,-0.09547769278287888,0.30777812004089355,0.0015834467485547066,-0.16133984923362732,-0.16656599938869476,-0.012902924790978432,0.17172707617282867,-0.11565561592578888,-0.09878838807344437,-0.11931510269641876,-0.04943685606122017,0.04898682236671448,0.023212557658553123,-0.028065340593457222,0.07594047486782074,-0.08989855647087097,-0.3644963502883911,-0.04432058706879616,-0.1023327112197876,0.09632181376218796,-0.17226403951644897,-0.03005087561905384,0.07107914984226227,-0.19364626705646515,-0.01616579480469227,-0.051732152700424194,0.1348402202129364,0.06784249097108841,0.008122176863253117,0.1703527271747589,-0.024154992774128914,-0.1776292771100998,0.02771347016096115,0.020986545830965042,0.2857571244239807,0.2565077841281891,-0.03524808585643768,0.00818939320743084,0.002434578724205494,0.09610246121883392,-0.21105124056339264,0.023153701797127724,0.04029691591858864,0.17595550417900085,0.0649566724896431,0.010469055734574795,-0.14545123279094696,-0.06603597849607468,0.049457769840955734,-0.16837291419506073,0.017683250829577446,0.0017561684362590313,-0.14736230671405792,-0.08538784831762314,-0.03405211120843887,0.21267282962799072,0.03880619630217552,-0.1585046947002411,-0.12152855843305588,0.17879201471805573,-0.13955271244049072,0.031142856925725937,0.07577648013830185,-0.08492043614387512,-0.15187643468379974,-0.3165349066257477,0.14635173976421356,0.4182145893573761,0.13067954778671265,-0.25507062673568726,0.09670638293027878,-0.11373830586671829,-0.028615456074476242,0.02089492790400982,0.07493200898170471,0.0034314896911382675,0.017030540853738785,-0.0893433466553688,0.03301478177309036,0.1457202136516571,0.057444099336862564,-0.013839775696396828,0.2110033482313156,-0.01982017233967781,0.024363577365875244,0.048034876585006714,0.07517030090093613,-0.035807546228170395,-0.042176589369773865,-0.07404422760009766,0.0009343321435153484,-0.015211196616292,-0.0992414653301239,0.014681801199913025,0.04093623906373978,-0.15665888786315918,0.23743480443954468,0.01979888044297695,0.07522919028997421,0.05783534049987793,0.06554296612739563,-0.09564325213432312,-0.012926306575536728,0.1432933509349823,-0.31272900104522705,0.1763359159231186,0.14840348064899445,0.032734811305999756,0.19386225938796997,0.10210218280553818,0.14630277454853058,-0.005123354494571686,0.0035466421395540237,-0.16119606792926788,-0.07730404287576675,0.0701986774802208,-0.07521545886993408,0.07665672898292542,0.06521299481391907]\"', 0.9459, '2026-09-02 09:14:52', '2000-11-23', 'female', '31 Gutierrez St., Makati City', 'Jose Gutierrez Sr.', '09175703576', 'BSPsych', 1, 'A', 'cwts', 90, 14, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:27', '2026-09-02 09:14:52'),
(7, 7, 'STU-0007', NULL, NULL, NULL, NULL, '2003-11-16', 'male', '270 Torres St., Taguig City', 'Isabella Torres Sr.', '09173102588', 'BSFM', 1, 'B', 'rotc', 90, 8, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(8, 8, 'STU-0008', NULL, NULL, NULL, NULL, '2001-02-22', 'male', '823 Aquino St., Manila', 'Patricia Aquino Sr.', '09177602467', 'BSCE', 1, 'B', 'rotc', 90, 39, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(9, 9, 'STU-0009', NULL, NULL, NULL, NULL, '2004-05-13', 'male', '994 Cruz St., Manila', 'Alicia Cruz Sr.', '09174055885', 'BSIS', 4, 'B', 'lts', 90, 62, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(10, 10, 'STU-0010', NULL, NULL, NULL, NULL, '2004-02-16', 'female', '968 Rojas St., Quezon City', 'Enrique Rojas Sr.', '09177564469', 'BSBA', 3, 'C', 'lts', 90, 11, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(11, 11, 'STU-0011', NULL, NULL, NULL, NULL, '2006-01-04', 'female', '710 Flores St., Makati City', 'Beatriz Flores Sr.', '09176251828', 'BSEd', 4, 'E', 'cwts', 90, 63, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(12, 12, 'STU-0012', NULL, NULL, NULL, NULL, '2005-06-24', 'female', '985 Aquino St., Quezon City', 'Ricardo Aquino Sr.', '09174776998', 'BSPsych', 3, 'B', 'cwts', 90, 17, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(13, 13, 'STU-0013', NULL, NULL, NULL, NULL, '2002-12-04', 'male', '853 Diaz St., Makati City', 'Cristina Diaz Sr.', '09172086496', 'BEED', 4, 'A', 'rotc', 90, 19, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(14, 14, 'STU-0014', NULL, NULL, NULL, NULL, '2002-06-03', 'female', '485 Romero St., Manila', 'Miguel Romero Sr.', '09179237209', 'BSN', 4, 'E', 'cwts', 90, 89, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(15, 15, 'STU-0015', NULL, NULL, NULL, NULL, '2000-07-02', 'female', '775 Romero St., Makati City', 'Fernando Romero Sr.', '09176433716', 'BSIT', 1, 'E', 'lts', 90, 5, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(16, 16, 'STU-0016', NULL, NULL, NULL, NULL, '2002-06-17', 'male', '750 Rodriguez St., Pasig City', 'Jose Rodriguez Sr.', '09178660816', 'BSIS', 1, 'D', 'cwts', 90, 90, NULL, NULL, NULL, NULL, 1, 'completed', '2026-08-24 09:12:28', '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(17, 17, 'STU-0017', NULL, NULL, NULL, NULL, '2003-12-23', 'female', '37 Rivera St., Quezon City', 'Ricardo Rivera Sr.', '09173499234', 'BSEd', 3, 'C', 'cwts', 90, 57, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(18, 18, 'STU-0018', NULL, NULL, NULL, NULL, '2001-07-10', 'female', '311 Ramos St., Quezon City', 'Sofia Ramos Sr.', '09173516633', 'BSIS', 1, 'C', 'rotc', 90, 75, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(19, 19, 'STU-0019', NULL, NULL, NULL, NULL, '2004-01-03', 'female', '710 Romero St., Quezon City', 'Sofia Romero Sr.', '09175339973', 'BEED', 2, 'E', 'lts', 90, 67, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(20, 20, 'STU-0020', NULL, NULL, NULL, NULL, '2005-11-25', 'male', '736 Rojas St., Quezon City', 'Isabella Rojas Sr.', '09175672932', 'BSMM', 1, 'B', 'cwts', 90, 62, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(21, 21, 'STU-0021', NULL, NULL, NULL, NULL, '2003-12-10', 'male', '744 Flores St., Quezon City', 'Rogelio Flores Sr.', '09171564308', 'BSCE', 4, 'C', 'rotc', 90, 34, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(22, 22, 'STU-0022', NULL, NULL, NULL, NULL, '2004-10-12', 'female', '106 Castro St., Makati City', 'Luz Castro Sr.', '09172074406', 'BEED', 2, 'E', 'cwts', 90, 81, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(23, 23, 'STU-0023', NULL, NULL, NULL, NULL, '2000-11-13', 'female', '752 Delgado St., Pasig City', 'Juan Delgado Sr.', '09171358344', 'BSIS', 4, 'C', 'cwts', 90, 55, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(24, 24, 'STU-0024', NULL, NULL, NULL, NULL, '2006-03-19', 'male', '652 Vega St., Makati City', 'Patricia Vega Sr.', '09179024670', 'BSEd', 3, 'A', 'rotc', 90, 30, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(25, 25, 'STU-0025', NULL, NULL, NULL, NULL, '2000-11-23', 'male', '802 Vega St., Taguig City', 'Luz Vega Sr.', '09175471756', 'BSFM', 2, 'A', 'lts', 90, 44, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(26, 26, 'STU-0026', NULL, NULL, NULL, NULL, '2001-01-02', 'male', '130 Garcia St., Taguig City', 'Enrique Garcia Sr.', '09177281751', 'BSIT', 1, 'A', 'lts', 90, 53, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(27, 27, 'STU-0027', NULL, NULL, NULL, NULL, '2000-04-17', 'male', '829 Diaz St., Manila', 'Lourdes Diaz Sr.', '09178745867', 'BSMM', 1, 'B', 'rotc', 90, 75, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(28, 28, 'STU-0028', NULL, NULL, NULL, NULL, '2004-01-01', 'male', '254 Rodriguez St., Taguig City', 'Carmen Rodriguez Sr.', '09173281191', 'BSMath', 1, 'A', 'rotc', 90, 67, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(29, 29, 'STU-0029', NULL, NULL, NULL, NULL, '2001-07-06', 'male', '753 Rojas St., Makati City', 'Ricardo Rojas Sr.', '09179922909', 'BSEd', 4, 'A', 'lts', 90, 89, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(30, 30, 'STU-0030', NULL, NULL, NULL, NULL, '2000-09-02', 'female', '807 Lopez St., Taguig City', 'Carlos Lopez Sr.', '09179258271', 'BSMM', 1, 'A', 'cwts', 90, 15, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(31, 31, 'STU-0031', NULL, NULL, NULL, NULL, '2001-05-15', 'male', '472 Santos St., Makati City', 'Javier Santos Sr.', '09175344019', 'BEED', 3, 'D', 'rotc', 90, 84, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(32, 32, 'STU-0032', NULL, NULL, NULL, NULL, '2005-08-16', 'male', '935 Flores St., Makati City', 'Jose Flores Sr.', '09178582002', 'BSCS', 3, 'D', 'cwts', 90, 86, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(33, 33, 'STU-0033', NULL, NULL, NULL, NULL, '2004-03-17', 'female', '834 Romero St., Manila', 'Teresa Romero Sr.', '09175243411', 'BSCE', 3, 'C', 'cwts', 90, 72, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(34, 34, 'STU-0034', NULL, NULL, NULL, NULL, '2005-08-23', 'female', '785 Rojas St., Taguig City', 'Gloria Rojas Sr.', '09172089724', 'BEED', 3, 'C', 'cwts', 90, 37, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(35, 35, 'STU-0035', NULL, NULL, NULL, NULL, '2002-08-16', 'male', '451 Garcia St., Manila', 'Patricia Garcia Sr.', '09177149801', 'BSCS', 1, 'B', 'rotc', 90, 37, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(36, 36, 'STU-0036', NULL, NULL, NULL, NULL, '2001-10-04', 'male', '458 Vega St., Taguig City', 'Ramon Vega Sr.', '09175823931', 'BEED', 3, 'D', 'cwts', 90, 36, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(37, 37, 'STU-0037', NULL, NULL, NULL, NULL, '2004-07-10', 'male', '197 Ortiz St., Makati City', 'Maria Ortiz Sr.', '09179899565', 'BSA', 4, 'C', 'cwts', 90, 73, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(38, 38, 'STU-0038', NULL, NULL, NULL, NULL, '2006-11-02', 'female', '927 Lopez St., Taguig City', 'Beatriz Lopez Sr.', '09173765989', 'BSMM', 3, 'B', 'cwts', 90, 78, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(39, 39, 'STU-0039', NULL, NULL, NULL, NULL, '2003-06-13', 'male', '942 Cruz St., Manila', 'Gloria Cruz Sr.', '09177066561', 'BSIS', 1, 'A', 'rotc', 90, 88, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(40, 40, 'STU-0040', NULL, NULL, NULL, NULL, '2002-02-15', 'female', '270 Rivera St., Manila', 'Lourdes Rivera Sr.', '09179970777', 'BSMath', 2, 'B', 'rotc', 90, 21, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(41, 41, 'STU-0041', NULL, NULL, NULL, NULL, '2005-11-18', 'female', '363 Garcia St., Pasig City', 'Manuel Garcia Sr.', '09177896345', 'BSA', 3, 'B', 'cwts', 90, 79, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(42, 42, 'STU-0042', NULL, NULL, NULL, NULL, '2003-07-19', 'female', '205 Fernandez St., Quezon City', 'Antonio Fernandez Sr.', '09177679707', 'BSMM', 4, 'E', 'lts', 90, 1, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(43, 43, 'STU-0043', NULL, NULL, NULL, NULL, '2001-12-10', 'female', '854 Diaz St., Quezon City', 'Gloria Diaz Sr.', '09171806812', 'BSMath', 2, 'C', 'rotc', 90, 86, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(44, 44, 'STU-0044', NULL, NULL, NULL, NULL, '2005-06-09', 'female', '972 Rojas St., Quezon City', 'Juan Rojas Sr.', '09171474067', 'BSFM', 2, 'B', 'rotc', 90, 64, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(45, 45, 'STU-0045', NULL, NULL, NULL, NULL, '2003-09-04', 'male', '621 Fernandez St., Pasig City', 'Juan Fernandez Sr.', '09173109641', 'BSCS', 4, 'A', 'cwts', 90, 27, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(46, 46, 'STU-0046', NULL, NULL, NULL, NULL, '2001-01-04', 'female', '434 Mendoza St., Pasig City', 'Maria Mendoza Sr.', '09178556874', 'BSIT', 4, 'E', 'lts', 90, 88, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(47, 47, 'STU-0047', NULL, NULL, NULL, NULL, '2002-08-14', 'male', '811 Aquino St., Manila', 'Pedro Aquino Sr.', '09171518745', 'BSA', 1, 'A', 'lts', 90, 70, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(48, 48, 'STU-0048', NULL, NULL, NULL, NULL, '2004-08-02', 'female', '457 Castillo St., Manila', 'Domingo Castillo Sr.', '09172540323', 'BSN', 3, 'A', 'rotc', 90, 50, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(49, 49, 'STU-0049', NULL, NULL, NULL, NULL, '2000-02-15', 'male', '775 Vega St., Manila', 'Nena Vega Sr.', '09171051355', 'BSFM', 1, 'B', 'cwts', 90, 54, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(50, 50, 'STU-0050', NULL, NULL, NULL, NULL, '2006-10-23', 'male', '75 Mendoza St., Makati City', 'Isabella Mendoza Sr.', '09177306384', 'BSCS', 2, 'D', 'cwts', 90, 75, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(51, 51, 'STU-0051', NULL, NULL, NULL, NULL, '2005-09-23', 'female', '583 Perez St., Manila', 'Ramon Perez Sr.', '09173184589', 'BSIS', 3, 'C', 'rotc', 90, 63, NULL, NULL, NULL, NULL, 0, 'in_progress', NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(52, 52, 'STU-0052', NULL, NULL, NULL, NULL, '2005-04-06', 'male', '256 Santos St., Makati City', 'Isabella Santos Sr.', '09177521389', 'BSBA', 1, 'C', 'lts', 90, 27, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(53, 53, 'STU-0053', NULL, NULL, NULL, NULL, '2001-02-14', 'male', '73 Lopez St., Makati City', 'Rogelio Lopez Sr.', '09178265650', 'BSMath', 3, 'E', 'cwts', 90, 58, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(54, 54, 'STU-0054', NULL, NULL, NULL, NULL, '2001-03-11', 'female', '566 Morales St., Manila', 'Rogelio Morales Sr.', '09177707056', 'BSEd', 3, 'E', 'rotc', 90, 20, NULL, NULL, NULL, NULL, 0, 'deficient', NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(55, 55, 'STU-0055', NULL, NULL, NULL, NULL, '2003-08-17', 'female', '226 Garcia St., Quezon City', 'Ana Garcia Sr.', '09172922534', 'BSMath', 1, 'D', 'lts', 90, 52, NULL, NULL, NULL, NULL, 0, 'pending', NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `student_locations`
--

CREATE TABLE `student_locations` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `activity_id` bigint UNSIGNED DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `accuracy` decimal(10,2) DEFAULT NULL,
  `distance_from_venue` decimal(10,2) DEFAULT NULL,
  `is_within_geofence` tinyint(1) NOT NULL DEFAULT '0',
  `location_source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gps',
  `tracked_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_backups`
--

CREATE TABLE `system_backups` (
  `id` bigint UNSIGNED NOT NULL,
  `backup_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `type` enum('auto','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `training_hours_logs`
--

CREATE TABLE `training_hours_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `activity_id` bigint UNSIGNED DEFAULT NULL,
  `hours_earned` int NOT NULL,
  `date_logged` date NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('activity','training','community_service') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activity',
  `verified_by` bigint UNSIGNED DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','faculty','student') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `nstp_component` enum('cwts','rotc','lts') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_level` int DEFAULT NULL,
  `section` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `student_id`, `first_name`, `last_name`, `middle_name`, `email`, `profile_photo`, `contact_number`, `email_verified_at`, `password`, `role`, `nstp_component`, `course`, `year_level`, `section`, `is_active`, `remember_token`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Super', 'Admin', NULL, 'superadmin@nstp.edu', NULL, '09171234567', '2026-09-02 09:12:26', '$2y$12$zkByoOhZM4Pd4peBl0LF5eJB98D6SfaaPvKWvtz9De3U3YDpDGh7y', 'super_admin', NULL, NULL, NULL, NULL, 1, NULL, NULL, '2026-09-02 09:12:26', '2026-09-02 09:12:26'),
(2, NULL, 'Admin', 'User', NULL, 'admin@nstp.edu', NULL, '09172345678', '2026-09-02 09:12:26', '$2y$12$y55yGSZkvipdSu8KNVHlSuFiWVWtAXKqw2WXvG.VlEIISIvgzGKG.', 'admin', NULL, NULL, NULL, NULL, 1, NULL, NULL, '2026-09-02 09:12:26', '2026-09-02 09:12:26'),
(3, NULL, 'Maria', 'Santos', 'Cruz', 'faculty.cwts@nstp.edu', NULL, '09173456789', '2026-09-02 09:12:26', '$2y$12$3cXFPNnW2tKF/zViDynnL.JYeLg197yJ9GTGyemD7T8t3wiHu3bSq', 'faculty', 'cwts', 'BSIT', NULL, NULL, 1, NULL, NULL, '2026-09-02 09:12:26', '2026-09-02 09:12:26'),
(4, NULL, 'Jose', 'Reyes', 'Mendoza', 'faculty.rotc@nstp.edu', NULL, '09174567890', '2026-09-02 09:12:26', '$2y$12$2OpBsKe8n/jqffFSZkpBeOPOcKeEyD.V1eonynybybLKWQwdwiH5a', 'faculty', 'rotc', 'BEED', NULL, NULL, 1, NULL, NULL, '2026-09-02 09:12:26', '2026-09-02 09:12:26'),
(5, NULL, 'Ana', 'Garcia', 'Lopez', 'faculty.lts@nstp.edu', NULL, '09175678901', '2026-09-02 09:12:26', '$2y$12$l8dU0hdyvS6p2ZvZ.LybC.GG02CZffNHPYijucCd3W/5LkJxXP.ra', 'faculty', 'lts', 'BSFM', NULL, NULL, 1, NULL, NULL, '2026-09-02 09:12:26', '2026-09-02 09:12:26'),
(6, 'STU-0006', 'Jose', 'Gutierrez', NULL, 'student6@nstp.edu', 'profile_photos/6_1788340492.jpg', '09178067095', '2026-09-02 09:12:27', '$2y$12$kUXsfufXPSI2ORjtY7Kj2eBands67gMtLEfrKXSUsQ95WUiz5ATYm', 'student', 'cwts', 'BSPsych', 1, 'A', 1, NULL, NULL, '2026-09-02 09:12:27', '2026-09-02 09:14:52'),
(7, 'STU-0007', 'Isabella', 'Torres', 'Perez', 'student7@nstp.edu', NULL, '09178509649', '2026-09-02 09:12:27', '$2y$12$bMk0.lSRy1iIRJWHctJvl.NYL2aoHs8wd3NMPYAZh2RzGxhY5WvZe', 'student', 'rotc', 'BSFM', 1, 'B', 1, NULL, NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(8, 'STU-0008', 'Patricia', 'Aquino', NULL, 'student8@nstp.edu', NULL, '09176135400', '2026-09-02 09:12:27', '$2y$12$6yGBVaC0rvditO2mjRCnMOJe3VsiUMemBHigGNH9UuMo/krL5qWKm', 'student', 'rotc', 'BSCE', 1, 'B', 1, NULL, NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(9, 'STU-0009', 'Alicia', 'Cruz', NULL, 'student9@nstp.edu', NULL, '09173664167', '2026-09-02 09:12:27', '$2y$12$nQr6uSpCMpq21d9ANS3qaOLvEhJqQtoc4oWALq90FfMXeSPfUX7Lm', 'student', 'lts', 'BSIS', 4, 'B', 1, NULL, NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(10, 'STU-0010', 'Enrique', 'Rojas', 'Mendoza', 'student10@nstp.edu', NULL, '09173373867', '2026-09-02 09:12:27', '$2y$12$l.PRV1hHyQhV4GVSXAz0WuaCiFVYKDAyDiqhKpdAzaBxM8Sb5ZVp6', 'student', 'lts', 'BSBA', 3, 'C', 1, NULL, NULL, '2026-09-02 09:12:27', '2026-09-02 09:12:27'),
(11, 'STU-0011', 'Beatriz', 'Flores', NULL, 'student11@nstp.edu', NULL, '09178412477', '2026-09-02 09:12:28', '$2y$12$34ThucCuNTAfe.56PBTO3OpgAIVHeeiLDAYNCHKqNDmznjrasz14O', 'student', 'cwts', 'BSEd', 4, 'E', 1, NULL, NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(12, 'STU-0012', 'Ricardo', 'Aquino', NULL, 'student12@nstp.edu', NULL, '09174680568', '2026-09-02 09:12:28', '$2y$12$qwyM9tYUyKiilstzwEFaw.sfNMpy2Or020EkLX07RycTIy/HoT21e', 'student', 'cwts', 'BSPsych', 3, 'B', 1, NULL, NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(13, 'STU-0013', 'Cristina', 'Diaz', 'Perez', 'student13@nstp.edu', NULL, '09175630774', '2026-09-02 09:12:28', '$2y$12$m3qet.OVmXNRtisoIuqhWO6JarUpD3XvfLfFX1nRLF6aYdXEgAb82', 'student', 'rotc', 'BEED', 4, 'A', 1, NULL, NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(14, 'STU-0014', 'Miguel', 'Romero', NULL, 'student14@nstp.edu', NULL, '09176853696', '2026-09-02 09:12:28', '$2y$12$ShaB8wi1tfwIjGcfo/QMZ.vI3jrD4OjrfLu10YHXSFjZDNB6LJnYS', 'student', 'cwts', 'BSN', 4, 'E', 1, NULL, NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(15, 'STU-0015', 'Fernando', 'Romero', 'Gonzalez', 'student15@nstp.edu', NULL, '09176854517', '2026-09-02 09:12:28', '$2y$12$8Q4IYVd0i.EK6ZlCB8sWaunFWCnhGWq3UQy3EgGWSRD2Gc7BxELEi', 'student', 'lts', 'BSIT', 1, 'E', 1, NULL, NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(16, 'STU-0016', 'Jose', 'Rodriguez', NULL, 'student16@nstp.edu', NULL, '09176977381', '2026-09-02 09:12:28', '$2y$12$vMNXqUqnnhdo0aZlzfK2heUPW/cm7uz8dOtkF3tjSjKojunBVlcxa', 'student', 'cwts', 'BSIS', 1, 'D', 1, NULL, NULL, '2026-09-02 09:12:28', '2026-09-02 09:12:28'),
(17, 'STU-0017', 'Ricardo', 'Rivera', NULL, 'student17@nstp.edu', NULL, '09171568413', '2026-09-02 09:12:29', '$2y$12$zKuX6JtnaD9lSYken4lpNOqh7aaq8/ljAGFffHjS6jfS/bM60rBYS', 'student', 'cwts', 'BSEd', 3, 'C', 1, NULL, NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(18, 'STU-0018', 'Sofia', 'Ramos', NULL, 'student18@nstp.edu', NULL, '09178879645', '2026-09-02 09:12:29', '$2y$12$tekzhXh361dTISXg3HPkC.E9xYjtwVXa5sxAa/04O1NTG41T3JYaq', 'student', 'rotc', 'BSIS', 1, 'C', 1, NULL, NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(19, 'STU-0019', 'Sofia', 'Romero', NULL, 'student19@nstp.edu', NULL, '09172562963', '2026-09-02 09:12:29', '$2y$12$GGKJ4vFmnpd/i/tEaAdow.xVYJcQYjxAiHkUzA9SrbM07xEwzTz2a', 'student', 'lts', 'BEED', 2, 'E', 1, NULL, NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(20, 'STU-0020', 'Isabella', 'Rojas', 'Rivera', 'student20@nstp.edu', NULL, '09175497179', '2026-09-02 09:12:29', '$2y$12$OlcMPPhxtjzmDbVWCkPLfu.ZDfzlGKK6kOc0DOXc0fD/n6nuAEd1G', 'student', 'cwts', 'BSMM', 1, 'B', 1, NULL, NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(21, 'STU-0021', 'Rogelio', 'Flores', 'Gonzalez', 'student21@nstp.edu', NULL, '09174328587', '2026-09-02 09:12:29', '$2y$12$XnIFaiTx9la2F7CL0T.cu.mYSjjkMMKO5paVtjKuxHPa/H.0S/VeG', 'student', 'rotc', 'BSCE', 4, 'C', 1, NULL, NULL, '2026-09-02 09:12:29', '2026-09-02 09:12:29'),
(22, 'STU-0022', 'Luz', 'Castro', 'Delgado', 'student22@nstp.edu', NULL, '09177458415', '2026-09-02 09:12:30', '$2y$12$fKll53WCGroPgQuCsGTmJ.g.C5bZWV1S1W32nbzb8C./rEbC9vUC.', 'student', 'cwts', 'BEED', 2, 'E', 1, NULL, NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(23, 'STU-0023', 'Juan', 'Delgado', 'Morales', 'student23@nstp.edu', NULL, '09177591794', '2026-09-02 09:12:30', '$2y$12$3bwBmR5ZsV5.LntkprZwyuK8xpAQ8DVyYOCQ9X8A1e61bp9YlId6.', 'student', 'cwts', 'BSIS', 4, 'C', 1, NULL, NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(24, 'STU-0024', 'Patricia', 'Vega', 'Lopez', 'student24@nstp.edu', NULL, '09179425136', '2026-09-02 09:12:30', '$2y$12$JSYubYO0XFqmW4N4lMLZDewyyoKWk02Ciwd7g7ABhRuPNAKy5C3cy', 'student', 'rotc', 'BSEd', 3, 'A', 1, NULL, NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(25, 'STU-0025', 'Luz', 'Vega', NULL, 'student25@nstp.edu', NULL, '09177936652', '2026-09-02 09:12:30', '$2y$12$WIc5fhEANV2Hbln/Hw3uru6Cz.PsfMcfDtHad5ZtWL7q3HzsJFp7.', 'student', 'lts', 'BSFM', 2, 'A', 1, NULL, NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(26, 'STU-0026', 'Enrique', 'Garcia', NULL, 'student26@nstp.edu', NULL, '09177019893', '2026-09-02 09:12:30', '$2y$12$0MHFCMIui0tKaUMQu5gywO2XIqvnbscHScnqY5xHKiwODkvXpEr52', 'student', 'lts', 'BSIT', 1, 'A', 1, NULL, NULL, '2026-09-02 09:12:30', '2026-09-02 09:12:30'),
(27, 'STU-0027', 'Lourdes', 'Diaz', NULL, 'student27@nstp.edu', NULL, '09179805060', '2026-09-02 09:12:31', '$2y$12$V/v9PiYlldW9ixnINjyYPOScXqKny/FTQc33iABFf7vAulz9gn67W', 'student', 'rotc', 'BSMM', 1, 'B', 1, NULL, NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(28, 'STU-0028', 'Carmen', 'Rodriguez', NULL, 'student28@nstp.edu', NULL, '09178696331', '2026-09-02 09:12:31', '$2y$12$0E5ILemjHn0sap815zm28uifJfoSEH3QhqLxaipelbDOTW40MbCRS', 'student', 'rotc', 'BSMath', 1, 'A', 1, NULL, NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(29, 'STU-0029', 'Ricardo', 'Rojas', 'Ramos', 'student29@nstp.edu', NULL, '09171831037', '2026-09-02 09:12:31', '$2y$12$DSnmE1mUahb.HoI2v8eAA.Cy.9l7JzcIDtf49H9H7S1Wo2N7Fgdam', 'student', 'lts', 'BSEd', 4, 'A', 1, NULL, NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(30, 'STU-0030', 'Carlos', 'Lopez', NULL, 'student30@nstp.edu', NULL, '09171285000', '2026-09-02 09:12:31', '$2y$12$R0OclHLowvy1YuEXjK5Fm.CJJwOgNMr61eS.GoPuiEEj2Q.BOEwje', 'student', 'cwts', 'BSMM', 1, 'A', 1, NULL, NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(31, 'STU-0031', 'Javier', 'Santos', 'Rodriguez', 'student31@nstp.edu', NULL, '09175697991', '2026-09-02 09:12:31', '$2y$12$iGz9rnPxoRQ83ge62Io0yev5uwP8I/100uAgMS8IuSb2kEiqNtwaO', 'student', 'rotc', 'BEED', 3, 'D', 1, NULL, NULL, '2026-09-02 09:12:31', '2026-09-02 09:12:31'),
(32, 'STU-0032', 'Jose', 'Flores', 'Aquino', 'student32@nstp.edu', NULL, '09174165860', '2026-09-02 09:12:32', '$2y$12$D.wSVq24WeVkFAxugLCVeOkFYtQVXxqRQ1IepicWC/sFbkrhJiWsa', 'student', 'cwts', 'BSCS', 3, 'D', 1, NULL, NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(33, 'STU-0033', 'Teresa', 'Romero', 'Vega', 'student33@nstp.edu', NULL, '09173119581', '2026-09-02 09:12:32', '$2y$12$1d6ChltF7O4Q9pJ3GUn.SOSReFlgMbZPv/eWzADf9ndrjqyaRvlKe', 'student', 'cwts', 'BSCE', 3, 'C', 1, NULL, NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(34, 'STU-0034', 'Gloria', 'Rojas', NULL, 'student34@nstp.edu', NULL, '09178212678', '2026-09-02 09:12:32', '$2y$12$XDlUyJNk8ayKN6Jfk2vthui6YIloE6Y3B12QjF/Num3GhXLpOT2b2', 'student', 'cwts', 'BEED', 3, 'C', 1, NULL, NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(35, 'STU-0035', 'Patricia', 'Garcia', NULL, 'student35@nstp.edu', NULL, '09173749669', '2026-09-02 09:12:32', '$2y$12$.LSHA/qgGU/ERlsAVf71r.C8lTlkV/du3xdQ7k728qPtfSKYpDigK', 'student', 'rotc', 'BSCS', 1, 'B', 1, NULL, NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(36, 'STU-0036', 'Ramon', 'Vega', 'Martinez', 'student36@nstp.edu', NULL, '09174946864', '2026-09-02 09:12:32', '$2y$12$j10lJi9Dd2iF.69qQglOeOVxfLTaSf24GptgitTsc5HJDfoHWevV.', 'student', 'cwts', 'BEED', 3, 'D', 1, NULL, NULL, '2026-09-02 09:12:32', '2026-09-02 09:12:32'),
(37, 'STU-0037', 'Maria', 'Ortiz', 'Rojas', 'student37@nstp.edu', NULL, '09171721739', '2026-09-02 09:12:33', '$2y$12$AytSUz8QjW5PCr0veV4/KuGq7pKojy0l.SYj55MdoKHif2qCQA8AC', 'student', 'cwts', 'BSA', 4, 'C', 1, NULL, NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(38, 'STU-0038', 'Beatriz', 'Lopez', 'Rojas', 'student38@nstp.edu', NULL, '09178979452', '2026-09-02 09:12:33', '$2y$12$bWShSxlEu/VtBbgdQJQ4.u7J0eG5PtNCZT8b7xCKoLGaLt/zilwpe', 'student', 'cwts', 'BSMM', 3, 'B', 1, NULL, NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(39, 'STU-0039', 'Gloria', 'Cruz', 'Cruz', 'student39@nstp.edu', NULL, '09176441016', '2026-09-02 09:12:33', '$2y$12$VxhCiwdT84rjjOTQpdjbBu.kv.MFQP3cyBFutQxpHGhStaANv8tka', 'student', 'rotc', 'BSIS', 1, 'A', 1, NULL, NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(40, 'STU-0040', 'Lourdes', 'Rivera', NULL, 'student40@nstp.edu', NULL, '09174728255', '2026-09-02 09:12:33', '$2y$12$wdC7dZFpk2om8GODYD/ZWOol/C8Q.B5ESn3tFTjW0w0OenZ5xfjgu', 'student', 'rotc', 'BSMath', 2, 'B', 1, NULL, NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(41, 'STU-0041', 'Manuel', 'Garcia', 'Cruz', 'student41@nstp.edu', NULL, '09179160649', '2026-09-02 09:12:33', '$2y$12$PJoL9/gZDXORChdKoisVW.z5xCaGdsxExxzu9ZEcZALTbU/Wvcxsy', 'student', 'cwts', 'BSA', 3, 'B', 1, NULL, NULL, '2026-09-02 09:12:33', '2026-09-02 09:12:33'),
(42, 'STU-0042', 'Antonio', 'Fernandez', 'Delgado', 'student42@nstp.edu', NULL, '09175655517', '2026-09-02 09:12:34', '$2y$12$jF/GT.TAMI/b1hyPPg.Qpu2ejt8hvyUo6nQsifbfibfUX6NWmZ.a2', 'student', 'lts', 'BSMM', 4, 'E', 1, NULL, NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(43, 'STU-0043', 'Gloria', 'Diaz', 'Ortiz', 'student43@nstp.edu', NULL, '09175596805', '2026-09-02 09:12:34', '$2y$12$V/Rkpb98Z.jGwX4DbrxV5eeY.ugiBU2TrPvJkF301CaDiy.pERbw6', 'student', 'rotc', 'BSMath', 2, 'C', 1, NULL, NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(44, 'STU-0044', 'Juan', 'Rojas', NULL, 'student44@nstp.edu', NULL, '09177945987', '2026-09-02 09:12:34', '$2y$12$Qf.2whtvGI7fVFccybZK5O2SOcQaUjDHnABVz0jOTIUQYHCwtUuVS', 'student', 'rotc', 'BSFM', 2, 'B', 1, NULL, NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(45, 'STU-0045', 'Juan', 'Fernandez', NULL, 'student45@nstp.edu', NULL, '09177418183', '2026-09-02 09:12:34', '$2y$12$g/dqBZ5eK1MRzqE0YBlDVutNWti7n1iaCggi7TtObJukXqQrHBBjq', 'student', 'cwts', 'BSCS', 4, 'A', 1, NULL, NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(46, 'STU-0046', 'Maria', 'Mendoza', NULL, 'student46@nstp.edu', NULL, '09178093358', '2026-09-02 09:12:34', '$2y$12$Wvejse53gp0mvm0ZlRsXrOrg55TgzWVsmR3Fh8l8oSp/7hm2svm5a', 'student', 'lts', 'BSIT', 4, 'E', 1, NULL, NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(47, 'STU-0047', 'Pedro', 'Aquino', NULL, 'student47@nstp.edu', NULL, '09176338099', '2026-09-02 09:12:34', '$2y$12$nv/uSLP0boPglpVXTwU.Vu98STlXPm3MRa./iKMWGj6Q2BTRJzf8S', 'student', 'lts', 'BSA', 1, 'A', 1, NULL, NULL, '2026-09-02 09:12:34', '2026-09-02 09:12:34'),
(48, 'STU-0048', 'Domingo', 'Castillo', NULL, 'student48@nstp.edu', NULL, '09178517686', '2026-09-02 09:12:35', '$2y$12$gCc3ax981ksQ4gavzxnlleLSN817LJqM3.0UO5od63qYLtDqz3Vy6', 'student', 'rotc', 'BSN', 3, 'A', 1, NULL, NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(49, 'STU-0049', 'Nena', 'Vega', NULL, 'student49@nstp.edu', NULL, '09178717443', '2026-09-02 09:12:35', '$2y$12$v71nnn9YLQwAWqQV8z7pNOnfi0m3bXoCQscs/WbIxo4VI9Idd5nGy', 'student', 'cwts', 'BSFM', 1, 'B', 1, NULL, NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(50, 'STU-0050', 'Isabella', 'Mendoza', NULL, 'student50@nstp.edu', NULL, '09177923270', '2026-09-02 09:12:35', '$2y$12$UQy3fSuMGnLa8We3h0afauS3uGzGJRiaBlloU/I6Txo2gxysan3wS', 'student', 'cwts', 'BSCS', 2, 'D', 1, NULL, NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(51, 'STU-0051', 'Ramon', 'Perez', 'Cruz', 'student51@nstp.edu', NULL, '09174797416', '2026-09-02 09:12:35', '$2y$12$YqYrOOjAHpZydWeSTSTY3uBtlxhnfngkZd1NN5Ga2t76ojtsN46WC', 'student', 'rotc', 'BSIS', 3, 'C', 1, NULL, NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(52, 'STU-0052', 'Isabella', 'Santos', NULL, 'student52@nstp.edu', NULL, '09177728500', '2026-09-02 09:12:35', '$2y$12$qpKrkbiXLj4lQJp619upVeLt3mt4eBqa8SqzbCWpkxumg/49aDQkW', 'student', 'lts', 'BSBA', 1, 'C', 1, NULL, NULL, '2026-09-02 09:12:35', '2026-09-02 09:12:35'),
(53, 'STU-0053', 'Rogelio', 'Lopez', 'Molina', 'student53@nstp.edu', NULL, '09174778776', '2026-09-02 09:12:36', '$2y$12$yVisBYBXYLAa/DeKZnsUP.ccybdPmb8pKybpvuQgi8nbr0QDTOK8C', 'student', 'cwts', 'BSMath', 3, 'E', 1, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(54, 'STU-0054', 'Rogelio', 'Morales', 'Cruz', 'student54@nstp.edu', NULL, '09172239496', '2026-09-02 09:12:36', '$2y$12$Fi5DzLWTT60KTiHwMp8KS.5oyIH65PZDC/.p4RwFTsJDHP9GbBJTi', 'student', 'rotc', 'BSEd', 3, 'E', 1, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36'),
(55, 'STU-0055', 'Ana', 'Garcia', 'Vega', 'student55@nstp.edu', NULL, '09179860136', '2026-09-02 09:12:36', '$2y$12$wTdINRiG6pq/8zJ.HdZ6G.lvX3YECs2uMx4iXM6XeQ.3VklVUCyYi', 'student', 'lts', 'BSMath', 1, 'D', 1, NULL, NULL, '2026-09-02 09:12:36', '2026-09-02 09:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `year_level_progressions`
--

CREATE TABLE `year_level_progressions` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `from_year_level` int NOT NULL,
  `to_year_level` int NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`),
  ADD KEY `academic_years_academic_year_index` (`academic_year`),
  ADD KEY `academic_years_is_current_index` (`is_current`);

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activities_created_by_foreign` (`created_by`),
  ADD KEY `activities_component_type_index` (`component_type`),
  ADD KEY `activities_status_index` (`status`);

--
-- Indexes for table `activity_feedback`
--
ALTER TABLE `activity_feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `activity_feedback_activity_id_student_id_unique` (`activity_id`,`student_id`),
  ADD KEY `activity_feedback_student_id_foreign` (`student_id`);

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_user_id_index` (`user_id`),
  ADD KEY `activity_logs_action_index` (`action`),
  ADD KEY `activity_logs_module_index` (`module`);

--
-- Indexes for table `activity_participations`
--
ALTER TABLE `activity_participations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `activity_participations_activity_id_student_id_unique` (`activity_id`,`student_id`),
  ADD KEY `activity_participations_student_id_foreign` (`student_id`),
  ADD KEY `activity_participations_attendance_status_index` (`attendance_status`);

--
-- Indexes for table `activity_registrations`
--
ALTER TABLE `activity_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `activity_registrations_activity_id_student_id_unique` (`activity_id`,`student_id`),
  ADD KEY `activity_registrations_student_id_foreign` (`student_id`),
  ADD KEY `activity_registrations_status_index` (`status`);

--
-- Indexes for table `admin_action_logs`
--
ALTER TABLE `admin_action_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_action_logs_admin_id_index` (`admin_id`),
  ADD KEY `admin_action_logs_action_type_index` (`action_type`),
  ADD KEY `admin_action_logs_module_index` (`module`);

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendance_logs_session_id_student_id_unique` (`session_id`,`student_id`),
  ADD KEY `attendance_logs_session_id_index` (`session_id`),
  ADD KEY `attendance_logs_student_id_index` (`student_id`),
  ADD KEY `attendance_logs_status_index` (`status`),
  ADD KEY `attendance_logs_check_in_at_index` (`check_in_at`);

--
-- Indexes for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendance_sessions_session_code_unique` (`session_code`),
  ADD KEY `attendance_sessions_session_code_index` (`session_code`),
  ADD KEY `attendance_sessions_status_index` (`status`),
  ADD KEY `attendance_sessions_component_index` (`component`),
  ADD KEY `attendance_sessions_start_time_index` (`start_time`),
  ADD KEY `attendance_sessions_scheduled_start_index` (`scheduled_start`),
  ADD KEY `attendance_sessions_scheduled_end_index` (`scheduled_end`),
  ADD KEY `attendance_sessions_faculty_id_index` (`faculty_id`),
  ADD KEY `attendance_sessions_is_scheduled_index` (`is_scheduled`),
  ADD KEY `attendance_sessions_require_location_index` (`require_location`),
  ADD KEY `attendance_sessions_latitude_longitude_index` (`latitude`,`longitude`);

--
-- Indexes for table `batch_certificates`
--
ALTER TABLE `batch_certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_certificates_generated_by_foreign` (`generated_by`),
  ADD KEY `batch_certificates_school_year_index` (`school_year`),
  ADD KEY `batch_certificates_status_index` (`status`);

--
-- Indexes for table `bulletin_board`
--
ALTER TABLE `bulletin_board`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bulletin_board_created_by_foreign` (`created_by`),
  ADD KEY `bulletin_board_category_index` (`category`),
  ADD KEY `bulletin_board_is_featured_index` (`is_featured`),
  ADD KEY `bulletin_board_display_from_index` (`display_from`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `certificates_certificate_number_unique` (`certificate_number`),
  ADD KEY `certificates_student_id_foreign` (`student_id`),
  ADD KEY `certificates_activity_id_foreign` (`activity_id`),
  ADD KEY `certificates_issued_by_foreign` (`issued_by`),
  ADD KEY `certificates_certificate_number_index` (`certificate_number`),
  ADD KEY `certificates_status_index` (`status`);

--
-- Indexes for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `certificate_templates_created_by_foreign` (`created_by`),
  ADD KEY `certificate_templates_type_index` (`type`),
  ADD KEY `certificate_templates_is_active_index` (`is_active`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `classes_join_code_unique` (`join_code`),
  ADD KEY `classes_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `class_students`
--
ALTER TABLE `class_students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_students_class_id_student_id_unique` (`class_id`,`student_id`),
  ADD KEY `class_students_student_id_foreign` (`student_id`);

--
-- Indexes for table `communication_dashboard`
--
ALTER TABLE `communication_dashboard`
  ADD PRIMARY KEY (`id`),
  ADD KEY `communication_dashboard_created_by_foreign` (`created_by`),
  ADD KEY `communication_dashboard_priority_index` (`priority`),
  ADD KEY `communication_dashboard_is_visible_index` (`is_visible`);

--
-- Indexes for table `component_change_requests`
--
ALTER TABLE `component_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `component_change_requests_student_id_foreign` (`student_id`),
  ADD KEY `component_change_requests_approved_by_foreign` (`approved_by`),
  ADD KEY `component_change_requests_status_index` (`status`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_student_id_foreign` (`student_id`),
  ADD KEY `documents_verified_by_foreign` (`verified_by`),
  ADD KEY `documents_status_index` (`status`),
  ADD KEY `documents_document_type_index` (`document_type`);

--
-- Indexes for table `eligibility_monitoring`
--
ALTER TABLE `eligibility_monitoring`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `eligibility_monitoring_student_id_unique` (`student_id`),
  ADD KEY `eligibility_monitoring_checked_by_foreign` (`checked_by`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `graduation_batches`
--
ALTER TABLE `graduation_batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `graduation_batches_academic_year_index` (`academic_year`),
  ADD KEY `graduation_batches_status_index` (`status`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `learning_materials`
--
ALTER TABLE `learning_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `learning_materials_class_id_foreign` (`class_id`),
  ADD KEY `learning_materials_created_by_foreign` (`created_by`);

--
-- Indexes for table `memos`
--
ALTER TABLE `memos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `memos_created_by_foreign` (`created_by`),
  ADD KEY `memos_status_index` (`status`),
  ADD KEY `memos_target_audience_index` (`target_audience`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_index` (`user_id`),
  ADD KEY `notifications_is_read_index` (`is_read`);

--
-- Indexes for table `nstp_component_selections`
--
ALTER TABLE `nstp_component_selections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nstp_component_selections_student_id_foreign` (`student_id`),
  ADD KEY `nstp_component_selections_approved_by_foreign` (`approved_by`),
  ADD KEY `nstp_component_selections_status_index` (`status`),
  ADD KEY `nstp_component_selections_component_type_index` (`component_type`);

--
-- Indexes for table `ocr_texts`
--
ALTER TABLE `ocr_texts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ocr_texts_document_id_index` (`document_id`),
  ADD KEY `ocr_texts_document_type_index` (`document_type`),
  ADD KEY `ocr_texts_created_at_index` (`created_at`);

--
-- Indexes for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `password_reset_otps_email_index` (`email`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reports_generated_by_foreign` (`generated_by`),
  ADD KEY `reports_report_type_index` (`report_type`),
  ADD KEY `reports_status_index` (`status`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key_unique` (`key`),
  ADD KEY `settings_key_index` (`key`);

--
-- Indexes for table `sis_integration`
--
ALTER TABLE `sis_integration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sis_integration_sis_student_id_unique` (`sis_student_id`),
  ADD KEY `sis_integration_student_id_foreign` (`student_id`),
  ADD KEY `sis_integration_sis_student_id_index` (`sis_student_id`),
  ADD KEY `sis_integration_sync_status_index` (`sync_status`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_student_id_unique` (`student_id`),
  ADD KEY `students_user_id_foreign` (`user_id`),
  ADD KEY `students_student_id_index` (`student_id`),
  ADD KEY `students_completion_status_index` (`completion_status`),
  ADD KEY `students_training_grade_percentage_index` (`training_grade_percentage`),
  ADD KEY `students_grade_updated_at_index` (`grade_updated_at`);

--
-- Indexes for table `student_locations`
--
ALTER TABLE `student_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_locations_activity_id_foreign` (`activity_id`),
  ADD KEY `student_locations_student_id_activity_id_index` (`student_id`,`activity_id`),
  ADD KEY `student_locations_tracked_at_index` (`tracked_at`),
  ADD KEY `student_locations_is_within_geofence_index` (`is_within_geofence`);

--
-- Indexes for table `system_backups`
--
ALTER TABLE `system_backups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_backups_created_by_foreign` (`created_by`),
  ADD KEY `system_backups_status_index` (`status`);

--
-- Indexes for table `training_hours_logs`
--
ALTER TABLE `training_hours_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `training_hours_logs_activity_id_foreign` (`activity_id`),
  ADD KEY `training_hours_logs_verified_by_foreign` (`verified_by`),
  ADD KEY `training_hours_logs_student_id_index` (`student_id`),
  ADD KEY `training_hours_logs_date_logged_index` (`date_logged`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_student_id_unique` (`student_id`),
  ADD UNIQUE KEY `users_contact_number_unique` (`contact_number`),
  ADD KEY `users_contact_number_index` (`contact_number`);

--
-- Indexes for table `year_level_progressions`
--
ALTER TABLE `year_level_progressions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `year_level_progressions_student_id_foreign` (`student_id`),
  ADD KEY `year_level_progressions_approved_by_foreign` (`approved_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `activity_feedback`
--
ALTER TABLE `activity_feedback`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_participations`
--
ALTER TABLE `activity_participations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `activity_registrations`
--
ALTER TABLE `activity_registrations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_action_logs`
--
ALTER TABLE `admin_action_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `batch_certificates`
--
ALTER TABLE `batch_certificates`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bulletin_board`
--
ALTER TABLE `bulletin_board`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `class_students`
--
ALTER TABLE `class_students`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `communication_dashboard`
--
ALTER TABLE `communication_dashboard`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `component_change_requests`
--
ALTER TABLE `component_change_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `eligibility_monitoring`
--
ALTER TABLE `eligibility_monitoring`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `graduation_batches`
--
ALTER TABLE `graduation_batches`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `learning_materials`
--
ALTER TABLE `learning_materials`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `memos`
--
ALTER TABLE `memos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `nstp_component_selections`
--
ALTER TABLE `nstp_component_selections`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ocr_texts`
--
ALTER TABLE `ocr_texts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sis_integration`
--
ALTER TABLE `sis_integration`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `student_locations`
--
ALTER TABLE `student_locations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_backups`
--
ALTER TABLE `system_backups`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `training_hours_logs`
--
ALTER TABLE `training_hours_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `year_level_progressions`
--
ALTER TABLE `year_level_progressions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_feedback`
--
ALTER TABLE `activity_feedback`
  ADD CONSTRAINT `activity_feedback_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_feedback_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_participations`
--
ALTER TABLE `activity_participations`
  ADD CONSTRAINT `activity_participations_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_participations_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_registrations`
--
ALTER TABLE `activity_registrations`
  ADD CONSTRAINT `activity_registrations_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_registrations_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_action_logs`
--
ALTER TABLE `admin_action_logs`
  ADD CONSTRAINT `admin_action_logs_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD CONSTRAINT `attendance_logs_session_id_foreign` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_logs_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD CONSTRAINT `attendance_sessions_faculty_id_foreign` FOREIGN KEY (`faculty_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `batch_certificates`
--
ALTER TABLE `batch_certificates`
  ADD CONSTRAINT `batch_certificates_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bulletin_board`
--
ALTER TABLE `bulletin_board`
  ADD CONSTRAINT `bulletin_board_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `certificates_issued_by_foreign` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `certificates_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  ADD CONSTRAINT `certificate_templates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `class_students`
--
ALTER TABLE `class_students`
  ADD CONSTRAINT `class_students_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_students_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `communication_dashboard`
--
ALTER TABLE `communication_dashboard`
  ADD CONSTRAINT `communication_dashboard_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `component_change_requests`
--
ALTER TABLE `component_change_requests`
  ADD CONSTRAINT `component_change_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `component_change_requests_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `eligibility_monitoring`
--
ALTER TABLE `eligibility_monitoring`
  ADD CONSTRAINT `eligibility_monitoring_checked_by_foreign` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `eligibility_monitoring_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `learning_materials`
--
ALTER TABLE `learning_materials`
  ADD CONSTRAINT `learning_materials_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `learning_materials_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `memos`
--
ALTER TABLE `memos`
  ADD CONSTRAINT `memos_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nstp_component_selections`
--
ALTER TABLE `nstp_component_selections`
  ADD CONSTRAINT `nstp_component_selections_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `nstp_component_selections_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sis_integration`
--
ALTER TABLE `sis_integration`
  ADD CONSTRAINT `sis_integration_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_locations`
--
ALTER TABLE `student_locations`
  ADD CONSTRAINT `student_locations_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_locations_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_backups`
--
ALTER TABLE `system_backups`
  ADD CONSTRAINT `system_backups_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `training_hours_logs`
--
ALTER TABLE `training_hours_logs`
  ADD CONSTRAINT `training_hours_logs_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `training_hours_logs_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `training_hours_logs_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `year_level_progressions`
--
ALTER TABLE `year_level_progressions`
  ADD CONSTRAINT `year_level_progressions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `year_level_progressions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
