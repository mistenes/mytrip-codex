-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 11, 2026 at 08:21 AM
-- Server version: 8.0.44
-- PHP Version: 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mistenes_mytrip`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `user_id` int NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb3_unicode_ci NOT NULL,
  `device_info` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `auth_tokens`
--

INSERT INTO `auth_tokens` (`user_id`, `token_hash`, `device_info`, `expires_at`, `created_at`) VALUES
(2, '00114fef56c45deb0d9fe63ad75563f9880356fa92a4430de495d973c0270046', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-29 15:27:44', '2025-02-27 16:27:44'),
(20, '005cdfe3623152436e0d1a8124abf26ac090511f186b3ddc165317f380529e4a', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-02-19 07:57:42', '2025-01-20 08:57:42'),
(21, '00b8c86f3ef05fd9b2e5dd29e554b2ebb026725543326d25a742cdb1f24cf2e4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-03 20:33:23', '2025-06-03 22:33:23'),
(21, '0186492db255334de898ec5375841a45b65d1a7a9b1b1985f9e09be20774a762', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-04-08 07:46:01', '2025-03-09 08:46:01'),
(22, '02c9a597c1a9572501c1623dd3047e8204226ad851df2032c89eb9dc5ba50f9b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-18 20:31:14', '2025-07-19 22:31:14'),
(2, '032720b50228a885a490872ccf00fda14b754989a1549914c71b10d9af6081cc', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-14 02:32:40', '2025-03-15 03:32:40'),
(2, '04cd026032f96fe85e7be2a7ed4809a1018fede29037fc1b0ce5c6a19f905579', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-07-16 11:56:49', '2025-06-16 13:56:49'),
(20, '06ac2f525a25f11a8078f4332a56da962109166308215e699e53c2f36eaef1a4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-08 09:51:14', '2025-02-06 10:51:14'),
(2, '06bc8b360c0634f05945af6abae352d14380c7a9e26deb3ededf0c6857662b21', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-02 08:11:45', '2025-03-03 09:11:45'),
(9, '099edfdfe421c86161aca68b1d30c279418d0bf66253fdbfd8c38be2eed56c62', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-08 19:50:11', '2024-12-09 20:50:11'),
(20, '0b4969850df8c370448f46ecc68d194dc03c2c7d93305b5fedab8c0275eb328f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-02 08:38:55', '2025-03-03 09:38:55'),
(9, '0b589f545b967a84d0e9250016dfd486af3c45e1f9de675789eba0452cc5e69c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-03 22:17:49', '2024-12-04 23:17:49'),
(2, '0c121ae844a9f4e0928f0ef13e67b94538bd41c563eadeb40ff1184379602652', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-05-11 06:24:06', '2025-04-11 08:24:06'),
(9, '0c1af1731d393db119b5be6a2696d300daf062464d359864e6077fa6de8a7e9a', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-05 10:37:37', '2024-12-06 11:37:37'),
(2, '0cf8022ffd55838aafc52804af54506acfdf00f90900922133d2f34fb92ae359', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-06 03:53:51', '2025-03-07 04:53:51'),
(9, '0e1c0d0394c2a78850b83c3b328cbd5f9db2df5261d2f6939c41f7820012c1f4', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-01 22:24:08', '2024-12-02 23:24:08'),
(21, '0ee76f3f0e34113772f4b151b1f6f53a7efb8a23909fbb0d115eb0f4d4f7890a', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-04-17 13:18:12', '2025-03-18 14:18:12'),
(2, '0f8677d5c67a40d7b4fd2e5e3953c47b1bd3bae3fd988a267971d93ff2a05c6a', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-09-30 16:21:39', '2025-08-31 18:21:39'),
(21, '11111dc5c45ddaaeec792369898832ae6b3f87366023a253e41688cd340f1618', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-03-30 19:39:59', '2025-02-28 20:39:59'),
(22, '11c000e3ab2190036e79ccc92581bc0e6ed7d4e7b55c4aaa5872905ec26badd4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-21 14:39:19', '2025-08-22 16:39:19'),
(2, '135788b6c606ee593e186a379158e691785ee9aff59fb4c4699ea5900b748fc7', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-27 22:02:48', '2025-02-25 23:02:48'),
(2, '135b246d5ef0172c60646b706ef6f4742fce229560f87c28fb98167ee54ebf63', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Safari/605.1.15', '2025-07-23 10:12:46', '2025-06-23 12:12:46'),
(21, '1383cb09e52505eb8530e5e7bbe72fe0025e05bbc5e866874650628f1eb439f2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-02 18:39:39', '2025-06-02 20:39:39'),
(20, '139e223be1fc303ea365f52f6fd9f871b54cfdc5d383133d30d91bb347eda55a', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-10 09:50:28', '2025-02-08 10:50:28'),
(9, '1548e7d43902bb4806f49f4413efd5db44dfe4cf07cc0e94052067a708d7105e', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-14 11:35:57', '2025-03-15 12:35:57'),
(20, '15ab8d1cbebda2fa77c4c942a06f9fd60f970d53e3247a985a45699eb0135637', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-08 07:25:44', '2025-03-09 08:25:44'),
(2, '15f104937c3358ad1dcceb90e51e0a20bd5823f520ba975399104878bdf8c7ca', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Safari/605.1.15', '2025-01-04 19:14:17', '2024-12-05 20:14:17'),
(9, '1916dd56247b6b3c8d9ffbfd2a73abf753d4f5701ff2eb9496dc5759f460304f', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-09 20:24:27', '2024-12-10 21:24:27'),
(20, '1cd0cff490f5ae250a1800511b9343df34d3c2ed515491ac4a262b80c9e75ce7', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-16 10:06:35', '2025-03-17 11:06:35'),
(20, '1d15cdb3343681b50dcec9bc58bbcc1f2a595b6150ef64b4186d2c9bc7eddd92', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-06 08:12:19', '2025-02-04 09:12:19'),
(2, '1f5356c2939121c5647b016b83ce761f4852ed8fc5eb7419a8b0c489bdc77050', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-16 19:29:01', '2024-12-17 20:29:01'),
(2, '235ddf46c7533d231cf356b5bb3c4a294ca0ba39345bb37c07332cea3445e131', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-03-26 11:55:02', '2025-02-24 12:55:02'),
(20, '24328be8bd13a561eb99c1830a79d68a6a41c280f4ae88aca8201291dee27d80', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-10 10:12:41', '2025-03-11 11:12:41'),
(22, '2453beb5a9b7108c2ec334a6a601fb69f2f1f7be9bd7303f5808268012b8a467', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-10-01 04:32:58', '2025-09-01 06:32:58'),
(2, '25f7d1845a22b0c91d81875dbebd8042a2f1bf924a8ca42fc2c25643ac7cf3d6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-17 09:11:23', '2024-12-18 10:11:23'),
(20, '26e3a94dffba98aab5932c4402bc3964fb8f4996f790084338571651593e9d28', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-17 08:37:36', '2025-03-18 09:37:36'),
(2, '2821ca47da4f31de28170717a68547aef81345a40813d54b9b1b80e1efa26362', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-08 04:44:00', '2025-03-09 05:44:00'),
(2, '289a617f9400603d9bc5c14ddf2747e9a5b939415343a6c761d79d3db1bf232d', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-05 10:26:43', '2024-12-06 11:26:43'),
(21, '2c5da7aa824d7b1d768cdec822a93813bfc98b19ba4f660ebc02fe031780b129', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-14 15:28:36', '2025-06-14 17:28:36'),
(9, '2e239c09134f6cbc93dc61f191b30b2d0381a37137d1caca6093ab86a65e899b', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-09 18:47:38', '2024-12-10 19:47:38'),
(20, '2ed86af71e36998426534846da7cc13b64539ac87e3ca9cabf1152286b9abed4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-08 22:00:49', '2025-03-09 23:00:49'),
(2, '2f2b2732d06fbc39a7eb39866a968bdbad671091144125e573b70525785285c3', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-20 22:03:58', '2025-02-18 23:03:58'),
(20, '2fadb40b98edcdca58c3a84b356e97d38892865eaa1aa6bea039d10e1b60df4a', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-15 01:44:25', '2025-03-16 02:44:25'),
(2, '320e6c226768af62a9cf0fd44ef52b3f405c4f1eef1ce6f3bae8904e21607cc1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-03-21 16:50:31', '2025-02-19 17:50:31'),
(2, '34579bee68ca8e81d9296125a3e2f50b1fda044c5529a7d330f985a3467439bc', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-09 11:26:58', '2025-03-10 12:26:58'),
(21, '356366e8e0c941070216234a7aa3aaf2be2fa9e1fbdb294f01a8e0a864982918', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-03-26 18:25:24', '2025-02-24 19:25:24'),
(20, '3638a323ec0b76cb454ed049e57dbccb79c6b0abaf22de3ff5ab1b3a418973e6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-06 17:54:28', '2025-03-07 18:54:28'),
(2, '374112d38953f5baf3f0cf62f9c7fe0b061901566fb2f00da49d6012bcf7f313', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-07-31 13:00:52', '2025-07-01 15:00:52'),
(2, '3774d70659c60e3236912a90c841066b07146fa2515b7dbe92c347a10c1a2fba', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-17 07:43:18', '2025-03-18 08:43:18'),
(20, '38bead487b5d58e6524291ccf0fe63e3e41944478e831440acd0a1711d600cb5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-05 07:32:43', '2025-03-06 08:32:43'),
(19, '3a7748810fa528b3092680e511068df6bf2659fb0c13738bc0fdfcaee21c5d37', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1', '2025-01-16 18:30:39', '2024-12-17 19:30:39'),
(2, '3b25e4a83170503ece8df183a8a6a4b8ceab1d22635bf7754697a215e8f99839', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '2025-03-26 19:38:38', '2025-02-24 20:38:38'),
(2, '3c603b074b8409256ba9657b2b25c1eddbd704789e83893a1bbd26a038f8309c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-03 22:39:40', '2024-12-04 23:39:40'),
(20, '41c0ddd787a1152960d1e91c81ac7b9db07f7c23aae0a5c72b34176aef16a931', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-07 21:15:55', '2025-03-08 22:15:55'),
(20, '41e3a4b7e04a73f0b8a4056901296af29651d7bbec80719f97ac1090e41e3ba4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-20 10:58:50', '2025-02-18 11:58:50'),
(20, '42c276fef54be40696e2631e86dccf3a53fb1f3b4b9c00727d72d2b4d6c1c49b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-12 14:00:36', '2025-03-13 15:00:36'),
(2, '45183a00f5f343c438a4243a002d818c0aa2e3027fcf66a572355c419c3ebd13', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-07-25 08:46:58', '2025-06-25 10:46:58'),
(2, '46a0430c4d2135ceb4bb62c382a9f5930706d77aa1f6bc6ababf9e2991ca39c0', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-03-31 17:29:46', '2025-03-01 18:29:46'),
(2, '46d8ae8a7db0e05264468242fb76f6851cd7944e403bf7c45fd619928e07a881', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-17 10:44:19', '2024-12-18 11:44:19'),
(20, '478800b349102e8e5bcb817b76d9af3c2bedab8d0b4d98ea8ee0436361856a56', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-18 16:04:19', '2024-12-19 17:04:19'),
(20, '47e4e5eeb273450e01ba85d26ad98ae055a319cde4d1d236175d0592f06d1a1a', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-12 13:24:28', '2025-03-13 14:24:28'),
(2, '48c861508cfeddd2aaf6e271e737aaba1179a60e2265ffe181b1ee055b4225e6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-07 11:51:02', '2025-03-08 12:51:02'),
(21, '4960f4660ffa2666e5433cd266426907721277749dec1ca0d9068dc3907cb302', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-16 17:48:44', '2025-07-17 19:48:44'),
(20, '4998f479809211bd260a434ed1ab99f01e2f74391a1652a23a2066af15b23630', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-11 11:46:36', '2025-03-12 12:46:36'),
(20, '4a50910b9cefb6c774b569a4def7ca8ed39738088fe161f78a394dde65bed20f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-14 13:33:10', '2025-03-15 14:33:10'),
(20, '4a587b189af4411eb3ef1dbbc0f2acaafef1b362e9976cbc3f4a4b36b4e47fa6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-14 08:32:36', '2025-02-12 09:32:36'),
(2, '4c05bb516d57adc81cc07fda0684b0e6eab740cf65f78cef6790cbec0475cd6b', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-09-27 15:40:51', '2025-08-28 17:40:51'),
(21, '4c980752960b7eb926bb54e810f8b2ef056b96b2c9b6907ef9746bf10843b432', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-23 17:05:25', '2025-08-24 19:05:25'),
(21, '4d30b1abe7203f0d25508b2f6d4888b034d90d32373779156f16bb0b70807fd9', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1', '2026-01-24 10:22:13', '2025-12-24 14:38:20'),
(2, '4f34861cbaebd33a2260d984275d9a7d036f9a809c9de6640567dc5c17e34b7d', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-01 20:52:22', '2024-12-02 21:52:22'),
(22, '4f84b2719097af919479a192ee3ab9a4bb0f52791c2f3a6ceca2e97cb9706347', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-08 18:43:15', '2025-07-09 20:43:15'),
(20, '508a5b4392199c2573ba0f18f56298f55c54270b90165e3e2a3fa1edc5d7a787', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-09 17:43:56', '2024-12-10 18:43:56'),
(20, '530942ad01330c8320eab51c8f411178889dbf71a6da2258e242b67e1228db34', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-10 20:25:39', '2025-02-08 21:25:39'),
(9, '531a8844747c97b293e4e058b24f7dd9a838e8ace00c3a91dbf50efce512df3e', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-02-08 13:29:25', '2025-01-09 14:29:25'),
(22, '532eaef986c4e937ad21ed85f0b82d49799172211721df8643a747fbb5d412dc', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1', '2025-03-26 09:15:33', '2025-02-24 10:15:33'),
(21, '55ae4ffc8b2e3be60a356dbef84544b8dbc06b2fd7fcb979a09a148e2d4ce78b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-04-11 00:32:06', '2025-03-12 01:32:06'),
(2, '55e4b03b388f519a49af28a8d549c922275e0e8d24ac2be2842f805a8821f9f1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-08-03 07:36:14', '2025-07-04 09:36:14'),
(22, '566dcc5faa192651f4be9d82b4e768bbc851a23eb8d7cc5f4790c06b2bf8bff4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1', '2025-05-09 14:46:23', '2025-04-09 16:46:23'),
(2, '58fdfff6cf8f22d03e441bac5eaca4f0e8104b74d19e87a6283b6aa8956ee104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Safari/605.1.15', '2025-03-27 18:01:52', '2025-02-25 19:01:52'),
(20, '593481b05de0c5906fbf936eaf444ec6e6037a647b54aec8aee7f965caa3712e', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-14 04:51:41', '2025-03-15 05:51:41'),
(9, '5a7a1d18288448b81128b1d9fe69ec3c2859a6744dda2afae022dce5ea31410f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1', '2025-01-13 15:48:59', '2024-12-14 16:26:38'),
(22, '5bb762e09511fd25b0b7906c7417e960cc1308e9a9a551bae4b168be2175c2d1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-06-20 16:34:06', '2025-05-21 18:34:06'),
(20, '5ca14b4f2c1715470c368bb066d9194f2177e4e09cf1eaffb368eb0a321c8a16', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-12 09:50:05', '2025-02-10 10:50:05'),
(2, '5d31026295e1b6aa1531aaec78f3d08d254271b7dccab26253e57f3ca2095a1c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-10 13:27:18', '2025-02-08 14:27:18'),
(20, '5d4a1f898cec3bea8b922950dd8f677de31b79cb28277a6d7cbb81c6dca25b4d', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-10 23:18:26', '2025-03-12 00:18:26'),
(21, '5dc2929605776842407df5304026008845934568ff76c10af7a107ab6867be33', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1', '2025-01-16 20:01:10', '2024-12-17 21:01:10'),
(22, '5df71cc1ea5df033f74e71d338c3bee41a477705df8206011c17d36032aa704c', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-10-03 13:36:02', '2025-09-03 15:36:02'),
(20, '5e678b25f07b17a72328d218bd20da52e6d3d7e47c3a671b96f932d74558d993', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-09 12:26:28', '2025-03-10 13:26:28'),
(2, '5ed6677e96b0a9e13b8e4f9103275cf789be0d499dc558c0b2d1b2b273b9c6be', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-03-27 16:57:40', '2025-02-25 17:57:40'),
(2, '5f945808c6ffc8bdb7d2c8ee5cc5689f200b9b6e161d82f253ff35ad8872fb5c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-06-04 18:30:30', '2025-05-05 20:30:30'),
(2, '606c6e6e5c49f8d6076d6df81cbc63900866624ffe4dc4d6b2ebd867eb81abcb', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-27 12:29:41', '2024-12-28 13:29:41'),
(2, '61493ea287a25c8800bc2a760f611913b35645c7943482d4fa547e972b7bd091', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-02-01 09:40:06', '2025-01-02 10:40:06'),
(21, '648fdae3f7ca0d1abcf179353b06c1099d40d38c8fbb1b051f46b8e36e9f855d', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-04-10 05:59:57', '2025-03-11 06:59:57'),
(9, '64b09617439255527ded7aa9dc8bc5528cb89257fcfcd26bcc60574e832f2778', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-05-16 18:06:05', '2025-04-16 20:06:05'),
(22, '664b5e676acd001e14bc3b04a1974b0c712505a2e86c653acf396a104f8b4f05', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-14 17:52:24', '2025-08-15 19:52:24'),
(2, '66cbbb06579d1c739d690ad7babdc7220fc0562b1e333d9784b9fe85ddd28640', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-22 07:35:16', '2025-02-20 08:35:16'),
(9, '66d91c1e14b8b58a0ad56ad90d66dda43d69c87b613a5f4fbfd2255920e45658', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-05 12:17:03', '2024-12-06 13:17:03'),
(2, '68698c6fc19fbdace972964d06427243fdcdb56fcdf09f866cc06cdbb19a16a1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-09-26 23:32:42', '2025-08-28 01:32:42'),
(19, '6c32fd6c6641a763ec7d7a612bf1abd7a7bf86cce57d9587eacfe7e19c2972ae', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-16 17:17:13', '2024-12-17 18:17:13'),
(21, '6c35fe3b06f2b938ed38cfbad065ce1349e95d507368baa7a80eb2af0a813e1c', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-17 05:41:02', '2025-07-18 07:41:02'),
(21, '6cc9cb402663c5cf6205006eaf3b0f1ad72f8527ed7fe99f52bbae314c64091f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1', '2025-02-01 18:43:16', '2025-01-02 19:43:16'),
(9, '6ef80b15c7e87da5ca90626232b48ee6dd4f5753035602b4d0cc3b68b0667d4b', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-17 07:33:04', '2024-12-18 08:33:04'),
(21, '6f4205b9dcb2fddb9ec75569020bf20b387cf6949421a7226fe9f732414ccf2b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-03-26 09:29:56', '2025-02-24 10:29:56'),
(2, '7144e457964246eccd2db8c50f7a5f7f636e813bb8b1e8aa0dcefacdd953864b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-06-08 10:00:59', '2025-05-09 12:00:59'),
(20, '73cd6914f0a3332b6fe540a65c9bd4ada82de75f46bade138814888bd53cb8d6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-16 20:02:21', '2025-03-17 21:02:21'),
(2, '73f946a3e8e5c910dff35ded6f2250c7b0dec65d3094175674f04fdf8b22269f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-13 06:05:21', '2025-03-14 07:05:21'),
(2, '751e46c077a7e3b7a095cbfa6edacb913b4453b0bbaa9ddf64d3c5c3cef2484d', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-05 20:27:26', '2024-12-06 21:27:26'),
(2, '752b0930111d0f804d91085d9bd3f923c68d0835c3e8406a0c97fbee871a73aa', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-05 12:26:43', '2024-12-06 13:26:43'),
(9, '75ab4a7b4a6388a91cead10faddd0ee19e4b824d3ca71abda22f759d1cf828e7', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1', '2025-01-02 07:54:39', '2024-12-03 08:54:39'),
(2, '75de6a90e35ae0642fc1444b502e291e166ca61b2f6e98000ad1fc1b8a6dbdb6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-08-09 06:18:46', '2025-07-10 08:18:46'),
(2, '76cf7f8b636ef1bb26fd09ba5c263657bebd5f4539f30e9294907a78fb8d4e92', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-01 13:30:16', '2025-07-02 15:30:16'),
(21, '7788c199cd5b1ee099b12ed06a0178d8f5478487a6770381dfaf5ddb1fcdd03c', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1', '2025-01-16 17:52:02', '2024-12-17 18:52:02'),
(9, '77a65757ca20d3a79a51da16cebf4470c8c9255d3e81eb9c34c3c5ccdf20e53a', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-17 09:08:47', '2024-12-18 10:08:47'),
(20, '7881e7862c036e26da44de540b57b630b14d5f1932d68f7c8464fb0e8b415b40', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-14 01:49:25', '2025-03-15 02:49:25'),
(21, '78ed65b4c6e4fb54203e1f08b435336440c104dfaaf54ffa8ab3f724ea961d85', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1', '2025-03-08 19:46:48', '2025-02-06 20:46:48'),
(20, '7959838e534c3d1a8b53c727ae595a409564ad4765c76f9a0b5dd16efc27a743', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-09 13:22:25', '2025-02-07 14:22:25'),
(22, '7959c4987f41906ed3b999a36235cb78e0305ed944bed089b0c6e7bd2b882d22', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-15 09:33:21', '2025-08-16 11:33:21'),
(21, '7b112b4627978b8589dafd840a838b333f1b060858b35a3249fa966715777b4f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1', '2025-01-16 17:50:50', '2024-12-17 18:50:50'),
(20, '7b875a3f9eb362533f7cc54b0863d2ee7dc4a43b7d2a793ead1d446b8f115cc0', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-05 14:25:07', '2025-02-03 15:25:07'),
(20, '7bf6edf1b1cc156b063fd75974591f94240c6968e84e344fc04cead1e80d7f3b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-15 11:40:11', '2025-03-16 12:40:11'),
(21, '7c0b2d99b437573c6b04d9590a642102a619671ca58340482c95934cd40538b0', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-04 10:24:14', '2025-06-04 12:24:14'),
(2, '7ca11078fc3a66bd4d15041e0a65d268ad8001d5fff23c7afad003c2dd41c4d4', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-10 11:20:52', '2025-03-11 12:20:52'),
(9, '7dd8d635b30e619508b711379cc72ac48bb87c5f8a23757b2688549b067da64a', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-07 18:40:02', '2024-12-08 19:40:02'),
(2, '7e88ed0374ae10e245b600cc9578162d66d300a29a3acb4fb29c529a98ac8578', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-03-26 18:24:06', '2025-02-24 19:24:06'),
(9, '8055bf3083c87e006b9ca77cead3fd51387bfce16103b2711ca53dee2e279f6e', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-09 17:01:19', '2024-12-10 18:01:19'),
(22, '8083ea17993165723518f555cd4502596596896c79d7672192781dcfe1651fd2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-10-09 15:37:22', '2025-09-09 17:37:22'),
(20, '8241b1edd7777bf3092e65b9641458c14456a6882d5d11ab82074eeea352afea', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-04 10:44:35', '2025-03-05 11:44:35'),
(22, '8673a299d0e468a371858ec3fe75fe3247ae2b24a16669ecfa2734d0e40a7e1d', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-21 13:04:43', '2025-08-22 15:04:43'),
(2, '892ed2bef4964fb82ec7e36ff54b6c3548c00fb5807e22366c3d4516d12da8ab', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-03-19 09:32:35', '2025-02-17 10:32:35'),
(20, '894735b8f0f9b6caab5d2e5671bc84142433ca099eb17e062ee86f79c8000310', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-16 08:43:33', '2025-03-17 09:43:33'),
(9, '8a65065a34567603a56b902c84799f008a8798ee4d3f8c6bd8184372185a83f7', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1', '2025-01-07 19:40:26', '2024-12-08 20:40:26'),
(21, '8bd2a425c03ab18437ff958fcb764876cff3faa9a435f6eef17034a544be8157', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-04-12 06:23:42', '2025-03-13 07:23:42'),
(20, '8c1fc33c53cd2d04d446a0ad63558c7b9f02074acc04b83ea1399cc8daae0ff9', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-10 05:11:31', '2024-12-11 06:11:31'),
(2, '8c71969aca650d0938ed54a20f279ef6d7c13400b07148381a63db31de5f2665', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-06-10 14:34:27', '2025-05-11 16:34:27'),
(2, '8dee0b1534ddc663cf899612bbfd2f9aae3705a8f3e6b9f84da01bd92ce545b1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-21 13:15:01', '2025-08-22 15:15:01'),
(21, '8fbc1faf994ef96517b0f2aabd794d2e610be92f3a3068b78aac638f1c1b782b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-23 11:54:14', '2025-06-23 13:54:14'),
(20, '903f127714c7f8f8a10de3f684be64f1486d5a6bad71b7449776367f025cbc70', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-15 04:47:13', '2025-03-16 05:47:13'),
(19, '90e154f062d55fb5143835aa43f104478390bc567fd296363199ce347b388bf0', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-09 09:29:03', '2024-12-10 10:29:03'),
(2, '91d95be1e7456913f8a4da046b2b1e26b9175d3068b63bf3646ee8b0818bb47d', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-06 14:24:57', '2025-03-07 15:24:57'),
(21, '938261ef2cc5eb244714b079f652766ab54b8d6f0b52658de00ef4c333ee0201', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-03 10:02:07', '2025-06-03 12:02:07'),
(20, '946a4b23f14c279dd19ef3ca000b194be2f5e573ea29d93485ccf2b4dfb1961c', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-14 02:43:46', '2025-03-15 03:43:46'),
(19, '979f954f465c533b7dc65346435569c20144eb3c45715b8afe86d729929b62cc', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-16 18:21:59', '2024-12-17 19:21:59'),
(2, '9853200605f2060fc7786331bca40d3f37caae0571e2f13b8571f96c8e3448b6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-11 02:17:12', '2025-03-12 03:17:12'),
(20, '9a6890b4932dfb461e753c790f63b2d5cd5bb78a82c0ed460f05e0ec8bee8c8b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-22 16:45:52', '2025-02-18 12:42:10'),
(20, '9b8e10765812a1f10b15a4f16c8cb7372540a26a31d9ae5c9275ca6c6093a8e3', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-12 10:42:09', '2025-03-13 11:42:09'),
(20, '9bc77565138226f3f6d83f5815345d53e60a32c622a144fce7c3e2b1ad6a60b8', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-07 12:09:22', '2025-03-08 13:09:22'),
(22, '9c943cf42b874e5d911acc6309e1593349e99eec13c21d0d481e3fa0965e07f3', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', '2025-09-25 09:42:59', '2025-08-26 11:42:59'),
(2, 'a0ed522b0b15f08e8b820c8d1e048c84145122d62bd48633c4e73e8cb83a85c3', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Safari/605.1.15', '2025-02-08 11:59:04', '2025-01-09 12:59:04'),
(20, 'a30e5529b3466c16480f4a2d69ccc7cce830e1c6ad6ac153d78d9c68fb9634f6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-13 08:43:30', '2025-03-14 09:43:30'),
(2, 'a31b673e06fe30a72a482cd0688c12a8a94e1b0d1c2dd3718e92acfa20d0176c', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1', '2025-01-18 16:29:44', '2024-12-19 17:29:44'),
(20, 'a3984ce4b70d61ad04fbddd4dcfcf20ab726a072f0769e38ee8d184b4da20849', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-27 17:48:12', '2025-02-25 18:48:12'),
(2, 'a4844b2feb8770655cb99b9ab07136ec2cef79bc410643272ccaa4a450a7759d', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-14 03:42:47', '2025-03-15 04:42:47'),
(9, 'a601b86b0d6e4c01aa5091f770da6e1974305a6c06915f3dd8af46839696950b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-03 11:20:46', '2025-03-04 12:20:46'),
(2, 'a65bbd4cb0feec28a17d80ff8d40b6d6aee4fa516ab61a876232258cb4930515', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-03-26 13:28:23', '2025-02-24 14:28:23'),
(2, 'a692afea722e88265850b6ed041df127fdf9f574a4424e3a18a0dd36b7ba6bc1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-12 13:41:37', '2025-03-13 14:41:37'),
(2, 'a802fe7629c0a9d767f00db2cf7c533cdac4c4a50a8594311c28c7dd82fa95dc', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-08-21 08:17:33', '2025-07-22 10:17:33'),
(20, 'a926b2c01a4d862b0b61e0581417f4503a8a3e2652636ae162b126461037ef1e', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-17 09:55:22', '2024-12-18 10:55:22'),
(20, 'aaaf8362bf8d56be943fbc56dc432e5a1c92ef2c66e73c04e239830792d553aa', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-10 11:29:39', '2025-03-11 12:29:39'),
(2, 'aacdeaf02b4054c89ddd246edc38610ef4881746a3b27a61daa81c5c031bf440', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-03 08:39:57', '2024-12-04 09:39:57'),
(9, 'ad88cae1d16babab3ba1f73f9b2c7fc29559970d2e3a57a85871157f5b7c0919', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-02 08:43:19', '2024-12-03 09:43:19'),
(20, 'af490a16dad0b2a7d311fa60056feaaea5f89b2f57f35cc67531b25447627f90', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-23 03:52:12', '2024-12-24 04:52:12'),
(2, 'b0b493bb6585b4f86b26d0e8908930a33d54591ef5b30300f4fb0003e2383579', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-16 15:58:57', '2024-12-17 16:58:57'),
(2, 'b2bcc5143eb0507e68782ffad42aed696caa4cf62e91e65119c6c9336fb499f7', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-09-23 16:48:46', '2025-08-24 18:48:46'),
(21, 'b2f76e39b5a2b980bcec8577b40cf31d5c81b464b75f4b905defdf06de4f4d74', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2025-02-08 13:46:35', '2025-01-09 14:46:35'),
(22, 'b440a493e6fa32b299be3563459b28cec763418648c9adcf6c472319f7d2edeb', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-06-14 12:20:14', '2025-05-15 14:20:14'),
(2, 'b4c9b993ca9e4ddd1430e584a84ac11aae86c9e2c05a25e161e8e4ad706adfcc', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-26 08:49:12', '2025-02-24 09:49:12'),
(9, 'b6d36f4bf5f80c4b53589115cdaaf083e54fb1a3a7255329b3e14d77b41c1d4d', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-16 21:30:54', '2024-12-17 22:30:54'),
(2, 'b7040a21ce641081ecbf6f254372dba45e80f7cc6601014f10d1cc10855cd850', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-11-19 20:25:28', '2025-10-20 22:25:28'),
(2, 'b83704746f1859a3434eb55be69b781b22ff4eeaffdb5dfb9e5378bfda9aab76', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-07 18:40:22', '2024-12-08 19:40:22'),
(9, 'babef9e17a0004fa3f742eba1ea947de8b7e286aae9d075ce00d83b129e62e9b', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-05 20:40:45', '2024-12-06 21:40:45'),
(2, 'bd9a8dfc23164a665374de6538ce743d0a71b8ea5d1a527a90218f9aef79de7e', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-16 10:01:46', '2025-03-17 11:01:46'),
(20, 'c1adfd2e11e98a589550378404fbbba594e1ca7fcbac67a2d542f454be226498', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-15 15:12:49', '2025-03-16 16:12:49'),
(20, 'c1d5c40d535c716436699ba06d791cf4d105cdc56aa5dcb77b48442f8f6e2f9f', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-17 05:27:30', '2025-03-18 06:27:30'),
(2, 'c41f76174a4ea3ea00c7287a1697bc0fff1629b4170b11fb1f5b2d07cf232720', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-01 21:33:55', '2024-12-02 22:33:55'),
(20, 'c46affd23d1547f1dc17b8b137f999d8e5207ca755187edc05a4abe728c8cc61', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-03 17:01:58', '2025-03-04 18:01:58'),
(2, 'c5b86b01bedef5ff3c9ee74874174223388e6c6829de0412567fb87a020b08b4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-02 15:52:42', '2025-06-02 17:52:42'),
(2, 'c6d850fcfa9d42f4423c577070046a6915bd0a4e2534b47e4133c06f5d59fa70', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-12 10:38:11', '2025-03-13 11:38:11'),
(9, 'c795d3e39dcb1f404097c3d7007ac4f556726f7d7da464d86c1d4fd7d6fa44ff', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-05-23 08:43:02', '2025-04-23 10:43:02'),
(2, 'c7b07ab331a59d8e8127be5a02ebc506e651100d38c2e16d5136f6811143c5ab', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-10 15:59:17', '2025-03-11 16:59:17'),
(2, 'c87855808bfdfda444e16c8ab089f159c61660f5815dbdcfc7827544cf00a58c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-27 07:31:25', '2025-02-25 08:31:25'),
(20, 'c88bebbf5981b898eeaa0e61811c81fdfe821456c8fc81df959d7092155a13ad', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-31 08:41:24', '2024-12-30 14:47:20'),
(2, 'c91b81d8e64e43b400c429077308eff2f40898a552668b990e2391a5e5f1b8a2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-02-01 21:07:06', '2025-01-02 22:07:06'),
(2, 'ce531f048a6f3752bba9c9197571390286e9a9ba13454301305f93754b39dbec', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-17 07:59:32', '2025-03-18 08:59:32'),
(9, 'cf6c339ee4137094ba1ada0f3c88c6b0a26f0363f3801b9a72ddbc4c573de300', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-01-03 20:12:52', '2024-12-04 09:39:06'),
(2, 'd01c4f53b06896ce7923be2f2a4ec8a91b3bb33fd8d5014872e4668fd5589555', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-09-23 19:29:45', '2025-08-24 21:29:45'),
(2, 'd125ab6c568f3fe365766bac11c2a0f5105d6e7be46f42e3cd2448d5bea721fa', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-13 08:38:23', '2025-03-14 09:38:23'),
(2, 'd3655f63b5dd50a3a77444f29bcdba4730a8ae23a1cb508d5c566990d9a4da4a', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15', '2026-04-10 07:08:04', '2026-03-11 08:08:04'),
(2, 'd43141b9c708bf7d6a2f71bef69e2b985711e192076096557a3c6efa075d4065', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-16 20:11:15', '2024-12-17 21:11:15'),
(2, 'd49a8d945c4995c13752a178c5828478c82765533bfce6fabd011663e54e6151', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '2025-03-26 09:18:33', '2025-02-24 10:18:33'),
(22, 'd6961659d8eeefbc50623b0bba580fab92159cfd38f34c1a3d8cf398b9535763', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2025-04-07 10:26:00', '2025-03-08 11:26:00'),
(20, 'd8bc536e24307215f02bae6df3edaa44960648363156e6fe2396080b19f60b09', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-10 14:38:58', '2025-02-08 15:38:58'),
(2, 'db5c703a8d06d4587ebe3c212eb569dab36dcb9f7ad32212e88b1d3b552c79f5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1', '2025-01-13 20:53:55', '2024-12-14 21:53:55'),
(20, 'dcacf380af6ff47c7e8cccd24cc34d345ff3a9158b3846b4edac8805c9d2334b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-03-24 07:24:31', '2025-02-22 08:24:31'),
(20, 'ddb3056030aaa8403c98cd7e0196957ea370aaedc0cdb986bd2299f772562c0c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15', '2025-01-14 20:07:03', '2024-12-15 21:07:03'),
(2, 'de233b8f807d8c9bdb87adb206e331ea17b1498ca5a58e5def66490224888cb5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-03-26 10:04:50', '2025-02-24 11:04:50'),
(2, 'de315b56671566e12939f7d92fa587a0b446c2a826cc6b1860f1ecab7405e955', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-09 18:57:07', '2024-12-10 19:57:07'),
(2, 'e11055604605171bd2896d0ba00386314f68d553470d0abe0d5aee21d608e01c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-09 08:38:50', '2024-12-10 09:38:50'),
(2, 'e329ec7026dac8fb48725a159d98b6a81af5ffcfbc2a7355a482450df3da26b7', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-03-29 08:15:06', '2025-02-27 09:15:06'),
(2, 'e44c3a8e12301da1f3ed6a49e7896dc2c8395fa94a6fb0bc61f93c7beabf404c', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-03 20:14:12', '2024-12-04 21:14:12');
INSERT INTO `auth_tokens` (`user_id`, `token_hash`, `device_info`, `expires_at`, `created_at`) VALUES
(20, 'e511772b659a8e0b76cf80dabd7f10e663e80173ee213a0581b5ccdc53e0327b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-15 03:44:20', '2025-03-16 04:44:20'),
(9, 'e5d9361238c506b4260c04c317df51e48d0111df959cc3fe33c670025c26b491', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-12 19:01:38', '2025-07-13 21:01:38'),
(20, 'e640a05319952c28ce043ce6b94ef30367ac0e4f885992b9401e533c547aa191', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-02-19 08:29:38', '2025-01-20 09:29:38'),
(2, 'e7613c74a02f4eb36759fb155515743fba694eac6c5292a77ba66ca86283ee80', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-05-15 18:13:15', '2025-04-15 20:13:15'),
(2, 'ee3f98beb41cb3e88ae0bb7b9376d81affc685ee80c6553e21a0ada993415ae4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-05-08 09:31:40', '2025-04-08 11:31:40'),
(2, 'ee9a7c16ea74317a67f4f8e110423a1a23a6b1a00d9f21f6a8f53496c488befb', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-04-11 12:50:53', '2025-03-12 13:50:53'),
(21, 'ef4f8d2276fd908ada60460d416920d14318a6a8fc0504d1d3f63d9a422face8', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-07-20 13:09:05', '2025-06-20 15:09:05'),
(2, 'ef98683e195ee8ac7e4c5ecf21e55e2e31975ae8a255ccb7cc0b6f583f6eb833', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15', '2025-08-29 22:28:50', '2025-07-31 00:28:50'),
(22, 'efa740c603eb6c2f926357a47bb6ded7cf55a911c8d6fa33775517875cd7dd0b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-05-29 15:28:44', '2025-04-29 17:28:44'),
(20, 'f090dd2091d31ccb2cfda28e404a9f3b70e09aa79d4e0b78091c5702f347fbf6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-10 01:37:29', '2025-03-11 02:37:29'),
(20, 'f1603fd0ad2b4923de464947d885967aa6ec9ed60da69c22fd60ef5931bee77d', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-04-10 12:26:57', '2025-03-11 13:26:57'),
(2, 'f1d23c2d7559d3caf6c58c71d1e653701dfebe0db05ffae03dd7c0191c5a8c22', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-04-01 13:23:09', '2025-03-02 14:23:09'),
(20, 'f2fad8647be64b33d11324df384c65031b3f4bd473183523fb10a1ed00405881', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-01-14 09:21:26', '2024-12-15 10:21:26'),
(2, 'f424ed950791bfea96ce7a9a743c3a0fc35385992cef0a924e6b7030d9942d8b', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-02 08:43:40', '2024-12-03 09:43:40'),
(2, 'f74aced1ee9110286a6a548d9eb7ab684dfc0d5eb5d98eb4c8390854f9100af7', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-06-17 12:20:33', '2025-05-18 14:20:33'),
(22, 'fa4733611198c5784e934440408a51fa94ab50b531b970ff434eba191ec29606', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-08-08 13:55:43', '2025-07-09 15:55:43'),
(22, 'fb669b3230f6063d4319e609cbda77779a87ba9b96dac68d67ffa26bd109527e', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1', '2025-06-08 14:51:08', '2025-05-09 16:51:08'),
(2, 'fd96efba44be91a0906b76edf567bb32bc4488a1d33b5182fff23c01d360d951', 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1', '2025-07-12 03:43:23', '2025-06-12 05:43:23'),
(20, 'fd9ccbe8b8b828cd116682303109ba9e75db508132eeb8857fea8b3664c21cc2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1', '2025-02-13 07:23:54', '2025-01-02 17:35:53'),
(22, 'fe02dfa6bdd6705f03cfea7db1c7840be39191b503dbeeec63cc1705e59fea74', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-09-07 15:24:27', '2025-08-08 17:24:27'),
(2, 'fec6aa4e15ffca8ade973956cb993a07d7839ad830adfb4db5568a31482524e8', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-05-09 10:58:24', '2025-04-09 12:58:24'),
(2, 'ff212403e21df1228d223d31cedd41a1924bae162429e1536ebd70df288c0faa', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '2025-01-01 22:23:53', '2024-12-02 23:23:53'),
(9, 'fffa42d2aa6678d14188810012adbc6ac6dfda6e16aeeeadf9eaaac42c9d3e98', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-05-09 14:24:47', '2025-04-09 16:24:47');

-- --------------------------------------------------------

--
-- Table structure for table `calendars`
--

CREATE TABLE `calendars` (
  `id` int UNSIGNED NOT NULL,
  `synctoken` int UNSIGNED NOT NULL DEFAULT '1',
  `components` varbinary(21) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int NOT NULL,
  `trip_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `start_timezone` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `end_timezone` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `remark` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `trip_id`, `title`, `start_datetime`, `end_datetime`, `start_timezone`, `end_timezone`, `location`, `remark`, `created_at`) VALUES
(9, 'MSC2024GRAND1', 'flight', '2024-11-16 08:00:00', '2024-11-16 11:00:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-11-14 08:53:11'),
(10, 'MSC2024GRAND1', 'kukk', '2024-11-17 11:00:00', '2024-11-17 12:00:00', 'Europe/Budapest', 'Europe/Budapest', 'Marriott Budapest', 'ribi', '2024-11-14 09:47:32'),
(12, 'MSC2024GRAND1', 'checkin', '2024-11-18 11:00:00', '2024-11-18 12:00:00', 'Asia/Tokyo', 'Asia/Tokyo', 'Tokyo Haneda Airport', 'iszkiritty', '2024-11-14 13:39:15'),
(13, 'MSCGRAND2024', 'Flight: LX2253', '2024-11-16 06:15:00', '2024-11-16 07:55:00', 'Europe/Budapest', 'Europe/Budapest', 'Budapest Airport', 'Flight: LX2253 BUD-ZRH', '2024-11-14 14:56:40'),
(14, 'MSCGRAND2024', 'Flight: LX1612', '2024-11-16 08:55:00', '2024-11-16 09:50:00', 'Europe/Budapest', 'Europe/Budapest', 'Zurich Airport', 'Flight: LX2253 ZRH-MXP', '2024-11-14 14:59:23'),
(15, 'MSCGRAND2024', 'Train: Regional 3025', '2024-11-16 12:25:00', '2024-11-16 14:18:00', 'Europe/Budapest', 'Europe/Budapest', 'Milano Centrale Station', 'Regional Veloce 3025\r\nMilano Centrale - Genoca Piazza Principe', '2024-11-14 15:02:53'),
(16, 'MSCGRAND2024', 'Castoff @ GENOVA', '2024-11-16 18:00:00', '2024-11-16 18:30:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-11-14 15:07:50'),
(17, 'MSCGRAND2024', 'ARRIVAL @ MARSEILLE', '2024-11-17 08:30:00', '2024-11-17 09:00:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-11-14 15:10:14'),
(18, 'MSCGRAND2024', 'Castoff @ MARSEILLE', '2024-11-17 18:00:00', '2024-11-17 18:30:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-11-14 15:11:29'),
(19, 'MSCGRAND2024', 'ARRIVAL @ BARCELONA', '2024-11-18 08:30:00', '2024-11-18 09:00:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-11-14 15:12:05'),
(20, 'MSCGRAND2024', 'Flight: LH1813', '2024-11-18 15:30:00', '2024-11-18 17:35:00', 'Europe/Budapest', 'Europe/Budapest', 'Barcelona Airport', 'Flight: LH1813 BCN-MUC', '2024-11-14 15:14:42'),
(21, 'MSCGRAND2024', 'Flight: LH1680', '2024-11-18 19:05:00', '2024-11-18 20:20:00', 'Europe/Budapest', 'Europe/Budapest', 'Munich Airport', 'Flight: LH1680 MUC-BUD', '2024-11-14 15:15:40'),
(22, 'MSCGRAND2024', '100E DEAK-BUDAPEST APT', '2024-11-16 03:50:00', '2024-11-16 04:30:00', 'Europe/Budapest', 'Europe/Budapest', 'Deak Ferenc ter, Budapest', 'Between 03:50-04:00 meet everyone at the 100E bus stop.\r\nPlease buy your ticket upon arrival or in the app in advance.', '2024-11-14 15:34:51'),
(25, 'POKIO25', 'Flight - W62333 BUD-MXP', '2025-03-07 06:10:00', '2025-03-07 07:55:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-12-06 10:30:01'),
(26, 'POKIO25', 'Flight - CA950 - MXP-PEK', '2025-03-07 12:30:00', '2025-03-08 05:30:00', 'Europe/Budapest', 'Asia/Shanghai', '', '', '2024-12-06 10:33:14'),
(28, 'POKIO25', 'Flight - CA920 - NRT-PVG', '2025-03-14 19:30:00', '2025-03-14 22:05:00', 'Asia/Tokyo', 'Asia/Shanghai', '', '', '2024-12-06 10:41:55'),
(29, 'POKIO25', 'Flight - CA967 - PVG-MXP', '2025-03-17 01:45:00', '2025-03-17 07:15:00', 'Asia/Shanghai', 'Europe/Budapest', '', '', '2024-12-06 10:44:36'),
(30, 'POKIO25', 'Flight - W62338 - MXP-BUD', '2025-03-17 14:50:00', '2025-03-17 16:30:00', 'Europe/Budapest', 'Europe/Budapest', '', '', '2024-12-06 10:47:01'),
(31, 'POKIO25', 'Flight - CA153 - PEK - HIJ', '2025-03-08 08:00:00', '2025-03-08 13:20:00', 'Asia/Shanghai', 'Asia/Tokyo', '', '', '2024-12-08 18:45:22'),
(32, 'POKIO25', 'The KNOT Hiroshima checkin', '2025-03-08 17:00:00', '2025-03-08 17:30:00', 'Asia/Tokyo', 'Asia/Tokyo', 'The KNOT Hiroshima', 'Hiroshima Airport Limousine Bus a repterrol, és onnan streetcar vagy 10 perc gyalog', '2024-12-10 09:14:04'),
(33, 'POKIO25', 'Hiroshima Memorial Musem', '2025-03-08 18:00:00', '2025-03-08 19:00:00', 'Asia/Tokyo', 'Asia/Tokyo', 'Hiroshima Memorial Museum', '5 perc gyalog a szallastol', '2024-12-10 09:16:34'),
(34, 'POKIO25', 'Free walking tour - Hiro', '2025-03-09 11:00:00', '2025-03-09 13:00:00', 'Asia/Tokyo', 'Asia/Tokyo', 'Japan, 〒730-0811 Hiroshima, Naka Ward, Nakajimachō, 1−１ 平和記念公園南側緑地喫煙ブース', 'I will be by the Gates of Peace in front of Italian restaurant ‘Mario’', '2024-12-17 21:57:02'),
(35, 'CAPPATALYA25', 'BUD-IST TK1036', '2025-09-01 08:55:00', '2025-09-01 12:15:00', 'Europe/Budapest', 'Europe/Istanbul', 'Budapest Liszt Ferenc Airport', '', '2025-02-24 09:13:47'),
(36, 'CAPPATALYA25', 'IST-AYT TK2422', '2025-09-01 14:20:00', '2025-09-01 15:45:00', 'Europe/Istanbul', 'Europe/Istanbul', 'Istanbul Airport', '', '2025-02-24 09:14:45'),
(37, 'CAPPATALYA25', 'ASR-IST TK2017', '2025-09-07 15:15:00', '2025-09-07 16:55:00', 'Europe/Istanbul', 'Europe/Istanbul', 'Kayseri Airport', '', '2025-02-24 09:22:48'),
(38, 'CAPPATALYA25', 'IST-BUD TK1037', '2025-09-07 18:30:00', '2025-09-07 19:35:00', 'Europe/Istanbul', 'Europe/Istanbul', 'Istanbul Airport', '', '2025-02-24 09:23:43'),
(39, 'POKIO25', 'Hiroshima-Shin-Osaka Kodama 866', '2025-03-09 19:57:00', '2025-03-09 22:12:00', 'Asia/Tokyo', 'Asia/Tokyo', 'Hiroshima Station', 'Kodama 866 19:57-22:12 ', '2025-03-03 09:11:28');

-- --------------------------------------------------------

--
-- Table structure for table `form_fields`
--

CREATE TABLE `form_fields` (
  `id` int NOT NULL,
  `field_name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `field_type` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `order` int DEFAULT '0',
  `trip_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `form_fields`
--

INSERT INTO `form_fields` (`id`, `field_name`, `field_type`, `is_required`, `order`, `trip_id`) VALUES
(1, 'First Name', 'text', 0, 1, 0),
(2, 'Last Name', 'text', 0, 2, 0),
(3, 'Middle Name', 'text', 0, 3, 0),
(4, 'Passport Number', 'text', 0, 4, 0),
(5, 'Issue Date', 'date', 0, 5, 0),
(6, 'Issuing Country', 'text', 0, 6, 0),
(7, 'Expiry Date', 'date', 0, 7, 0),
(8, 'Nationality', 'text', 0, 8, 0),
(9, 'Sex', 'text', 0, 9, 0);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `trip_id` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `trip_id`, `user_id`, `title`, `body`, `created_at`) VALUES
(19, 'POKIO25', 9, 'Menetrend változás', 'Wizz értesítése szerint a március 17-ei 14:50-kor Milano Malpensa(MXP)-Budapest(BUD) járat törlésre került, helyette a 22:50-kor induló járatra foglaltak át (budapesti érkezés 00:30).\r\nOpciók:\r\na, Elfogadjuk ezt a járatot\r\nb, Új járatot keresünk Malpensarol cca. 45-50ezer Ft környéke, ami emberi időben érkezik meg.\r\nc, Új járat Ryanair Bergamobol (ind. 16:40, érk. 18:15) cca. 25-30ezer Ft\r\nd, Milanoban új életet kezdünk.', '2025-01-09 12:11:53'),
(20, 'POKIO25', 20, 'Menetrend változás', 'Wizz értesítése szerint a március 17-ei 14:50-kor Milano Malpensa(MXP)-Budapest(BUD) járat törlésre került, helyette a 22:50-kor induló járatra foglaltak át (budapesti érkezés 00:30).\r\nOpciók:\r\na, Elfogadjuk ezt a járatot\r\nb, Új járatot keresünk Malpensarol cca. 45-50ezer Ft környéke, ami emberi időben érkezik meg.\r\nc, Új járat Ryanair Bergamobol (ind. 16:40, érk. 18:15) cca. 25-30ezer Ft\r\nd, Milanoban új életet kezdünk.', '2025-01-09 12:11:53'),
(21, 'POKIO25', 21, 'Menetrend változás', 'Wizz értesítése szerint a március 17-ei 14:50-kor Milano Malpensa(MXP)-Budapest(BUD) járat törlésre került, helyette a 22:50-kor induló járatra foglaltak át (budapesti érkezés 00:30).\r\nOpciók:\r\na, Elfogadjuk ezt a járatot\r\nb, Új járatot keresünk Malpensarol cca. 45-50ezer Ft környéke, ami emberi időben érkezik meg.\r\nc, Új járat Ryanair Bergamobol (ind. 16:40, érk. 18:15) cca. 25-30ezer Ft\r\nd, Milanoban új életet kezdünk.', '2025-01-09 12:11:54');

-- --------------------------------------------------------

--
-- Table structure for table `message_status`
--

CREATE TABLE `message_status` (
  `id` int NOT NULL,
  `message_id` int NOT NULL,
  `user_id` int NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `message_status`
--

INSERT INTO `message_status` (`id`, `message_id`, `user_id`, `is_read`, `read_at`) VALUES
(15, 19, 9, 1, '2025-03-04 11:20:50'),
(16, 20, 20, 1, '2025-01-14 07:23:59'),
(17, 21, 21, 1, '2025-01-09 13:46:43');

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `id` int NOT NULL,
  `trip_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `trips`
--

INSERT INTO `trips` (`id`, `trip_id`, `name`, `start_date`, `end_date`) VALUES
(1, 'MSC2024GRAND1', 'MSC Grandiosa', '2024-11-16', '2024-11-18'),
(2, 'MSC1', 'MSCTRIP', '2024-11-13', '2024-11-15'),
(3, 'MSCGRAND2024', 'MSC Grandiosa', '2024-11-16', '2024-11-18'),
(5, 'POKIO25', 'Japán 2025', '2025-03-07', '2025-03-17'),
(6, 'CAPPATALYA25', 'Törökország \'25', '2025-09-01', '2025-09-07');

-- --------------------------------------------------------

--
-- Table structure for table `trip_financials`
--

CREATE TABLE `trip_financials` (
  `id` int NOT NULL,
  `trip_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `type` enum('expense','income') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `trip_financials`
--

INSERT INTO `trip_financials` (`id`, `trip_id`, `user_id`, `description`, `amount`, `type`, `date`) VALUES
(13, 'MSC2024GRAND1', 8, 'Top-up', 100, 'income', '2024-11-13'),
(14, 'MSC2024GRAND1', 8, 'Stripe Top-up', 200, 'income', '2024-11-14'),
(16, 'MSCGRAND2024', 10, 'Deposit', 50000, 'expense', '2024-11-14'),
(17, 'MSCGRAND2024', 10, 'Transfer', 50000, 'income', '2024-11-14'),
(18, 'MSCGRAND2024', 10, 'Instalment', 50000, 'expense', '2024-11-14'),
(20, 'MSCGRAND2024', 10, 'Transfer', 50000, 'income', '2024-11-14'),
(21, 'MSCGRAND2024', 10, 'Plane Ticket', 55500, 'expense', '2024-11-14'),
(23, 'MSCGRAND2024', 10, 'Milan Airport-Genova transfer', 4500, 'expense', '2024-11-14'),
(24, 'MSCGRAND2024', 10, 'Transfer', 60000, 'income', '2024-11-14'),
(25, 'MSCGRAND2024', 11, 'Deposit', 50000, 'expense', '2024-11-14'),
(26, 'MSCGRAND2024', 11, 'Transfer', 50000, 'income', '2024-11-14'),
(27, 'MSCGRAND2024', 11, 'Instalment', 50000, 'expense', '2024-11-14'),
(28, 'MSCGRAND2024', 11, 'Transfer', 50000, 'income', '2024-11-14'),
(29, 'MSCGRAND2024', 11, 'Plane Ticket', 55500, 'expense', '2024-11-14'),
(30, 'MSCGRAND2024', 11, 'Milan Airport-Genova transfer', 4500, 'expense', '2024-11-14'),
(31, 'MSCGRAND2024', 11, 'Transfer', 60000, 'income', '2024-11-14'),
(32, 'MSCGRAND2024', 12, 'Deposit', 50000, 'expense', '2024-11-14'),
(33, 'MSCGRAND2024', 12, 'Transfer', 50000, 'income', '2024-11-14'),
(34, 'MSCGRAND2024', 12, 'Instalment', 50000, 'expense', '2024-11-14'),
(35, 'MSCGRAND2024', 12, 'Transfer', 50000, 'income', '2024-11-14'),
(36, 'MSCGRAND2024', 12, 'Plane Ticket', 55500, 'expense', '2024-11-14'),
(37, 'MSCGRAND2024', 12, 'Milan Airport-Genova transfer', 4500, 'expense', '2024-11-14'),
(38, 'MSCGRAND2024', 12, 'Transfer', 60000, 'income', '2024-11-14'),
(39, 'MSCGRAND2024', 13, 'Deposit', 50000, 'expense', '2024-11-15'),
(40, 'MSCGRAND2024', 13, 'Transfer', 50000, 'income', '2024-11-15'),
(41, 'MSCGRAND2024', 13, 'Instalment', 50000, 'expense', '2024-11-15'),
(42, 'MSCGRAND2024', 13, 'Transfer', 50000, 'income', '2024-11-15'),
(43, 'MSCGRAND2024', 13, 'Plane Ticket', 55500, 'expense', '2024-11-15'),
(44, 'MSCGRAND2024', 13, 'Milan Airport-Genova transfer', 4500, 'expense', '2024-11-15'),
(45, 'MSCGRAND2024', 13, 'Transfer', 60000, 'income', '2024-11-15'),
(46, 'MSCGRAND2024', 14, 'Deposit', 50000, 'expense', '2024-11-15'),
(47, 'MSCGRAND2024', 14, 'Transfer', 50000, 'income', '2024-11-15'),
(48, 'MSCGRAND2024', 14, 'Instalment', 50000, 'expense', '2024-11-15'),
(49, 'MSCGRAND2024', 14, 'Transfer', 50000, 'income', '2024-11-15'),
(50, 'MSCGRAND2024', 14, 'Plane Ticket', 55500, 'expense', '2024-11-15'),
(51, 'MSCGRAND2024', 14, 'Milan Airport-Genova transfer', 4500, 'expense', '2024-11-15'),
(52, 'MSCGRAND2024', 14, 'Transfer', 60000, 'income', '2024-11-15'),
(53, 'POKIO25', 21, 'Top-up', 30000, 'income', '2024-12-17'),
(54, 'POKIO25', 9, 'THE KNOT - Hiroshima', 26000, 'expense', '2025-03-08'),
(55, 'POKIO25', 20, 'THE KNOT - Hiroshima', 26000, 'expense', '2025-03-08'),
(56, 'POKIO25', 21, 'THE KNOT - Hiroshima', 26000, 'expense', '2025-03-08'),
(57, 'POKIO25', 9, 'Air China repjegy', 220000, 'expense', '2024-11-05'),
(58, 'POKIO25', 20, 'Air China repjegy', 220000, 'expense', '2024-11-05'),
(59, 'POKIO25', 21, 'Air China repjegy', 220000, 'expense', '2024-11-05'),
(60, 'POKIO25', 9, 'Wizz repjegy', 34440, 'expense', '2024-11-11'),
(61, 'POKIO25', 20, 'Wizz repjegy', 34440, 'expense', '2024-11-11'),
(62, 'POKIO25', 20, 'Revolut utalas', 254440, 'income', '2024-11-05'),
(63, 'POKIO25', 21, 'NYC repjegy refund', 240000, 'income', '2024-11-05'),
(67, 'POKIO25', 9, 'Hotel Hankyu - Osaka', 44000, 'expense', '2025-03-09'),
(68, 'POKIO25', 20, 'Hotel Hankyu - Osaka', 44000, 'expense', '2025-03-09'),
(69, 'POKIO25', 21, 'Hotel Hankyu - Osaka', 44000, 'expense', '2025-03-09'),
(70, 'POKIO25', 9, '京恋 清水五条 - Kyoto', 76666, 'expense', '2025-03-10'),
(71, 'POKIO25', 20, '京恋 清水五条 - Kyoto', 76666, 'expense', '2025-03-10'),
(72, 'POKIO25', 21, '京恋 清水五条 - Kyoto', 76666, 'expense', '2025-03-10'),
(73, 'POKIO25', 9, 'THE KNOT Tokyo Hotel', 80000, 'expense', '2025-03-12'),
(74, 'POKIO25', 20, 'THE KNOT Tokyo Hotel', 80000, 'expense', '2025-03-12'),
(75, 'POKIO25', 21, 'THE KNOT Tokyo Hotel', 80000, 'expense', '2025-03-12'),
(76, 'POKIO25', 9, 'Novotel Atlantis Shanghai', 63333, 'expense', '2025-03-14'),
(77, 'POKIO25', 20, 'Novotel Atlantis Shanghai', 63333, 'expense', '2025-03-14'),
(78, 'POKIO25', 21, 'Novotel Atlantis Shanghai', 63333, 'expense', '2025-03-14'),
(79, 'POKIO25', 9, 'Shinkansen 7 day pass', 125000, 'expense', '2025-03-08'),
(80, 'POKIO25', 20, 'Shinkansen 7 day pass', 125000, 'expense', '2025-03-08'),
(81, 'POKIO25', 21, 'Shinkansen 7 day pass', 125000, 'expense', '2025-03-08'),
(82, 'POKIO25', 21, 'Cash', 420000, 'income', '2025-01-02'),
(83, 'POKIO25', 9, 'Stripe Top-up', 200, 'income', '2025-01-09'),
(84, 'POKIO25', 20, 'Revolut transfer', 400000, 'income', '2025-02-03'),
(85, 'POKIO25', 9, 'TeamLab belépő', 11600, 'expense', '2025-02-08'),
(86, 'POKIO25', 20, 'TeamLab belépő', 11600, 'expense', '2025-02-08'),
(87, 'POKIO25', 21, 'TeamLab belépő', 11600, 'expense', '2025-02-08'),
(88, 'POKIO25', 9, 'Mt Fuji tour', 39333, 'expense', '2025-02-08'),
(89, 'POKIO25', 20, 'Mt Fuji tour', 39333, 'expense', '2025-02-08'),
(90, 'POKIO25', 21, 'Mt Fuji tour', 39333, 'expense', '2025-02-08'),
(91, 'POKIO25', 20, 'Revolut transfer', 70000, 'income', '2025-02-18'),
(92, 'CAPPATALYA25', 9, 'Plane Ticket', 122000, 'expense', '2025-02-24'),
(93, 'CAPPATALYA25', 22, 'Plane Ticket', 122000, 'expense', '2025-02-24'),
(94, 'CAPPATALYA25', 21, 'Plane Ticket', 122000, 'expense', '2025-02-24'),
(95, 'CAPPATALYA25', 21, 'Bank transfer', 122000, 'income', '2025-03-02'),
(96, 'POKIO25', 9, 'Árfolyamkülönbözet', 32000, 'expense', '2025-03-03'),
(97, 'POKIO25', 20, 'Árfolyamkülönbözet', 32000, 'expense', '2025-03-03'),
(98, 'POKIO25', 21, 'Árfolyamkülönbözet', 32000, 'expense', '2025-03-03'),
(100, 'POKIO25', 20, 'Revolut', 40000, 'income', '2025-03-03'),
(101, 'POKIO25', 9, 'Taxi BUD', 4973, 'expense', '2025-03-07'),
(102, 'POKIO25', 20, 'Taxi BUD', 4973, 'expense', '2025-03-07'),
(103, 'POKIO25', 21, 'Taxi BUD', 4973, 'expense', '2025-03-07'),
(104, 'POKIO25', 21, 'Bank transfer', 35000, 'income', '2025-03-07'),
(105, 'POKIO25', 21, 'JP esim', 3200, 'expense', '2025-03-07'),
(106, 'CAPPATALYA25', 22, 'Stripe Top-up', 60000, 'income', '2025-03-08'),
(108, 'POKIO25', 9, 'Hiroshima taxi costco', 1900, 'expense', '2025-03-09'),
(109, 'POKIO25', 21, 'Hiroshima taxi costco', 1900, 'expense', '2025-03-09'),
(113, 'POKIO25', 9, 'Taxik 03-09,10', 8966, 'expense', '2025-03-10'),
(114, 'POKIO25', 20, 'Taxik 03-09,10', 8966, 'expense', '2025-03-10'),
(115, 'POKIO25', 21, 'Taxik 03-09,10', 8966, 'expense', '2025-03-10'),
(117, 'POKIO25', 21, 'Fizetett 2 kaja, Oszi tour', 20000, 'income', '2025-03-10'),
(118, 'POKIO25', 20, 'Hiro vacsora, Oszi ebéd,oszi tura', 10000, 'expense', '2025-03-10'),
(119, 'POKIO25', 21, 'Top-up', 13000, 'income', '2025-03-11'),
(120, 'POKIO25', 9, 'Kyoto ebéd 0311', 4566, 'expense', '2025-03-11'),
(121, 'POKIO25', 20, 'Kyoto ebéd 0311', 4566, 'expense', '2025-03-11'),
(122, 'POKIO25', 21, 'Kyoto ebéd 0311', 4566, 'expense', '2025-03-11'),
(126, 'POKIO25', 21, 'Wagyu, ajándék', 5900, 'expense', '2025-03-11'),
(130, 'POKIO25', 9, 'Taxi', 10500, 'expense', '2025-03-11'),
(131, 'POKIO25', 20, 'Taxi', 10500, 'expense', '2025-03-11'),
(132, 'POKIO25', 21, 'Taxi', 10500, 'expense', '2025-03-11'),
(133, 'POKIO25', 9, 'Vacsora KFC', 5466, 'expense', '2025-03-11'),
(134, 'POKIO25', 20, 'Vacsora KFC', 5466, 'expense', '2025-03-11'),
(135, 'POKIO25', 21, 'Vacsora KFC', 5466, 'expense', '2025-03-11'),
(136, 'POKIO25', 9, 'Gin pack', 6266, 'expense', '2025-03-11'),
(137, 'POKIO25', 20, 'Gin pack', 6266, 'expense', '2025-03-11'),
(138, 'POKIO25', 21, 'Gin pack', 6266, 'expense', '2025-03-11'),
(139, 'POKIO25', 20, 'Partycucc vásárlás', 5000, 'income', '2025-03-11'),
(140, 'POKIO25', 9, 'Belépő', 2000, 'expense', '2025-03-11'),
(141, 'POKIO25', 20, 'Belépő', 2000, 'expense', '2025-03-11'),
(142, 'POKIO25', 21, 'Belépő', 2000, 'expense', '2025-03-11'),
(143, 'POKIO25', 20, 'Revolut', 40000, 'income', '2025-03-11'),
(150, 'POKIO25', 21, 'Top-up', 22000, 'income', '2025-03-12'),
(151, 'POKIO25', 9, 'Taxi 03.12.', 2433, 'expense', '2025-03-12'),
(152, 'POKIO25', 20, 'Taxi 03.12.', 2433, 'expense', '2025-03-12'),
(153, 'POKIO25', 21, 'Taxi 03.12.', 2433, 'expense', '2025-03-12'),
(154, 'POKIO25', 9, 'Ebéd', 1833, 'expense', '2025-03-12'),
(155, 'POKIO25', 20, 'Ebéd', 1833, 'expense', '2025-03-12'),
(156, 'POKIO25', 21, 'Ebéd', 1833, 'expense', '2025-03-12'),
(157, 'POKIO25', 9, 'FamilyMart', 2500, 'income', '2025-03-12'),
(158, 'POKIO25', 21, 'FamilyMart', 2500, 'expense', '2025-03-12'),
(159, 'POKIO25', 21, 'Stripe Top-up', 20000, 'income', '2025-03-13'),
(161, 'POKIO25', 9, 'Taxi', 1000, 'expense', '2025-03-13'),
(162, 'POKIO25', 20, 'Taxi', 1000, 'expense', '2025-03-13'),
(163, 'POKIO25', 21, 'Taxi', 1000, 'expense', '2025-03-13'),
(164, 'POKIO25', 21, 'Fagyika Esztikének', 1200, 'expense', '2025-03-13'),
(165, 'POKIO25', 21, 'Meki Esztikének', 3600, 'expense', '2025-03-13'),
(166, 'POKIO25', 20, 'Meki Dávidkának', 2400, 'expense', '2025-03-13'),
(167, 'POKIO25', 20, 'Revolut', 10000, 'income', '2025-03-13'),
(168, 'POKIO25', 21, 'Cash Esztikének boltba', 4900, 'expense', '2025-03-14'),
(173, 'POKIO25', 9, 'Taxi Shinjukura', 1500, 'expense', '2025-03-14'),
(174, 'POKIO25', 21, 'Taxi Shinjukura', 1500, 'expense', '2025-03-14'),
(175, 'POKIO25', 9, 'Taxi TeamLab-Hotel', 6200, 'expense', '2025-03-14'),
(176, 'POKIO25', 20, 'Taxi TeamLab-Hotel', 6200, 'expense', '2025-03-14'),
(177, 'POKIO25', 21, 'Taxi TeamLab-Hotel', 6200, 'expense', '2025-03-14'),
(178, 'POKIO25', 9, 'PVG taxi', 2133, 'expense', '2025-03-15'),
(179, 'POKIO25', 20, 'PVG taxi', 2133, 'expense', '2025-03-15'),
(180, 'POKIO25', 21, 'PVG taxi', 2133, 'expense', '2025-03-15'),
(181, 'CAPPATALYA25', 9, 'Stripe Top-up', 200, 'income', '2025-03-15'),
(182, 'POKIO25', 20, 'PVG Familymart', 1500, 'expense', '2025-03-15'),
(183, 'POKIO25', 21, 'PVG Familymart', 1500, 'expense', '2025-03-15'),
(184, 'POKIO25', 9, 'PVG Didik', 1856, 'expense', '2025-03-17'),
(185, 'POKIO25', 20, 'PVG Didik', 1856, 'expense', '2025-03-17'),
(186, 'POKIO25', 21, 'PVG Didik', 1856, 'expense', '2025-03-17'),
(187, 'POKIO25', 9, 'PVG lounge belépő', 5410, 'expense', '2025-03-17'),
(188, 'POKIO25', 20, 'PVG lounge belépő', 5410, 'expense', '2025-03-17'),
(189, 'POKIO25', 21, 'PVG lounge belépő', 5410, 'expense', '2025-03-17'),
(190, 'POKIO25', 9, 'Maglev jegy', 2533, 'expense', '2025-03-17'),
(191, 'POKIO25', 20, 'Maglev jegy', 2533, 'expense', '2025-03-17'),
(192, 'POKIO25', 21, 'Maglev jegy', 2533, 'expense', '2025-03-17'),
(193, 'POKIO25', 21, 'DQ fagyi esztikének', 1020, 'expense', '2025-03-17'),
(194, 'POKIO25', 21, 'Esztike utalás', 30000, 'income', '2025-03-17'),
(195, 'POKIO25', 9, 'Hotel', 15000, 'expense', '2025-03-17'),
(196, 'POKIO25', 20, 'Hotel', 15000, 'expense', '2025-03-17'),
(197, 'POKIO25', 21, 'Hotel', 15000, 'expense', '2025-03-17'),
(198, 'POKIO25', 20, 'Revolut', 28000, 'income', '2025-03-17'),
(199, 'CAPPATALYA25', 9, 'Stripe Top-up', 200, 'income', '2025-04-09'),
(200, 'CAPPATALYA25', 22, 'Stripe Top-up', 62000, 'income', '2025-04-09'),
(203, 'CAPPATALYA25', 9, 'AYT hotel', 140000, 'expense', '2025-04-15'),
(204, 'CAPPATALYA25', 22, 'AYT hotel', 140000, 'expense', '2025-04-15'),
(205, 'CAPPATALYA25', 21, 'AYT hotel', 140000, 'expense', '2025-04-15'),
(209, 'CAPPATALYA25', 9, 'Hot Air Balloon', 22666, 'expense', '2025-04-15'),
(210, 'CAPPATALYA25', 22, 'Hot Air Balloon', 22666, 'expense', '2025-04-15'),
(211, 'CAPPATALYA25', 21, 'Hot Air Balloon', 22666, 'expense', '2025-04-15'),
(212, 'CAPPATALYA25', 22, 'Stripe Top-up', 50000, 'income', '2025-05-09'),
(213, 'CAPPATALYA25', 21, 'Cash', 175000, 'income', '2025-06-02'),
(215, 'CAPPATALYA25', 21, 'Revolut', 33000, 'income', '2025-06-02'),
(219, 'CAPPATALYA25', 9, 'Goreme hotel', 55333, 'expense', '2025-06-03'),
(220, 'CAPPATALYA25', 22, 'Goreme hotel', 55333, 'expense', '2025-06-03'),
(221, 'CAPPATALYA25', 21, 'Goreme hotel', 55333, 'expense', '2025-06-03'),
(222, 'CAPPATALYA25', 22, 'Stripe Top-up', 50000, 'income', '2025-07-09'),
(223, 'CAPPATALYA25', 9, 'Stripe Top-up', 200, 'income', '2025-07-13'),
(224, 'CAPPATALYA25', 21, 'Top-up', 10000, 'income', '2025-07-17'),
(225, 'CAPPATALYA25', 22, 'Stripe Top-up', 50000, 'income', '2025-08-08'),
(226, 'CAPPATALYA25', 9, 'Transfers', 25000, 'expense', '2025-08-31'),
(227, 'CAPPATALYA25', 22, 'Transfers', 25000, 'expense', '2025-08-31'),
(228, 'CAPPATALYA25', 21, 'Transfers', 25000, 'expense', '2025-08-31'),
(233, 'CAPPATALYA25', 22, 'Eszter paid', 25000, 'income', '2025-08-31'),
(234, 'CAPPATALYA25', 21, 'Bank transfer', 25000, 'income', '2025-08-31'),
(235, 'CAPPATALYA25', 22, 'Stripe Top-up', 68000, 'income', '2025-09-09'),
(236, 'CAPPATALYA25', 22, 'Stripe Top-up', 68000, 'income', '2025-09-10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `role` enum('user','admin') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT 'user',
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `email`, `token`, `is_active`) VALUES
(2, 'mistenes', '$2y$10$nJKRqP6guaVKQCR7NLtEQuT5O5IGK3GEB74DgIWArswUgru.zuSIi', 'admin', 'mistenes@me.com', '307B01BDCC429D0ACA535425751828B8DDDE27604CD1E77675427C5A1C7BF603', 1),
(3, 'user', '$2y$10$oDpuN4JKVSc5y12j4z1NI.l1g2ev8ez2FdrZg/J/S8gJcrr8nJTse', 'user', 'user@user.co', '20AD5225DF0ED3709525A6A7E5B0737B14E14C0C5495BBDE1FD60CFABFA17CA6', 1),
(5, 'testuser', '$2y$10$/K/QtqLzhucpFjhslgijOeB0dV1AZssuWUm0fzBcayJdbKJG1y2Bm', 'user', 'test@test.com', '21039495F751537E2868659575D38817AB1162F47092E8A62116A3E5CB7A7BAA', 1),
(6, 'register', '$2y$10$EP4uQwAEbsLqswUHM/EOG.s1AqUu1.mHWYbsjuVDuVqB.zpoHnXYm', 'user', 'register@regsiter.co', 'D359F8FAFFA9443571C0DE69E77AD1372EE0E7D6B566D65E47F82417DC6631AA', 1),
(7, 'mistenesfolder', '$2y$10$4y0y0gH6Ngk3bumF2EOL0.dcQvCsIYRv4CSr/EZdxyPpzLXiItg3m', 'user', 'folder@folder.com', '3EB78656EF9840BB6F36489E806DF8AE2010B271723516EB68A54BB533ADF14A', 1),
(8, 'foldertest', '$2y$10$HnGWTu/9pPj8CRem0hnYZeW6gv9KO0Fap7v7EJV8AOA/EQPqQyHsi', 'user', 'foldertest@foldertest.co', '14919CF3A0FC029085EA05C32FD0864200DE8C98781894D759CB773D7ECB9DD2', 1),
(9, 'istenesmate', '$2y$10$nuOLl/haiNmBWQIGxu1NqOmTxOndN2NLbhgV/4F4Tw4LRSqjwikQu', 'user', 'mistenes@mistenes.com', '47EC468AC7935C9792DA381BF130CD7A544DBA83B321BEFD9153E2E851D15ACD', 1),
(10, 'HWG', '$2y$10$SfO7wpmd9pbo28P5q0OtRe73l/mm.mCE75rTZtelY2ceQTqYKZewi', 'user', 'gergharis@gmail.com', 'C5724197B9D28A436A276F27653267EEE3D898BAE57ADBD27B2E208B679ED01F', 1),
(11, 'FanTom99', '$2y$10$rRRYVEKPTStUtmO6.anxv.TrWiLmpOJNgEPppLswgeDaPixM789Oy', 'user', 'kovacstom99@gmail.com', '7CD81DB8649C57463B45E421DD40C203AF0CE5F9CB82660FDBD3CD50ED8F66BB', 1),
(12, 'Doki', '$2y$10$MmDadfQ9P2YXlmhJYHSzne4E8qavHMjuzt5h4FKQrR5mBQ65/K/96', 'user', 'mate.doki19@gmail.com', 'E062A7D7307EC8A6BF9514EC0161BD0306F7F09A40F66680DA8AD7123406C2BE', 1),
(13, 'AndrasBoth', '$2y$10$F1a9TUgBHippkMokG8UsxudnNks2HTsfmG7ExsUTEcKxPOSusw0F2', 'user', 'bundas1999@gmail.com', 'CBE3FC584399E49CB03C24026190D389EC74411629D7117D1A170A36A6202A1A', 1),
(14, 'szijjadrian', '$2y$10$uWZvWw8Q3hq0pzl7Z06DaO5uhYDH9OFb94mLVX0u9.ELe8YOz2nwq', 'user', 'szijjadrian23@gmail.com', 'D72D2FF34B5FBA1A141B95D35294EB82BF83460BB34D81B420CC978E0F42CEBB', 1),
(18, 'kukk', '$2y$10$v5BUhLTtZqaiS9OI6IQs5eflwN5bXGCHztjoWMaRCLt2KnedpUy3e', 'user', 'mistenes98@gmail.com', NULL, 1),
(19, 'japantest', '$2y$10$SCA7/6n.YmH2ztVdSdk67umLDEvsPtaDcNB2EJO58oBxUqSQHYX6K', 'user', 'japantest@test.com', '057b337bac036c4fa8ff85a3ad38eebe6e291a41dc39729a8c10cc47c92269a2', 1),
(20, 'Kuris', '$2y$10$n0Ixvp4PSORgy3DlcbDixublEfiMfNY/fhw.PI9UXVxeoPHURYOpa', 'user', 'tnatesco@gmail.com', NULL, 1),
(21, 'Eszter0214', '$2y$10$8jGOYb.7iq0jlAhkW6oWYejRUorGxqG4T6UkaC32hQFgkLxAUjV0u', 'user', 'csiszar.eszter@gmail.com', NULL, 1),
(22, 'olmosiaron', '$2y$10$YvLoFtOash5GtlCKNlx3Pe6MtV.JR12BvS3V.f7W3qFVgm8mGPCZS', 'user', 'olmosiaron@gmail.com', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_forms`
--

CREATE TABLE `user_forms` (
  `id` int NOT NULL,
  `trip_id` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `field_id` int NOT NULL,
  `value` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `submitted_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `user_forms`
--

INSERT INTO `user_forms` (`id`, `trip_id`, `user_id`, `field_id`, `value`, `submitted_at`) VALUES
(1, 'POKIO25', 9, 1, 'Mate', '2024-11-28 17:57:45'),
(2, 'POKIO25', 9, 2, 'Istenes', '2024-11-28 17:57:45'),
(3, 'POKIO25', 9, 3, '', '2024-11-28 17:57:45'),
(4, 'POKIO25', 9, 4, 'BJ2237328', '2024-11-28 17:57:45'),
(5, 'POKIO25', 9, 5, '2020-03-18', '2024-11-28 17:57:45'),
(6, 'POKIO25', 9, 6, 'Hungary', '2024-11-28 17:57:45'),
(7, 'POKIO25', 9, 7, '2027-03-18', '2024-11-28 17:57:45'),
(8, 'POKIO25', 9, 8, 'Hungary', '2024-11-28 17:57:45'),
(9, 'POKIO25', 9, 9, 'M', '2024-11-28 17:57:45');

-- --------------------------------------------------------

--
-- Table structure for table `user_trips`
--

CREATE TABLE `user_trips` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `trip_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `subscription_token` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `assigned_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `user_trips`
--

INSERT INTO `user_trips` (`id`, `user_id`, `trip_id`, `subscription_token`, `assigned_date`) VALUES
(2, 3, 'MSC2024GRAND1', 'ede7ea89-a672-11ef-9acc-ecf4bbed17a8', '2024-11-04 23:29:48'),
(3, 8, 'MSC2024GRAND1', 'ede7ed48-a672-11ef-9acc-ecf4bbed17a8', '2024-11-08 21:29:48'),
(4, 8, 'MSC1', 'ede7ee40-a672-11ef-9acc-ecf4bbed17a8', '2024-11-13 22:41:43'),
(7, 10, 'MSCGRAND2024', 'ede7ef1d-a672-11ef-9acc-ecf4bbed17a8', '2024-11-14 18:52:54'),
(8, 11, 'MSCGRAND2024', 'ede7efeb-a672-11ef-9acc-ecf4bbed17a8', '2024-11-14 19:44:49'),
(9, 12, 'MSCGRAND2024', 'ede7f0a8-a672-11ef-9acc-ecf4bbed17a8', '2024-11-14 19:54:34'),
(11, 9, 'MSCGRAND2024', 'ede7f167-a672-11ef-9acc-ecf4bbed17a8', '2024-11-14 21:51:08'),
(12, 13, 'MSCGRAND2024', 'ede7f225-a672-11ef-9acc-ecf4bbed17a8', '2024-11-15 06:54:21'),
(13, 14, 'MSCGRAND2024', 'ede7f2e4-a672-11ef-9acc-ecf4bbed17a8', '2024-11-15 19:27:28'),
(14, 9, 'POKIO25', '41e0f309ba3497fc53da09a6a6f6ef22efc34a05182972960a1d13c65047df20', '2024-11-28 11:01:40'),
(15, 9, 'MSC2024GRAND1', '61ca7a35a19bdfb3ae49bd83c623f22ecb3bb1713e19eecf491f67c63ff50440', '2024-11-28 16:42:33'),
(18, 19, 'POKIO25', 'b8ce05436abdc81e77565ec4c89e12aa39aa205a09f5c5083e75c5d01010d7d6', '2024-12-10 09:29:44'),
(19, 20, 'Pokio25', '36bc0a964a11239bcdce3da68e97d94eb108fab93579db602fc470ad6b351314', '2024-12-10 17:44:04'),
(20, 21, 'POKIO25', '9f88cbb08a77f3a70f342a7d39a18e5aa170afa0cfe5d65dfa49a009d495640c', '2024-12-17 17:51:07'),
(21, 9, 'CAPPATALYA25', NULL, '2025-02-24 09:09:23'),
(22, 22, 'CAPPATALYA25', '82e50331a0d4e1afa62acfe7f93c6315383305d836f2c100dc26c112394a1eab', '2025-02-24 09:16:02'),
(23, 21, 'CAPPATALYA25', NULL, '2025-02-24 09:26:49');

-- --------------------------------------------------------

--
-- Table structure for table `user_trip_documents`
--

CREATE TABLE `user_trip_documents` (
  `id` int NOT NULL,
  `trip_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `filepath` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `user_trip_documents`
--

INSERT INTO `user_trip_documents` (`id`, `trip_id`, `user_id`, `filename`, `filepath`, `upload_date`, `category`) VALUES
(1, 'MSC2024GRAND1', 3, 'itinerary.png', 'user_files/user/itinerary.png', '2024-11-08 21:24:53', 'General'),
(2, 'MSC2024GRAND1', 8, 'mytrip.png', 'user_files/foldertest/mytrip.png', '2024-11-08 21:30:19', 'General'),
(4, 'MSCGRAND2024', 10, 'GERGO_HARIS_WELDIN-56954791-Cruise_Ticket.pdf', 'user_files/HWG/GERGO_HARIS_WELDIN-56954791-Cruise_Ticket.pdf', '2024-11-14 19:13:26', 'General'),
(5, 'MSCGRAND2024', 10, 'Trip Summary.pdf', 'user_files/HWG/Trip Summary.pdf', '2024-11-14 19:13:57', 'General'),
(9, 'MSCGRAND2024', 12, 'Trip Summary.pdf', 'user_files/Doki/Trip Summary.pdf', '2024-11-14 19:58:09', 'General'),
(10, 'MSCGRAND2024', 11, 'Trip Summary.pdf', 'user_files/FanTom99/Trip Summary.pdf', '2024-11-14 19:58:15', 'General'),
(11, 'MSCGRAND2024', 12, 'MATE_DOKTOR-57006916-Cruise_Ticket.pdf', 'user_files/Doki/MATE_DOKTOR-57006916-Cruise_Ticket.pdf', '2024-11-14 19:59:06', 'General'),
(12, 'MSCGRAND2024', 11, 'TAMAS_KOVACS-57006916-Cruise_Ticket.pdf', 'user_files/FanTom99/TAMAS_KOVACS-57006916-Cruise_Ticket.pdf', '2024-11-14 19:59:19', 'General'),
(13, 'MSCGRAND2024', 10, 'GERGO HARIS WELDIN_BUDZRH.pdf', 'user_files/HWG/GERGO HARIS WELDIN_BUDZRH.pdf', '2024-11-15 05:49:30', 'General'),
(14, 'MSCGRAND2024', 10, 'GERGO HARIS WELDIN_BUDZRH.pkpass', 'user_files/HWG/GERGO HARIS WELDIN_BUDZRH.pkpass', '2024-11-15 05:49:49', 'General'),
(15, 'MSCGRAND2024', 10, 'GERGO HARIS WELDIN_ZRHMXP.pdf', 'user_files/HWG/GERGO HARIS WELDIN_ZRHMXP.pdf', '2024-11-15 05:49:59', 'General'),
(16, 'MSCGRAND2024', 10, 'GERGO HARIS WELDIN_ZRHMXP.pkpass', 'user_files/HWG/GERGO HARIS WELDIN_ZRHMXP.pkpass', '2024-11-15 05:50:12', 'General'),
(17, 'MSCGRAND2024', 12, 'MATE DOKTOR_BUDZRH.pdf', 'user_files/Doki/MATE DOKTOR_BUDZRH.pdf', '2024-11-15 05:50:20', 'General'),
(18, 'MSCGRAND2024', 12, 'MATE DOKTOR_BUDZRH.pkpass', 'user_files/Doki/MATE DOKTOR_BUDZRH.pkpass', '2024-11-15 05:50:26', 'General'),
(19, 'MSCGRAND2024', 12, 'MATE DOKTOR_ZRHMXP.pdf', 'user_files/Doki/MATE DOKTOR_ZRHMXP.pdf', '2024-11-15 05:50:35', 'General'),
(20, 'MSCGRAND2024', 12, 'MATE DOKTOR_ZRHMXP.pkpass', 'user_files/Doki/MATE DOKTOR_ZRHMXP.pkpass', '2024-11-15 05:50:39', 'General'),
(21, 'MSCGRAND2024', 11, 'TAMAS KOVACS_BUDZRH.pdf', 'user_files/FanTom99/TAMAS KOVACS_BUDZRH.pdf', '2024-11-15 05:50:52', 'General'),
(22, 'MSCGRAND2024', 11, 'TAMAS KOVACS_BUDZRH.pkpass', 'user_files/FanTom99/TAMAS KOVACS_BUDZRH.pkpass', '2024-11-15 05:50:57', 'General'),
(23, 'MSCGRAND2024', 11, 'TAMAS KOVACS_ZRHMXP.pdf', 'user_files/FanTom99/TAMAS KOVACS_ZRHMXP.pdf', '2024-11-15 05:51:03', 'General'),
(24, 'MSCGRAND2024', 11, 'TAMAS KOVACS_ZRHMXP.pkpass', 'user_files/FanTom99/TAMAS KOVACS_ZRHMXP.pkpass', '2024-11-15 05:51:13', 'General'),
(25, 'MSCGRAND2024', 13, 'ANDRAS BOTH_BUDZRH.pdf', 'user_files/AndrasBoth/ANDRAS BOTH_BUDZRH.pdf', '2024-11-15 07:20:51', 'General'),
(26, 'MSCGRAND2024', 13, 'ANDRAS BOTH_BUDZRH.pkpass', 'user_files/AndrasBoth/ANDRAS BOTH_BUDZRH.pkpass', '2024-11-15 07:21:03', 'General'),
(27, 'MSCGRAND2024', 13, 'ANDRAS BOTH_ZRHMXP.pdf', 'user_files/AndrasBoth/ANDRAS BOTH_ZRHMXP.pdf', '2024-11-15 07:21:24', 'General'),
(28, 'MSCGRAND2024', 13, 'ANDRAS BOTH_ZRHMXP.pkpass', 'user_files/AndrasBoth/ANDRAS BOTH_ZRHMXP.pkpass', '2024-11-15 07:21:29', 'General'),
(30, 'MSCGRAND2024', 13, 'Trip Summary.pdf', 'user_files/AndrasBoth/Trip Summary.pdf', '2024-11-15 07:21:59', 'General'),
(31, 'MSCGRAND2024', 13, 'ANDRASBOTH-56954849-Cruise_Ticket.pdf', 'user_files/AndrasBoth/ANDRASBOTH-56954849-Cruise_Ticket.pdf', '2024-11-15 07:22:34', 'General'),
(32, 'MSCGRAND2024', 14, 'ADRIANSANDOR_SZIJJ-56954849-Cruise_Ticket.pdf', 'user_files/szijjadrian/ADRIANSANDOR_SZIJJ-56954849-Cruise_Ticket.pdf', '2024-11-15 19:32:58', 'General'),
(33, 'MSCGRAND2024', 14, 'Trip Summary.pdf', 'user_files/szijjadrian/Trip Summary.pdf', '2024-11-15 19:33:06', 'General'),
(34, 'MSCGRAND2024', 14, 'ADRIAN SANDOR SZIJJ_ZRHMXP.pdf', 'user_files/szijjadrian/ADRIAN SANDOR SZIJJ_ZRHMXP.pdf', '2024-11-15 19:33:34', 'General'),
(35, 'MSCGRAND2024', 14, 'ADRIAN SANDOR SZIJJ_BUDZRH.pdf', 'user_files/szijjadrian/ADRIAN SANDOR SZIJJ_BUDZRH.pdf', '2024-11-15 19:33:46', 'General'),
(36, 'MSCGRAND2024', 14, 'ADRIAN SANDOR SZIJJ_BUDZRH.pkpass', 'user_files/szijjadrian/ADRIAN SANDOR SZIJJ_BUDZRH.pkpass', '2024-11-15 19:36:48', 'General'),
(37, 'MSCGRAND2024', 14, 'ADRIAN SANDOR SZIJJ_ZRHMXP.pkpass', 'user_files/szijjadrian/ADRIAN SANDOR SZIJJ_ZRHMXP.pkpass', '2024-11-15 19:36:55', 'General'),
(48, 'MSCGRAND2024', 9, 'ISTNESMATE.pkpass', 'user_files/9/ISTNESMATE.pkpass', '2024-11-19 22:28:08', 'Boarding Passes'),
(49, 'MSCGRAND2024', 9, 'MATE_ISTENES.pdf', 'user_files/9/MATE_ISTENES.pdf', '2024-11-19 22:28:08', 'Boarding Passes'),
(50, 'CAPPATALYA25', 22, 'tk budayt.pdf', 'user_files/22/tk budayt.pdf', '2025-02-24 09:26:07', 'Tickets'),
(51, 'CAPPATALYA25', 21, 'tk budayt.pdf', 'user_files/21/tk budayt.pdf', '2025-02-24 09:28:07', 'Tickets'),
(52, 'POKIO25', 21, 'CSE_BUD_MXP_Wizz Air.pkpass', 'user_files/21/CSE_BUD_MXP_Wizz Air.pkpass', '2025-02-25 07:43:44', 'Boarding Passes'),
(53, 'POKIO25', 21, 'CSE_BUD_MXP_Wizz Air.pdf', 'user_files/21/CSE_BUD_MXP_Wizz Air.pdf', '2025-02-25 07:43:44', 'Boarding Passes'),
(54, 'POKIO25', 20, 'KD_BUD_MXP_Wizz Air.pdf', 'user_files/20/KD_BUD_MXP_Wizz Air.pdf', '2025-02-25 07:43:59', 'Boarding Passes'),
(55, 'POKIO25', 20, 'KD_BUD_MXP_Wizz Air.pkpass', 'user_files/20/KD_BUD_MXP_Wizz Air.pkpass', '2025-02-25 07:43:59', 'Boarding Passes'),
(56, 'CAPPATALYA25', 21, 'Trip_Itinerary_Sep_2025.pdf', 'user_files/21/Trip_Itinerary_Sep_2025.pdf', '2025-07-22 08:20:01', 'Tickets'),
(57, 'CAPPATALYA25', 22, 'Trip_Itinerary_Sep_2025.pdf', 'user_files/22/Trip_Itinerary_Sep_2025.pdf', '2025-07-22 08:20:10', 'General');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`token_hash`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `calendars`
--
ALTER TABLE `calendars`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `form_fields`
--
ALTER TABLE `form_fields`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `message_status`
--
ALTER TABLE `message_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `trip_id` (`trip_id`);

--
-- Indexes for table `trip_financials`
--
ALTER TABLE `trip_financials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trip_id` (`trip_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_forms`
--
ALTER TABLE `user_forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `field_id` (`field_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `user_trips`
--
ALTER TABLE `user_trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `user_trip_documents`
--
ALTER TABLE `user_trip_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trip_id` (`trip_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `calendars`
--
ALTER TABLE `calendars`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `form_fields`
--
ALTER TABLE `form_fields`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `message_status`
--
ALTER TABLE `message_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `trip_financials`
--
ALTER TABLE `trip_financials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=237;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user_forms`
--
ALTER TABLE `user_forms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_trips`
--
ALTER TABLE `user_trips`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `user_trip_documents`
--
ALTER TABLE `user_trip_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `message_status`
--
ALTER TABLE `message_status`
  ADD CONSTRAINT `message_status_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`),
  ADD CONSTRAINT `message_status_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `trip_financials`
--
ALTER TABLE `trip_financials`
  ADD CONSTRAINT `trip_financials_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trip_financials_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_forms`
--
ALTER TABLE `user_forms`
  ADD CONSTRAINT `user_forms_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`id`),
  ADD CONSTRAINT `user_forms_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`);

--
-- Constraints for table `user_trips`
--
ALTER TABLE `user_trips`
  ADD CONSTRAINT `user_trips_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_trips_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_trip_documents`
--
ALTER TABLE `user_trip_documents`
  ADD CONSTRAINT `user_trip_documents_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_trip_documents_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
