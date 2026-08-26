-- ============================================
-- LUXURY MASSAGE BALI - Complete Database Schema
-- Run in: Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  price DECIMAL(10,2) DEFAULT 0,
  category TEXT DEFAULT 'Massage',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB,
  seo_title TEXT,
  seo_description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  therapist_preference TEXT DEFAULT 'no_preference',
  special_request TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB,
  cover_image TEXT,
  author TEXT DEFAULT 'Admin',
  category TEXT DEFAULT 'General',
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  schema_markup JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  cdn_url TEXT,
  mime_type TEXT,
  size_bytes INT,
  alt_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT,
  cta_link TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  animation_preset TEXT DEFAULT 'kenburns'
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write site_settings" ON site_settings;
CREATE POLICY "Admin write site_settings" ON site_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update site_settings" ON site_settings;
CREATE POLICY "Admin update site_settings" ON site_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read active services" ON services;
CREATE POLICY "Public read active services" ON services FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin write services" ON services;
CREATE POLICY "Admin write services" ON services FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update services" ON services;
CREATE POLICY "Admin update services" ON services FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin delete services" ON services;
CREATE POLICY "Admin delete services" ON services FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read pages" ON pages;
CREATE POLICY "Public read pages" ON pages FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Admin write pages" ON pages;
CREATE POLICY "Admin write pages" ON pages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update pages" ON pages;
CREATE POLICY "Admin update pages" ON pages FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin delete pages" ON pages;
CREATE POLICY "Admin delete pages" ON pages FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public create appointments" ON appointments;
CREATE POLICY "Public create appointments" ON appointments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read appointments" ON appointments;
CREATE POLICY "Admin read appointments" ON appointments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin update appointments" ON appointments;
CREATE POLICY "Admin update appointments" ON appointments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin delete appointments" ON appointments;
CREATE POLICY "Admin delete appointments" ON appointments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read published articles" ON articles;
CREATE POLICY "Public read published articles" ON articles FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Admin write articles" ON articles;
CREATE POLICY "Admin write articles" ON articles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update articles" ON articles;
CREATE POLICY "Admin update articles" ON articles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin delete articles" ON articles;
CREATE POLICY "Admin delete articles" ON articles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read media" ON media;
CREATE POLICY "Public read media" ON media FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write media" ON media;
CREATE POLICY "Admin write media" ON media FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin delete media" ON media;
CREATE POLICY "Admin delete media" ON media FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read hero slides" ON hero_slides;
CREATE POLICY "Public read hero slides" ON hero_slides FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin write hero slides" ON hero_slides;
CREATE POLICY "Admin write hero slides" ON hero_slides FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update hero slides" ON hero_slides;
CREATE POLICY "Admin update hero slides" ON hero_slides FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin delete hero slides" ON hero_slides;
CREATE POLICY "Admin delete hero slides" ON hero_slides FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(is_published);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pages'
      AND column_name = 'content'
      AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE pages
    ALTER COLUMN content TYPE jsonb
    USING CASE
      WHEN content IS NULL THEN NULL
      WHEN content::text LIKE '{%' THEN content::jsonb
      ELSE jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', content::text))
          )
        )
      )
    END;
  END IF;
END $$;

ALTER TABLE media ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_hero_sort ON hero_slides(sort_order);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS pages_updated_at ON pages;
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO services (name, slug, description, duration_minutes, price, category, image_url, sort_order) VALUES
('Balinese Massage', 'balinese-massage', 'Traditional Balinese massage untuk relaksasi, aliran darah, dan pemulihan tubuh.', 60, 250000, 'Massage', '', 0),
('Manicure Pedicure', 'manicure-pedicure', 'Perawatan kuku tangan dan kaki dengan finishing rapi dan higienis.', 90, 525000, 'Nail Care', '', 1),
('Facial + Accupressure', 'facial-acupressure', 'Facial 60 menit dengan accupressure untuk kulit segar dan wajah rileks.', 60, 375000, 'Facial', '', 2),
('Nail Polish / Gel', 'nail-polish-gel', 'Gel polish dan nail polish premium untuk tampilan kuku tahan lama.', 60, 200000, 'Nail Care', '', 3),
('Lymphatic Massage', 'lymphatic-massage', 'Lymphatic massage untuk drainage, detox ringan, dan rasa tubuh lebih ringan.', 60, 500000, 'Massage', '', 4),
('Deep Tissue Massage', 'deep-tissue-massage', 'Tekanan mendalam untuk area otot tegang dan pegal kronis.', 60, 300000, 'Massage', '', 5),
('Thai Massage', 'thai-massage', 'Stretching dan tekanan khas Thai untuk fleksibilitas dan energi tubuh.', 60, 350000, 'Massage', '', 6),
('Body Treatment', 'body-treatment', 'Scrub dan body care untuk kulit halus, bersih, dan glowing.', 90, 550000, 'Body Treatment', '', 7),
('Couple Package', 'couple-package', 'Paket spa romantis untuk pasangan dengan pengalaman private.', 120, 900000, 'Couple Package', '', 8)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, duration_minutes = EXCLUDED.duration_minutes, price = EXCLUDED.price, category = EXCLUDED.category, sort_order = EXCLUDED.sort_order;

INSERT INTO pages (title, slug, excerpt, content, seo_title, seo_description, is_published) VALUES
('Tentang Kami', 'tentang', 'Luxury Massage Bali menghadirkan massage home service premium di Bali.', 'Luxury Massage Bali fokus pada Balinese massage, facial, body treatment, dan couple package dengan standar higienis serta terapis profesional.', 'Tentang Luxury Massage Bali', 'Profil layanan home massage Luxury Massage Bali.', true),
('Kontak', 'kontak', 'Hubungi Luxury Massage Bali untuk reservasi.', 'WhatsApp: +6281353681757\nArea layanan: Bali\nMaps: https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb', 'Kontak Luxury Massage Bali', 'Kontak dan reservasi Luxury Massage Bali.', true),
('FAQ', 'faq', 'Pertanyaan umum Luxury Massage Bali.', 'Booking lewat WhatsApp. Pilih layanan, lokasi, tanggal, dan jam. Tim kami akan konfirmasi jadwal.', 'FAQ Luxury Massage Bali', 'FAQ booking Luxury Massage Bali.', true),
('Cara Booking', 'cara-booking', 'Cara booking Luxury Massage Bali.', 'Klik Book Appointment, kirim detail layanan, lokasi, tanggal, dan jam ke WhatsApp +6281353681757.', 'Cara Booking Luxury Massage Bali', 'Panduan booking Luxury Massage Bali.', true),
('Kebijakan Privasi', 'kebijakan-privasi', 'Kebijakan privasi pelanggan.', 'Data pelanggan digunakan untuk reservasi, konfirmasi jadwal, dan operasional layanan.', 'Kebijakan Privasi Luxury Massage Bali', 'Kebijakan privasi Luxury Massage Bali.', true),
('Syarat & Ketentuan', 'syarat-ketentuan', 'Syarat layanan Luxury Massage Bali.', 'Pelanggan wajib memberi data lokasi dan jadwal yang benar. Jadwal mengikuti ketersediaan terapis.', 'Syarat & Ketentuan Luxury Massage Bali', 'Syarat layanan Luxury Massage Bali.', true),
('Refund Policy', 'refund-policy', 'Kebijakan refund Luxury Massage Bali.', 'Refund mengikuti status booking dan waktu pembatalan. Pembatalan mendadak dapat dikenakan biaya operasional.', 'Refund Policy Luxury Massage Bali', 'Kebijakan refund Luxury Massage Bali.', true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content, seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description, is_published = EXCLUDED.is_published;

INSERT INTO site_settings (key, value) VALUES
('contact_info', '{"phone":"+6281353681757","whatsapp":"+6281353681757","email":"hello@luxurymassagebali.com","address":"Bali, Indonesia","google_maps_url":"https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb"}'),
('seo_global', '{"title":"Luxury Massage Bali — Premium Home Massage","description":"Premium massage dan wellness treatment langsung ke lokasi Anda di Bali.","keywords":"luxury massage bali, home massage bali, balinese massage","canonical":"https://luxurymassagebali.com"}'),
('branding', '{"site_name":"Luxury Massage Bali","logo_text":"Luxury Massage Bali","tagline":"Private Wellness, Delivered","logo_mode":"text","logo_url":"","favicon_url":"/favicon.svg","primary_cta":"Book Appointment","admin_path":"/langitdewata"}'),
('footer', '{"headline":"Luxury Massage Bali","description":"Premium home massage and wellness service across Bali.","copyright":"© Luxury Massage Bali"}'),
('booking_rules', '{"whatsapp_template":"Halo Luxury Massage Bali, saya ingin booking.","min_notice_hours":"2","max_days_ahead":"30","deposit_required":"false"}'),
('theme', '{"primary_color":"#214038","dark_color":"#0c1a16","accent_color":"#19322c","mode":"dark","radius":"20"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT 'Schema Complete' as status;
