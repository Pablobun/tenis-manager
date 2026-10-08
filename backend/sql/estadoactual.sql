/*
SQLyog Ultimate v11.11 (64 bit)
MySQL - 8.0.46-0ubuntu0.22.04.4 : Database - tenisriverside
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`tenisriverside` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `tenisriverside`;

/*Table structure for table `asistencias` */

DROP TABLE IF EXISTS `asistencias`;

CREATE TABLE `asistencias` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `alumno_id` bigint unsigned NOT NULL,
  `instancia_id` bigint unsigned NOT NULL,
  `asistio` tinyint(1) NOT NULL DEFAULT '1',
  `registrada_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alumno_instancia_asist` (`alumno_id`,`instancia_id`),
  KEY `instancia_id` (`instancia_id`),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`alumno_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`instancia_id`) REFERENCES `instancias_clases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;

/*Data for the table `asistencias` */

/*Table structure for table `ciclos_facturacion` */

DROP TABLE IF EXISTS `ciclos_facturacion`;

CREATE TABLE `ciclos_facturacion` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mes_anio` varchar(7) NOT NULL,
  `estado` enum('abierto','cerrado') DEFAULT 'abierto',
  `abierto_en` datetime DEFAULT NULL,
  `cerrado_en` datetime DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mes_anio` (`mes_anio`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;

/*Data for the table `ciclos_facturacion` */

insert  into `ciclos_facturacion`(`id`,`mes_anio`,`estado`,`abierto_en`,`cerrado_en`,`creado_en`) values (1,'2026-08','cerrado','2026-08-12 22:19:08','2026-08-13 23:03:30','2026-08-12 22:19:08'),(2,'2026-09','abierto','2026-08-13 23:03:30',NULL,'2026-08-13 23:03:30'),(3,'2026-07','cerrado','2026-07-14 00:00:00','2026-08-14 00:00:00','2026-08-14 15:40:42');

/*Table structure for table `deudas` */

DROP TABLE IF EXISTS `deudas`;

CREATE TABLE `deudas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `alumno_id` bigint unsigned NOT NULL,
  `instancia_id` bigint unsigned DEFAULT NULL,
  `tipo_deuda` enum('mensualidad','clase_extra','clase_abierta') NOT NULL,
  `mes_facturacion` varchar(7) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `monto_pagado` decimal(10,2) DEFAULT '0.00',
  `estado` enum('pendiente','parcial','pagada','anulada') DEFAULT 'pendiente',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `instancia_id` (`instancia_id`),
  KEY `idx_deudas_alumno` (`alumno_id`),
  KEY `idx_deudas_mes` (`mes_facturacion`),
  CONSTRAINT `deudas_ibfk_1` FOREIGN KEY (`alumno_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deudas_ibfk_2` FOREIGN KEY (`instancia_id`) REFERENCES `instancias_clases` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3;

/*Data for the table `deudas` */

insert  into `deudas`(`id`,`alumno_id`,`instancia_id`,`tipo_deuda`,`mes_facturacion`,`monto`,`monto_pagado`,`estado`,`creado_en`,`actualizado_en`) values (1,3,25,'mensualidad','2026-08',15000.00,60000.00,'pagada','2026-08-13 00:04:19','2026-08-13 20:44:01'),(2,3,66,'mensualidad','2026-08',25000.00,45000.00,'pagada','2026-08-13 10:57:05','2026-08-13 23:02:18'),(3,3,NULL,'clase_extra','2026-08',12500.00,0.00,'pendiente','2026-08-13 23:14:21','2026-08-13 23:14:21'),(4,8,NULL,'mensualidad','2026-08',30000.00,30000.00,'pagada','2026-08-14 15:40:19','2026-09-04 15:56:47'),(5,9,NULL,'mensualidad','2026-08',30000.00,10000.00,'parcial','2026-08-14 15:40:23','2026-08-14 15:40:23'),(6,10,NULL,'mensualidad','2026-08',32000.00,32000.00,'pagada','2026-08-14 15:40:27','2026-08-14 15:40:27'),(7,14,NULL,'mensualidad','2026-07',24000.00,0.00,'pendiente','2026-08-14 15:40:31','2026-08-14 15:40:31'),(8,17,NULL,'clase_extra','2026-08',2500.00,0.00,'pendiente','2026-08-14 15:40:33','2026-08-14 15:40:33'),(9,11,184,'mensualidad','2026-09',8000.00,0.00,'pendiente','2026-09-04 15:48:50','2026-09-04 15:48:50'),(10,14,184,'mensualidad','2026-09',8000.00,0.00,'pendiente','2026-09-04 15:49:02','2026-09-04 15:49:02'),(11,3,184,'mensualidad','2026-09',8000.00,8000.00,'pagada','2026-09-04 15:49:11','2026-09-04 15:49:12'),(12,18,267,'mensualidad','2026-10',20.00,0.00,'pendiente','2026-10-07 02:02:23','2026-10-07 02:02:23'),(13,19,267,'mensualidad','2026-10',20.00,20.00,'pagada','2026-10-07 02:02:34','2026-10-07 02:02:34'),(14,8,267,'mensualidad','2026-10',20.00,20.00,'pagada','2026-10-07 02:03:17','2026-10-07 11:17:22'),(15,14,268,'mensualidad','2026-10',20.00,0.00,'pendiente','2026-10-08 10:19:00','2026-10-08 10:19:00'),(16,15,NULL,'clase_abierta','2026-10',3000.00,0.00,'pendiente','2026-10-08 10:20:03','2026-10-08 10:20:03'),(17,19,NULL,'clase_abierta','2026-10',3000.00,3000.00,'pagada','2026-10-08 10:20:03','2026-10-08 10:20:03'),(18,12,NULL,'clase_abierta','2026-10',3000.00,0.00,'pendiente','2026-10-08 10:21:52','2026-10-08 10:21:52'),(19,14,273,'mensualidad','2026-10',15000.00,0.00,'pendiente','2026-10-08 10:48:57','2026-10-08 10:48:57'),(20,13,273,'mensualidad','2026-10',15000.00,15000.00,'pagada','2026-10-08 10:49:19','2026-10-08 10:49:20'),(21,8,273,'mensualidad','2026-10',15000.00,15000.00,'pagada','2026-10-08 10:49:37','2026-10-08 17:16:44');

/*Table structure for table `grupo_alumnos` */

DROP TABLE IF EXISTS `grupo_alumnos`;

CREATE TABLE `grupo_alumnos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `grupo_id` bigint unsigned NOT NULL,
  `alumno_id` bigint unsigned NOT NULL,
  `inscripto_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_grupo_alumno` (`grupo_id`,`alumno_id`),
  KEY `idx_grupo_alumnos_alumno` (`alumno_id`),
  CONSTRAINT `grupo_alumnos_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grupo_alumnos_ibfk_2` FOREIGN KEY (`alumno_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb3;

/*Data for the table `grupo_alumnos` */

insert  into `grupo_alumnos`(`id`,`grupo_id`,`alumno_id`,`inscripto_en`) values (5,5,3,'2026-08-13 00:04:19'),(6,6,3,'2026-08-13 10:57:05'),(8,8,8,'2026-08-14 15:39:37'),(9,9,8,'2026-08-14 15:39:37'),(10,10,8,'2026-08-14 15:39:37'),(11,11,8,'2026-08-14 15:39:37'),(12,12,8,'2026-08-14 15:39:37'),(15,8,9,'2026-08-14 15:39:39'),(16,9,9,'2026-08-14 15:39:39'),(17,10,9,'2026-08-14 15:39:39'),(18,11,9,'2026-08-14 15:39:39'),(19,12,9,'2026-08-14 15:39:39'),(22,17,10,'2026-08-14 15:39:41'),(23,18,10,'2026-08-14 15:39:41'),(24,19,10,'2026-08-14 15:39:41'),(25,20,10,'2026-08-14 15:39:41'),(29,13,11,'2026-08-14 15:39:43'),(30,14,11,'2026-08-14 15:39:43'),(31,15,11,'2026-08-14 15:39:43'),(32,16,11,'2026-08-14 15:39:43'),(37,25,11,'2026-09-04 15:48:49'),(38,25,14,'2026-09-04 15:49:02'),(39,25,3,'2026-09-04 15:49:11'),(42,28,18,'2026-10-07 02:02:23'),(43,28,19,'2026-10-07 02:02:33'),(44,28,8,'2026-10-07 02:03:17'),(49,32,14,'2026-10-08 10:19:00'),(51,33,14,'2026-10-08 10:48:57'),(53,33,13,'2026-10-08 10:49:19'),(55,34,8,'2026-10-08 17:16:58');

/*Table structure for table `grupos` */

DROP TABLE IF EXISTS `grupos`;

CREATE TABLE `grupos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `instancia_id` bigint unsigned NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `instancia_id` (`instancia_id`),
  CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`instancia_id`) REFERENCES `instancias_clases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3;

/*Data for the table `grupos` */

insert  into `grupos`(`id`,`instancia_id`,`nombre`,`creado_en`) values (5,25,'Grupo Principal','2026-08-13 00:04:19'),(6,66,'Grupo Principal','2026-08-13 10:57:05'),(8,147,'Grupo Principal','2026-08-14 15:39:34'),(9,150,'Grupo Principal','2026-08-14 15:39:34'),(10,153,'Grupo Principal','2026-08-14 15:39:34'),(11,156,'Grupo Principal','2026-08-14 15:39:34'),(12,159,'Grupo Principal','2026-08-14 15:39:34'),(13,148,'Grupo Principal','2026-08-14 15:39:34'),(14,151,'Grupo Principal','2026-08-14 15:39:34'),(15,154,'Grupo Principal','2026-08-14 15:39:34'),(16,157,'Grupo Principal','2026-08-14 15:39:34'),(17,149,'Grupo Principal','2026-08-14 15:39:34'),(18,152,'Grupo Principal','2026-08-14 15:39:34'),(19,155,'Grupo Principal','2026-08-14 15:39:34'),(20,158,'Grupo Principal','2026-08-14 15:39:34'),(25,184,'Grupo Principal','2026-09-04 15:48:49'),(28,267,'Grupo Principal','2026-10-07 02:02:23'),(32,268,'Grupo Principal','2026-10-08 10:19:00'),(33,273,'Grupo Principal','2026-10-08 10:48:57'),(34,275,'Grupo Extra','2026-10-08 17:15:45');

/*Table structure for table `instancias_clases` */

DROP TABLE IF EXISTS `instancias_clases`;

CREATE TABLE `instancias_clases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plantilla_id` bigint unsigned NOT NULL,
  `profesor_id` bigint unsigned NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `nivel` enum('principiante','intermedio','avanzado') NOT NULL,
  `modalidad` enum('fija','extra','abierta') NOT NULL,
  `cupo_maximo` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `estado` enum('programada','completada','cancelada') DEFAULT 'programada',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plantilla_fecha` (`plantilla_id`,`fecha`),
  KEY `idx_instancias_fecha` (`fecha`),
  KEY `idx_instancias_profesor` (`profesor_id`),
  CONSTRAINT `instancias_clases_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_clases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `instancias_clases_ibfk_2` FOREIGN KEY (`profesor_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=294 DEFAULT CHARSET=utf8mb3;

/*Data for the table `instancias_clases` */

insert  into `instancias_clases`(`id`,`plantilla_id`,`profesor_id`,`fecha`,`hora_inicio`,`hora_fin`,`nivel`,`modalidad`,`cupo_maximo`,`precio`,`estado`,`creado_en`) values (24,3,1,'2026-08-04','14:00:00','15:00:00','intermedio','fija',4,15000.00,'programada','2026-08-12 14:40:38'),(25,3,1,'2026-08-11','14:00:00','15:00:00','intermedio','fija',4,15000.00,'programada','2026-08-12 14:40:38'),(26,3,1,'2026-08-18','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 14:40:38'),(27,3,1,'2026-08-25','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 14:40:38'),(65,6,1,'2026-08-07','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:42:33'),(66,6,1,'2026-08-14','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:42:33'),(67,6,1,'2026-08-21','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:42:33'),(68,6,1,'2026-08-28','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:42:33'),(100,3,1,'2026-09-01','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 22:44:02'),(101,3,1,'2026-09-08','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 22:44:02'),(102,3,1,'2026-09-15','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 22:44:02'),(103,3,1,'2026-09-22','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 22:44:02'),(104,3,1,'2026-09-29','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-08-12 22:44:02'),(109,6,1,'2026-09-04','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:44:02'),(110,6,1,'2026-09-11','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:44:02'),(111,6,1,'2026-09-18','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:44:02'),(112,6,1,'2026-09-25','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-08-12 22:44:02'),(147,7,6,'2026-08-03','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-08-14 15:39:32'),(148,8,7,'2026-08-05','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-08-14 15:39:32'),(149,9,6,'2026-08-07','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-08-14 15:39:32'),(150,7,6,'2026-08-10','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-08-14 15:39:32'),(151,8,7,'2026-08-12','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-08-14 15:39:32'),(152,9,6,'2026-08-14','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-08-14 15:39:32'),(153,7,6,'2026-08-17','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-08-14 15:39:32'),(154,8,7,'2026-08-19','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-08-14 15:39:32'),(155,9,6,'2026-08-21','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-08-14 15:39:32'),(156,7,6,'2026-08-24','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-08-14 15:39:32'),(157,8,7,'2026-08-26','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-08-14 15:39:32'),(158,9,6,'2026-08-28','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-08-14 15:39:32'),(159,7,6,'2026-08-31','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-08-14 15:39:32'),(176,7,6,'2026-09-07','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-09-04 15:44:21'),(177,7,6,'2026-09-14','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-09-04 15:44:21'),(178,7,6,'2026-09-21','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-09-04 15:44:21'),(179,7,6,'2026-09-28','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-09-04 15:44:21'),(180,8,7,'2026-09-09','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-09-04 15:44:21'),(181,8,7,'2026-09-16','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-09-04 15:44:21'),(182,8,7,'2026-09-23','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-09-04 15:44:21'),(183,8,7,'2026-09-30','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-09-04 15:44:21'),(184,9,6,'2026-09-04','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-09-04 15:44:21'),(185,9,6,'2026-09-11','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-09-04 15:44:21'),(186,9,6,'2026-09-18','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-09-04 15:44:21'),(187,9,6,'2026-09-25','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-09-04 15:44:21'),(236,12,6,'2026-09-07','14:00:00','15:30:00','avanzado','fija',4,20.00,'programada','2026-09-04 15:48:00'),(237,12,6,'2026-09-14','14:00:00','15:30:00','avanzado','fija',4,20.00,'programada','2026-09-04 15:48:00'),(238,12,6,'2026-09-21','14:00:00','15:30:00','avanzado','fija',4,20.00,'programada','2026-09-04 15:48:00'),(239,12,6,'2026-09-28','14:00:00','15:30:00','avanzado','fija',4,20.00,'programada','2026-09-04 15:48:00'),(245,3,1,'2026-10-06','14:00:00','15:00:00','intermedio','fija',4,15000.00,'programada','2026-09-04 15:59:05'),(246,3,1,'2026-10-13','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-09-04 15:59:05'),(247,3,1,'2026-10-20','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-09-04 15:59:05'),(248,3,1,'2026-10-27','14:00:00','15:00:00','intermedio','fija',4,15000.00,'cancelada','2026-09-04 15:59:05'),(249,6,1,'2026-10-02','19:42:00','20:42:00','avanzado','fija',4,25000.00,'programada','2026-09-04 15:59:05'),(250,6,1,'2026-10-09','19:42:00','20:42:00','avanzado','fija',4,25000.00,'cancelada','2026-09-04 15:59:05'),(251,6,1,'2026-10-16','19:42:00','20:42:00','avanzado','fija',4,25000.00,'cancelada','2026-09-04 15:59:05'),(252,6,1,'2026-10-23','19:42:00','20:42:00','avanzado','fija',4,25000.00,'cancelada','2026-09-04 15:59:05'),(253,6,1,'2026-10-30','19:42:00','20:42:00','avanzado','fija',4,25000.00,'cancelada','2026-09-04 15:59:05'),(254,7,6,'2026-10-05','18:00:00','19:00:00','intermedio','fija',6,6000.00,'programada','2026-09-04 15:59:05'),(255,7,6,'2026-10-12','18:00:00','19:00:00','intermedio','fija',6,6000.00,'cancelada','2026-09-04 15:59:05'),(256,7,6,'2026-10-19','18:00:00','19:00:00','intermedio','fija',6,6000.00,'cancelada','2026-09-04 15:59:05'),(257,7,6,'2026-10-26','18:00:00','19:00:00','intermedio','fija',6,6000.00,'cancelada','2026-09-04 15:59:05'),(258,8,7,'2026-10-07','19:00:00','20:00:00','principiante','fija',6,5000.00,'programada','2026-09-04 15:59:05'),(259,8,7,'2026-10-14','19:00:00','20:00:00','principiante','fija',6,5000.00,'cancelada','2026-09-04 15:59:05'),(260,8,7,'2026-10-21','19:00:00','20:00:00','principiante','fija',6,5000.00,'cancelada','2026-09-04 15:59:05'),(261,8,7,'2026-10-28','19:00:00','20:00:00','principiante','fija',6,5000.00,'cancelada','2026-09-04 15:59:05'),(262,9,6,'2026-10-02','17:00:00','18:00:00','avanzado','fija',4,8000.00,'programada','2026-09-04 15:59:05'),(263,9,6,'2026-10-09','17:00:00','18:00:00','avanzado','fija',4,8000.00,'cancelada','2026-09-04 15:59:05'),(264,9,6,'2026-10-16','17:00:00','18:00:00','avanzado','fija',4,8000.00,'cancelada','2026-09-04 15:59:05'),(265,9,6,'2026-10-23','17:00:00','18:00:00','avanzado','fija',4,8000.00,'cancelada','2026-09-04 15:59:05'),(266,9,6,'2026-10-30','17:00:00','18:00:00','avanzado','fija',4,8000.00,'cancelada','2026-09-04 15:59:05'),(267,12,6,'2026-10-05','14:00:00','15:30:00','avanzado','fija',4,20.00,'programada','2026-09-04 15:59:05'),(268,12,6,'2026-10-12','14:00:00','15:30:00','avanzado','fija',4,20.00,'cancelada','2026-09-04 15:59:05'),(269,12,6,'2026-10-19','14:00:00','15:30:00','avanzado','fija',4,20.00,'cancelada','2026-09-04 15:59:05'),(270,12,6,'2026-10-26','14:00:00','15:30:00','avanzado','fija',4,20.00,'cancelada','2026-09-04 15:59:05'),(272,15,6,'2026-10-12','12:00:00','13:00:00','principiante','fija',4,15000.00,'programada','2026-10-08 10:47:52'),(273,15,6,'2026-10-19','12:00:00','13:00:00','principiante','fija',4,15000.00,'programada','2026-10-08 10:47:52'),(274,15,6,'2026-10-26','12:00:00','13:00:00','principiante','fija',4,15000.00,'programada','2026-10-08 10:47:52'),(275,16,6,'2026-10-09','13:00:00','14:15:00','intermedio','extra',4,7500.00,'programada','2026-10-08 17:15:45'),(281,15,6,'2026-10-05','12:00:00','13:00:00','principiante','fija',4,15000.00,'programada','2026-10-08 17:27:09');

/*Table structure for table `pagos` */

DROP TABLE IF EXISTS `pagos`;

CREATE TABLE `pagos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `alumno_id` bigint unsigned NOT NULL,
  `deuda_id` bigint unsigned DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `nota` text,
  `registrado_por` bigint unsigned DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `deuda_id` (`deuda_id`),
  KEY `registrado_por` (`registrado_por`),
  KEY `idx_pagos_alumno` (`alumno_id`),
  KEY `idx_pagos_fecha` (`fecha_pago`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`alumno_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`deuda_id`) REFERENCES `deudas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `perfiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3;

/*Data for the table `pagos` */

insert  into `pagos`(`id`,`alumno_id`,`deuda_id`,`monto`,`fecha_pago`,`nota`,`registrado_por`,`creado_en`) values (1,3,NULL,15000.00,'2026-08-12',NULL,1,'2026-08-12 22:19:39'),(2,3,NULL,15000.00,'2026-08-12',NULL,1,'2026-08-12 22:19:42'),(3,3,1,60000.00,'2026-08-13',NULL,1,'2026-08-13 20:44:01'),(4,3,2,45000.00,'2026-08-13',NULL,5,'2026-08-13 23:02:18'),(5,9,5,10000.00,'2026-08-09','Pago parcial (demo)',6,'2026-08-14 15:40:35'),(6,10,6,32000.00,'2026-08-11','Pago completo (demo)',6,'2026-08-14 15:40:35'),(7,13,NULL,15000.00,'2026-08-08','Excedente → saldo a favor (demo)',6,'2026-08-14 15:40:35'),(8,19,NULL,5000.00,'2026-08-10','Excedente → saldo a favor (demo)',6,'2026-08-14 15:40:35'),(9,8,4,30000.00,'2026-09-04',NULL,5,'2026-09-04 15:56:47'),(10,8,14,20.00,'2026-10-07',NULL,6,'2026-10-07 11:17:22'),(11,8,21,15000.00,'2026-10-08',NULL,6,'2026-10-08 17:16:44');

/*Table structure for table `perfiles` */

DROP TABLE IF EXISTS `perfiles`;

CREATE TABLE `perfiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `saldo_a_favor` decimal(10,2) NOT NULL DEFAULT '0.00',
  `rol` enum('admin','profesor','alumno') NOT NULL DEFAULT 'alumno',
  `nivel` enum('principiante','intermedio','avanzado') DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3;

/*Data for the table `perfiles` */

insert  into `perfiles`(`id`,`email`,`password_hash`,`nombre_completo`,`telefono`,`saldo_a_favor`,`rol`,`nivel`,`activo`,`creado_en`,`actualizado_en`) values (1,'p.bunader@gmail.com','$2b$10$84cDr9fPo5VDOnJeKSheIu29XS.MEHCd.B4v1M/wd8Y7WyH5FUZq6','Pablo',NULL,0.00,'admin',NULL,1,'2026-08-12 13:51:00','2026-08-12 14:07:32'),(2,'pablo@tenismanager.com','$2b$10$cwSxNffy2DJLVbtV9zRSsOK9W61jwoh4zE..njoCjndh6w7wfbX5','Pablo',NULL,0.00,'admin',NULL,1,'2026-08-12 14:01:37','2026-08-12 14:01:37'),(3,'p.prueba@gmail.com','$2b$10$sXf8BatdQ43d8PlQ6ZFJle5ekCNWFpqLZ4t53I.hregD16qyV2tl.','Pablo BUnader','3586001358',22000.00,'alumno','avanzado',1,'2026-08-12 14:08:50','2026-09-04 15:49:12'),(5,'pablo@profe.com','$2b$10$sXf8BatdQ43d8PlQ6ZFJle5ekCNWFpqLZ4t53I.hregD16qyV2tl.','Profe','11111',0.00,'profesor',NULL,1,'2026-08-13 22:59:58','2026-08-13 23:00:25'),(6,'demo.profe1@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Carolina Martínez','3510000001',0.00,'profesor',NULL,1,'2026-08-14 15:38:42','2026-08-14 15:38:42'),(7,'demo.profe2@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Sofía Rodríguez','3510000002',0.00,'profesor',NULL,1,'2026-08-14 15:38:47','2026-08-14 15:38:47'),(8,'demo.ana@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Ana García','3511000001',0.00,'alumno','principiante',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(9,'demo.bruno@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Bruno Pérez','3511000002',0.00,'alumno','intermedio',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(10,'demo.carla@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Carla Díaz','3511000003',0.00,'alumno','avanzado',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(11,'demo.diego@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Diego Fernández','3511000004',0.00,'alumno','principiante',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(12,'demo.elena@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Elena Ruiz','3511000005',0.00,'alumno','intermedio',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(13,'demo.facundo@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Facundo Torres','3511000006',0.00,'alumno','avanzado',1,'2026-08-14 15:38:52','2026-10-08 10:49:20'),(14,'demo.gabriela@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Gabriela López','3511000007',0.00,'alumno','principiante',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(15,'demo.hugo@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Hugo Medina','3511000008',0.00,'alumno','intermedio',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(16,'demo.irene@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Irene Castro','3511000009',0.00,'alumno','avanzado',1,'2026-08-14 15:38:52','2026-08-14 15:38:52'),(17,'demo.javier@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Javier Soto','3511000010',0.00,'alumno','principiante',0,'2026-08-14 15:38:52','2026-09-04 16:00:50'),(18,'demo.karina@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Karina Vega','3511000011',0.00,'alumno','principiante',1,'2026-08-14 15:38:52','2026-09-04 16:00:44'),(19,'demo.lucia@tenismanager.com','$2b$10$CEyEIZDLLxpkDY6MXDil0utBijlWaxMennyd.30fPQazHXYcMSXEW','Lucía Molina','3511000012',1980.00,'alumno','intermedio',1,'2026-08-14 15:38:52','2026-10-08 10:20:03');

/*Table structure for table `plantilla_alumnos` */

DROP TABLE IF EXISTS `plantilla_alumnos`;

CREATE TABLE `plantilla_alumnos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plantilla_id` bigint unsigned NOT NULL,
  `alumno_id` bigint unsigned NOT NULL,
  `agregado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plantilla_alumno` (`plantilla_id`,`alumno_id`),
  KEY `alumno_id` (`alumno_id`),
  CONSTRAINT `plantilla_alumnos_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_clases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plantilla_alumnos_ibfk_2` FOREIGN KEY (`alumno_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;

/*Data for the table `plantilla_alumnos` */

insert  into `plantilla_alumnos`(`id`,`plantilla_id`,`alumno_id`,`agregado_en`) values (1,6,10,'2026-10-08 17:28:22'),(2,6,9,'2026-10-08 17:28:22'),(3,6,11,'2026-10-08 17:28:22'),(4,6,12,'2026-10-08 17:28:22');

/*Table structure for table `plantillas_clases` */

DROP TABLE IF EXISTS `plantillas_clases`;

CREATE TABLE `plantillas_clases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `profesor_id` bigint unsigned NOT NULL,
  `dia_semana` tinyint DEFAULT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `nivel` enum('principiante','intermedio','avanzado') DEFAULT NULL,
  `modalidad` enum('fija','extra','abierta') NOT NULL,
  `cupo_maximo` int NOT NULL DEFAULT '4',
  `precio_por_clase` decimal(10,2) NOT NULL,
  `frecuencia` int DEFAULT '1',
  `inicio_mes` int DEFAULT '1',
  `fin_mes` int DEFAULT '31',
  `activa` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `profesor_id` (`profesor_id`),
  CONSTRAINT `plantillas_clases_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plantillas_clases_chk_1` CHECK ((`dia_semana` between 0 and 6))
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;

/*Data for the table `plantillas_clases` */

insert  into `plantillas_clases`(`id`,`profesor_id`,`dia_semana`,`hora_inicio`,`hora_fin`,`nivel`,`modalidad`,`cupo_maximo`,`precio_por_clase`,`frecuencia`,`inicio_mes`,`fin_mes`,`activa`,`creado_en`) values (3,1,1,'14:00:00','15:00:00','intermedio','fija',4,15000.00,1,1,31,0,'2026-08-12 14:40:38'),(6,1,4,'19:42:00','20:42:00','avanzado','fija',4,25000.00,2,1,31,1,'2026-08-12 22:42:32'),(7,6,0,'18:00:00','19:00:00','intermedio','fija',6,6000.00,1,1,31,0,'2026-08-14 15:39:18'),(8,7,2,'19:00:00','20:00:00','principiante','fija',6,5000.00,1,1,31,0,'2026-08-14 15:39:22'),(9,6,4,'17:00:00','18:00:00','avanzado','fija',4,8000.00,1,1,31,0,'2026-08-14 15:39:27'),(12,6,0,'14:00:00','15:30:00','avanzado','fija',4,20.00,1,1,31,0,'2026-09-04 15:47:59'),(15,6,0,'12:00:00','13:00:00','principiante','fija',4,15000.00,1,1,31,1,'2026-10-08 10:47:52'),(16,6,4,'13:00:00','14:15:00','intermedio','extra',4,7500.00,1,1,31,0,'2026-10-08 17:15:45');

/*Table structure for table `postulaciones` */

DROP TABLE IF EXISTS `postulaciones`;

CREATE TABLE `postulaciones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `alumno_id` bigint unsigned NOT NULL,
  `instancia_id` bigint unsigned NOT NULL,
  `estado` enum('pendiente','aceptada','rechazada','lista_espera','cancelada') DEFAULT 'pendiente',
  `postulada_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `respondida_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alumno_instancia` (`alumno_id`,`instancia_id`),
  KEY `idx_postulaciones_alumno` (`alumno_id`),
  KEY `idx_postulaciones_instancia` (`instancia_id`),
  CONSTRAINT `postulaciones_ibfk_1` FOREIGN KEY (`alumno_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `postulaciones_ibfk_2` FOREIGN KEY (`instancia_id`) REFERENCES `instancias_clases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3;

/*Data for the table `postulaciones` */

insert  into `postulaciones`(`id`,`alumno_id`,`instancia_id`,`estado`,`postulada_en`,`respondida_en`) values (9,18,267,'aceptada','2026-10-07 02:02:23','2026-10-07 02:02:23'),(10,19,267,'aceptada','2026-10-07 02:02:33','2026-10-07 02:02:33'),(11,8,267,'aceptada','2026-10-07 02:03:17','2026-10-07 02:03:17'),(16,14,268,'aceptada','2026-10-08 10:19:00','2026-10-08 10:19:00'),(17,14,273,'aceptada','2026-10-08 10:48:57','2026-10-08 10:49:10'),(19,13,273,'aceptada','2026-10-08 10:49:19','2026-10-08 10:49:19'),(20,8,273,'cancelada','2026-10-08 10:49:37','2026-10-08 10:50:46'),(21,8,275,'aceptada','2026-10-08 17:16:58','2026-10-08 17:16:59');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
