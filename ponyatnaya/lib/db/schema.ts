import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  numeric,
  timestamp,
  smallint,
  index,
  unique,
} from "drizzle-orm/pg-core"

// ==================== Пользователи и авторизация ====================

export const appUser = pgTable("app_user", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull().default(""),
  email: varchar("email", { length: 255 }).notNull().default(""),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires", { withTimezone: true }),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  isStaff: boolean("is_staff").notNull().default(false),
  isSuperuser: boolean("is_superuser").notNull().default(false),
  telegramChatId: bigint("telegram_chat_id", { mode: "number" }),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const authToken = pgTable(
  "auth_token",
  {
    token: varchar("token", { length: 64 }).primaryKey(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("auth_token_user_idx").on(t.userId),
  }),
)

export const telegramBotUser = pgTable("telegram_bot_user", {
  chatId: bigint("chat_id", { mode: "number" }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().default(""),
  firstName: varchar("first_name", { length: 255 }).notNull().default(""),
  lastName: varchar("last_name", { length: 255 }).notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }).notNull().defaultNow(),
})

export const pendingTelegramRegistration = pgTable("pending_telegram_registration", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }).notNull(),
  chatId: bigint("chat_id", { mode: "number" }),
  firstName: varchar("first_name", { length: 255 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
})

// ==================== Всплывающее окно сайта ====================

export const sitePopup = pgTable("site_popup", {
  id: integer("id").primaryKey().default(1),
  enabled: boolean("enabled").notNull().default(false),
  imageUrl: text("image_url").notNull().default(""),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  primaryLabel: varchar("primary_label", { length: 120 }).notNull().default(""),
  primaryUrl: text("primary_url").notNull().default(""),
  secondaryLabel: varchar("secondary_label", { length: 120 }).notNull().default(""),
  secondaryUrl: text("secondary_url").notNull().default(""),
  initialDelaySeconds: integer("initial_delay_seconds").notNull().default(5),
  repeatAfterMinutes: integer("repeat_after_minutes").notNull().default(1440),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ==================== Рассылки ====================

export const broadcast = pgTable("broadcast", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default(""),
  titleStyle: varchar("title_style", { length: 20 }).notNull().default("bold"),
  text: text("text").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  sentCount: integer("sent_count").notNull().default(0),
  isSent: boolean("is_sent").notNull().default(false),
})

// ==================== Каталог ====================

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  image: text("image").notNull().default(""),
  showInSlider: boolean("show_in_slider").notNull().default(true),
  sliderOrder: integer("slider_order").notNull().default(0),
})

export const subcategory = pgTable("subcategory", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
})

export const promotion = pgTable("promotion", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  image: text("image").notNull().default(""),
  description: text("description").notNull().default(""),
  conditions: text("conditions").notNull().default(""),
  terms: text("terms").notNull().default(""),
  bannerImage: text("banner_image").notNull().default(""),
  pdfFile: text("pdf_file").notNull().default(""),
  pdfLinkText: varchar("pdf_link_text", { length: 255 }).notNull().default(""),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const product = pgTable("product", {
  id: serial("id").primaryKey(),
  nameWithWeight: varchar("name_with_weight", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  image: text("image").notNull().default(""),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  promotionId: integer("promotion_id"),
  composition: text("composition").notNull().default(""),
  proteinPer100g: numeric("protein_per_100g", { precision: 8, scale: 2 }).notNull().default("0"),
  fatPer100g: numeric("fat_per_100g", { precision: 8, scale: 2 }).notNull().default("0"),
  carbsPer100g: numeric("carbs_per_100g", { precision: 8, scale: 2 }).notNull().default("0"),
  caloriesPer100g: numeric("calories_per_100g", { precision: 8, scale: 2 }).notNull().default("0"),
  categoryId: integer("category_id"),
  subcategoryId: integer("subcategory_id"),
})

export const deliveryZone = pgTable("delivery_zone", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
})

// ==================== Заказы ====================

export const appOrder = pgTable("app_order", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  orderType: varchar("order_type", { length: 20 }).notNull().default("delivery"),
  deliveryAddress: text("delivery_address").notNull().default(""),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryZoneId: integer("delivery_zone_id"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  customerName: varchar("customer_name", { length: 255 }).notNull().default(""),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull().default(""),
  customerEmail: varchar("customer_email", { length: 255 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull().default("cash"),
  paymentId: varchar("payment_id", { length: 128 }),
})

export const orderItem = pgTable("order_item", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
})

// ==================== Отзывы ====================

export const review = pgTable("review", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 255 }).notNull(),
  rating: smallint("rating").notNull().default(5),
  text: text("text").notNull().default(""),
  avatar: text("avatar").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ==================== Контент главной / настройки сайта ====================

export const heroSlide = pgTable("hero_slide", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle").notNull().default(""),
  image: text("image").notNull().default(""),
  buttonText: varchar("button_text", { length: 100 }).notNull().default(""),
  buttonLink: varchar("button_link", { length: 255 }).notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const disabledFeature = pgTable(
  "disabled_feature",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull(),
    featureType: varchar("feature_type", { length: 20 }).notNull().default("page"),
    label: varchar("label", { length: 255 }).notNull().default(""),
    isDisabled: boolean("is_disabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyTypeUnique: unique("disabled_feature_key_type_unique").on(t.key, t.featureType),
  }),
)

export const menuColumnConfig = pgTable("menu_column_config", {
  field: varchar("field", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 255 }).notNull().default(""),
  aliases: text("aliases").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const legalDocument = pgTable("legal_document", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull().default(""),
  content: text("content").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const dishOfTheDay = pgTable("dish_of_the_day", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  activeFrom: timestamp("active_from", { withTimezone: true }),
  activeUntil: timestamp("active_until", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// ==================== Настройки сайта ====================

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  phone: varchar("phone", { length: 64 }).notNull().default("+7 (842) 123-45-67"),
  hoursWeekdays: varchar("hours_weekdays", { length: 64 }).notNull().default("8:00–21:00"),
  hoursWeekends: varchar("hours_weekends", { length: 64 }).notNull().default("9:00–21:00"),
  deliveryMode: varchar("delivery_mode", { length: 32 }).notNull().default("yandex"),
  deliveryUrl: text("delivery_url").notNull().default("https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan"),
  deliveryContactUrl: text("delivery_contact_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type SiteSettings = typeof siteSettings.$inferSelect

// ==================== Выводимые типы ====================

export type AppUser = typeof appUser.$inferSelect
export type AuthTokenRow = typeof authToken.$inferSelect
export type Product = typeof product.$inferSelect
export type Category = typeof category.$inferSelect
export type Subcategory = typeof subcategory.$inferSelect
export type Promotion = typeof promotion.$inferSelect
export type Review = typeof review.$inferSelect
export type Order = typeof appOrder.$inferSelect
export type OrderItem = typeof orderItem.$inferSelect
export type HeroSlide = typeof heroSlide.$inferSelect
export type DisabledFeature = typeof disabledFeature.$inferSelect
export type Broadcast = typeof broadcast.$inferSelect
export type DeliveryZone = typeof deliveryZone.$inferSelect
export type DishOfTheDayRow = typeof dishOfTheDay.$inferSelect
export type LegalDocumentRow = typeof legalDocument.$inferSelect
export type MenuColumnConfigRow = typeof menuColumnConfig.$inferSelect
