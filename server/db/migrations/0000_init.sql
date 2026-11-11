CREATE TABLE `bestellungen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`email` text NOT NULL,
	`design_id` integer NOT NULL,
	`bogen_id` integer NOT NULL,
	`daten` text NOT NULL,
	`logo_id` text,
	`status` text DEFAULT 'offen' NOT NULL,
	`betrag_cent` integer NOT NULL,
	`pdf_datei` text NOT NULL,
	`stripe_session_id` text,
	`erstellt_am` integer DEFAULT (unixepoch()) NOT NULL,
	`bezahlt_am` integer,
	FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bogen_id`) REFERENCES `bogenvorlagen`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bestellungen_token_unique` ON `bestellungen` (`token`);--> statement-breakpoint
CREATE TABLE `bogenvorlagen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`format_id` integer NOT NULL,
	`hersteller` text NOT NULL,
	`artikelnr` text NOT NULL,
	`name` text NOT NULL,
	`seite_breite_mm` real DEFAULT 210 NOT NULL,
	`seite_hoehe_mm` real DEFAULT 297 NOT NULL,
	`spalten` integer NOT NULL,
	`zeilen` integer NOT NULL,
	`rand_oben_mm` real NOT NULL,
	`rand_links_mm` real NOT NULL,
	`abstand_x_mm` real DEFAULT 0 NOT NULL,
	`abstand_y_mm` real DEFAULT 0 NOT NULL,
	`aktiv` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`format_id`) REFERENCES `etikettenformate`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `designs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`beschreibung` text DEFAULT '' NOT NULL,
	`themenwelt_id` integer NOT NULL,
	`format_id` integer NOT NULL,
	`hintergrund` text,
	`slots` text DEFAULT '[]' NOT NULL,
	`preis_cent` integer DEFAULT 490 NOT NULL,
	`veroeffentlicht` integer DEFAULT false NOT NULL,
	`sortierung` integer DEFAULT 0 NOT NULL,
	`erstellt_am` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`themenwelt_id`) REFERENCES `themenwelten`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`format_id`) REFERENCES `etikettenformate`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `designs_slug_unique` ON `designs` (`slug`);--> statement-breakpoint
CREATE TABLE `etikettenformate` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`breite_mm` real NOT NULL,
	`hoehe_mm` real NOT NULL,
	`kontur` text DEFAULT 'rechteck' NOT NULL,
	`eckenradius_mm` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `themenwelten` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`sortierung` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `themenwelten_slug_unique` ON `themenwelten` (`slug`);