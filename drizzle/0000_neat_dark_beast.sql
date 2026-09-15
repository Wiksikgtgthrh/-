CREATE TABLE "app_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"order_type" varchar(20) DEFAULT 'delivery' NOT NULL,
	"delivery_address" text DEFAULT '' NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery_zone_id" integer,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"customer_name" varchar(255) DEFAULT '' NOT NULL,
	"customer_phone" varchar(32) DEFAULT '' NOT NULL,
	"customer_email" varchar(255) DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"payment_method" varchar(32) DEFAULT 'cash' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(32) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(255) DEFAULT '' NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"email_verification_expires" timestamp with time zone,
	"password_reset_token" text,
	"password_reset_expires" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_staff" boolean DEFAULT false NOT NULL,
	"is_superuser" boolean DEFAULT false NOT NULL,
	"telegram_chat_id" bigint,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "auth_token" (
	"token" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"title_style" varchar(20) DEFAULT 'bold' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"show_in_slider" boolean DEFAULT true NOT NULL,
	"slider_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "delivery_zone" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"min_order_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "delivery_zone_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "disabled_feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"feature_type" varchar(20) DEFAULT 'page' NOT NULL,
	"label" varchar(255) DEFAULT '' NOT NULL,
	"is_disabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disabled_feature_key_type_unique" UNIQUE("key","feature_type")
);
--> statement-breakpoint
CREATE TABLE "dish_of_the_day" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"old_price" numeric(10, 2),
	"sale_price" numeric(10, 2),
	"active_from" timestamp with time zone,
	"active_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_slide" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"button_text" varchar(100) DEFAULT '' NOT NULL,
	"button_link" varchar(255) DEFAULT '' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_document" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_document_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "menu_column_config" (
	"field" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(255) DEFAULT '' NOT NULL,
	"aliases" text DEFAULT '' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_telegram_registration" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(64) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"chat_id" bigint,
	"first_name" varchar(255) DEFAULT '' NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pending_telegram_registration_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_with_weight" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"promotion_id" integer,
	"composition" text DEFAULT '' NOT NULL,
	"protein_per_100g" numeric(8, 2) DEFAULT '0' NOT NULL,
	"fat_per_100g" numeric(8, 2) DEFAULT '0' NOT NULL,
	"carbs_per_100g" numeric(8, 2) DEFAULT '0' NOT NULL,
	"calories_per_100g" numeric(8, 2) DEFAULT '0' NOT NULL,
	"category_id" integer,
	"subcategory_id" integer,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "promotion" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"conditions" text DEFAULT '' NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"banner_image" text DEFAULT '' NOT NULL,
	"pdf_file" text DEFAULT '' NOT NULL,
	"pdf_link_text" varchar(255) DEFAULT '' NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" varchar(255) NOT NULL,
	"rating" smallint DEFAULT 5 NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_popup" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"primary_label" varchar(120) DEFAULT '' NOT NULL,
	"primary_url" text DEFAULT '' NOT NULL,
	"secondary_label" varchar(120) DEFAULT '' NOT NULL,
	"secondary_url" text DEFAULT '' NOT NULL,
	"initial_delay_seconds" integer DEFAULT 5 NOT NULL,
	"repeat_after_minutes" integer DEFAULT 1440 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"phone" varchar(64) DEFAULT '+7 (842) 123-45-67' NOT NULL,
	"hours_weekdays" varchar(64) DEFAULT '8:00–21:00' NOT NULL,
	"hours_weekends" varchar(64) DEFAULT '9:00–21:00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategory" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	CONSTRAINT "subcategory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "telegram_bot_user" (
	"chat_id" bigint PRIMARY KEY NOT NULL,
	"username" varchar(255) DEFAULT '' NOT NULL,
	"first_name" varchar(255) DEFAULT '' NOT NULL,
	"last_name" varchar(255) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_interaction_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_token_user_idx" ON "auth_token" USING btree ("user_id");