import type {
  Product,
  Category,
  Subcategory,
  Promotion,
  Review,
  Order,
  OrderItem,
  HeroSlide,
  DisabledFeature,
  Broadcast,
  LegalDocumentRow,
} from "@/lib/db/schema"

const num = (v: unknown) => (v == null ? 0 : Number(v))

function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return url.startsWith("/") ? url : `/${url}`
}

export function serializeProduct(p: Product & { nutrition?: number[] }) {
  return {
    id: p.id,
    slug: p.slug,
    name_with_weight: p.nameWithWeight,
    price: String(p.price),
    image: formatImageUrl(p.image),
    is_available: p.isAvailable,
    composition: p.composition || "",
    category: p.categoryId,
    subcategory: p.subcategoryId ?? null,
    promotion: p.promotionId ?? null,
    nutrition_per_100g: [
      num(p.proteinPer100g),
      num(p.fatPer100g),
      num(p.carbsPer100g),
      num(p.caloriesPer100g),
    ],
  }
}

export function serializeCategory(
  c: Category,
  subs: Subcategory[] = [],
) {
  let image = formatImageUrl(c.image)
  if (!image) {
    const base = c.slug.replace(/-[a-z0-9]{6,}$/i, "")
    image = `/images/categories/${base}.png`
  }

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    image,
    show_in_slider: c.showInSlider,
    slider_order: c.sliderOrder,
    subcategories: subs.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.categoryId,
    })),
  }
}

export function serializeSubcategory(s: Subcategory) {
  return { id: s.id, name: s.name, slug: s.slug, category: s.categoryId }
}

export function serializePromotion(p: Promotion) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    image: formatImageUrl(p.image),
    conditions: p.conditions || "",
    terms: p.terms || "",
    pdf_file: p.pdfFile || null,
    pdf_link_text: p.pdfLinkText || "",
    banner_image: formatImageUrl(p.bannerImage),
    end_date: p.endDate ? p.endDate.toISOString() : undefined,
    created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
  }
}

export function serializeReview(r: Review) {
  const created = r.createdAt ? new Date(r.createdAt) : new Date()
  return {
    id: r.id,
    author: r.author,
    rating: r.rating,
    text: r.text,
    avatar_url: formatImageUrl(r.avatar),
    is_published: r.isPublished,
    created_at: created.toISOString(),
    date: created.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  }
}

export function serializeOrder(
  o: Order,
  items: (OrderItem & { productName?: string })[] = [],
) {
  return {
    id: o.id,
    created_at: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
    order_type: o.orderType,
    status: o.status,
    total_price: String(o.totalPrice),
    total_amount: String(o.totalPrice),
    delivery_address: o.deliveryAddress || "",
    delivery_fee: String(o.deliveryFee),
    discount_percent: String(o.discountPercent),
    discount_amount: String(o.discountAmount),
    customer_name: o.customerName || "",
    customer_phone: o.customerPhone || "",
    customer_email: o.customerEmail || "",
    notes: o.notes || "",
    payment_method: o.paymentMethod || "cash",
    payment_id: o.paymentId || null,
    items: items.map((it) => ({
      id: it.id,
      product_id: it.productId,
      product_name: it.productName || "",
      quantity: it.quantity,
      price: String(it.price),
    })),
  }
}

export function serializeHeroSlide(h: HeroSlide) {
  return {
    id: h.id,
    title: h.title,
    subtitle: h.subtitle || "",
    image: formatImageUrl(h.image),
    button_text: h.buttonText || "",
    button_link: h.buttonLink || "",
    display_order: h.displayOrder,
    is_active: h.isActive,
  }
}

export function serializeDisabledFeature(d: DisabledFeature) {
  return {
    id: d.id,
    key: d.key,
    feature_type: d.featureType,
    label: d.label || "",
    is_disabled: d.isDisabled,
  }
}

export function serializeLegalDocument(d: LegalDocumentRow) {
  return {
    id: d.id,
    slug: d.slug,
    title: d.title || "",
    content: d.content || "",
    is_published: d.isPublished,
    display_order: d.displayOrder,
    updated_at: d.updatedAt ? d.updatedAt.toISOString() : new Date().toISOString(),
  }
}

export function serializeBroadcast(b: Broadcast) {
  return {
    id: b.id,
    title: b.title || "",
    title_style: b.titleStyle,
    text: b.text || "",
    has_image: Boolean(b.imageUrl),
    image_url: formatImageUrl(b.imageUrl),
    created_at: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
    sent_at: b.sentAt ? b.sentAt.toISOString() : null,
    sent_count: b.sentCount,
    is_sent: b.isSent,
  }
}
