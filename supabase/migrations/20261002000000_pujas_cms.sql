create table if not exists public.pujas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tamil_subtitle text not null,
  badge_text text not null,
  short_description text not null,
  points jsonb not null check (jsonb_typeof(points) = 'array' and jsonb_array_length(points) = 3),
  package_type text not null,
  duration text not null,
  image_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(image_urls) = 'array' and jsonb_array_length(image_urls) <= 5),
  image_url text not null default '',
  image_alt text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pujas enable row level security;
-- The site accesses this table through a server-side service role. No anon policies are created.

insert into public.pujas (slug, title, tamil_subtitle, badge_text, short_description, points, package_type, duration, image_urls, image_url, image_alt) values
  ('sri-maha-ganapathi-homam', 'Sri Maha Ganapathi Homam', 'ஸ்ரீ மகா கணபதி ஹோமம்', 'Obstacle Removal', 'Removes all obstacles, bestows auspicious beginnings for ventures, weddings, business inaugurations, and new residences.', '["2 Veda Pandits (Rig / Yajur Veda)","108 Modakas & Dry Coconut offering","Customized Grihastha Sankalpam"]'::jsonb, 'Standard or Complete Samagri', '2 - 3 Hours', '[]'::jsonb, '/assets/2e71a214000f40a2ac8d5eb090f599c0.png', 'Sri Maha Ganapathi Sacred Homam Setup'),
  ('gruhapravesam-vastu-homam', 'Gruhapravesam & Vastu Homam', 'கிரகப்பிரவேசம் & வாஸ்து ஹோமம்', 'Housewarming Must', 'Comprehensive purification for new apartments and homes. Includes Go Pooja, Ganapathi, Navagraha, and Vastu Shanthi.', '["Lead Vadhyar + 2 Assisting Priests","Milk Boiling (Paal Kaichuthal) guidance","Punyahavachanam & Kalasa Sthapana"]'::jsonb, 'Comprehensive Package', '4 - 5 Hours', '[]'::jsonb, '/assets/abb969c245af41c28442e7e7ad68f4d0.png', 'Gruhapravesam and Vastu Homam Tamil Nadu ceremony'),
  ('navagraha-shanti-homam', 'Navagraha Shanti Homam', 'நவகிரக சாந்தி ஹோமம்', 'Planetary Peace', 'Appeases the nine celestial bodies to pacify Sade Sati, Rahu-Ketu doshams, and enhance health, harmony, and career growth.', '["9 Dhanyams, 9 Vastrams, 9 Samiths","2 Certified Vedic Priests","Complete Navagraha Japa Mantras"]'::jsonb, 'Transparent Guidelines', '3 - 4 Hours', '[]'::jsonb, '/assets/b9fe05929e21420395610ef99447cd86.png', 'Navagraha Shanti Homam Navadhanya setup'),
  ('sri-ayushya-homam', 'Sri Ayushya Homam', 'ஸ்ரீ ஆயுஷ்ய ஹோமம்', 'Health & Longevity', 'Conducted on 1st birthdays or birthdays of elders for longevity (Ayur Vriddhi), vital energy, and protection from severe illnesses.', '["Ayur Devata & Markandeya invocation","Brahma-Varuna Kalasa Pooja","Includes Charu preparation support"]'::jsonb, 'Traditional Package', '2.5 Hours', '[]'::jsonb, '/assets/76c961b4589e4ebb81b96ede80892185.png', 'Sri Ayushya Homam ritual for child health'),
  ('sri-satyanarayana-swamy-vratham', 'Sri Satyanarayana Swamy Vratham', 'ஸ்ரீ சத்யநாராயண விரதம்', 'Pournami Vratham', 'Performed on full-moon days or special occasions to invite Mahavishnu''s blessings, domestic harmony, and career breakthroughs.', '["5 Adhyayas Sacred Katha Recitation","Sapadabhakshya (Prasadam) Vidhi","Mangala Harathi with traditional deepam"]'::jsonb, 'Vedic Acharya Seva', '2 - 3 Hours', '[]'::jsonb, '/assets/4af39cb815cb4fc581e10417cf51d804.png', 'Sri Satyanarayana Swamy Vratham mandapam'),
  ('sashtiapthapoorthi-bheemaratha-shanthi', 'Sashtiapthapoorthi (60th) & Bheemaratha Shanthi', 'மணிவிழா மற்றும் சஷ்டியப்தபூர்த்தி', '60th & 70th Milestone', 'Vedic marriage renewal and rejuvenation rites marking the completion of 60 years. Kalasa abhishekam with consecrated waters.', '["4 to 7 Veda Pandits (Team of Acharyas)","60 or 70 Kalasa Sthapana & Snanam","Mangalya Dharanam & Swarna Dana Vidhi"]'::jsonb, 'Custom Milestone Package', 'Half / Full Day', '[]'::jsonb, '/assets/745a80e872eb45798a95ef375444b548.png', 'Sashtiapthapoorthi 60th birthday ritual blessings'),
  ('kala-sarpa-dosha-shanti-homam', 'Kala Sarpa Dosha Shanti Homam', 'காலசர்ப்ப தோஷ சாந்தி ஹோமம்', 'Dosha Nivarana', 'Pacifies Kala Sarpa Dosha with Sankalpam, Navagraha shanti, and dosha-nivarana mantras for calm, progress, and family harmony.', '["Sarpa Dosha Nashak and Navagraha Shanti","2 Certified Vedic Priests","Complete Dosha Nivarana mantras and Sankalpam"]'::jsonb, 'Standard or Complete Samagri', '3 - 4 Hours', '[]'::jsonb, '/assets/kalasarpa.jpeg', 'Kala Sarpa Dosha Shanti Homam serpent dosha ritual'),
  ('dhanvantari-homam', 'Dhanvantari Homam', 'தான்வந்தரி ஹோமம்', 'Health & Healing', 'Homam to Lord Dhanvantari, the divine physician, seeking relief from illness, support in recovery, and long life.', '["Dhanvantari and Ayurveda Devata invocation","Dhanvantari Kalasa and abhishekam","2 Certified Vedic Priests and healing Sankalpam"]'::jsonb, 'Standard or Complete Samagri', '2 - 3 Hours', '[]'::jsonb, '/assets/dhanvanthiri.jpeg', 'Dhanvantari Homam Lord Dhanvantari heerthalaya'),
  ('narayana-pooja', 'Narayana Pooja', 'நாராயண பூஜை', 'Devotional Peace', 'Devotional worship of Lord Narayana with prayers, offerings, and the recitation of sacred names and mantras.', '["Archana with tulasi, flowers, and naivedhyam","Narayana nama and mantra recitation","Family Sankalpam, harathi, and prasadam"]'::jsonb, 'Standard or Complete Samagri', '2 - 3 Hours', '[]'::jsonb, '/assets/templ1.jpeg', 'Narayana Pooja temple archana and offerings'),
  ('temple-balalayam-kumbhabhishekam', 'Temple Balalayam and Kumbhabhishekam', 'பாலாலயம் & கும்பாபிஷேகம்', 'Temple Consecration', 'Consecration rites that sanctify a temple and ceremonially reinstall the divine presence after renovation.', '["Silpa Shastra based vastu shanti and Muhurtham guidance","Kalasha, hetra, and vimana consecration","Abhishekam, archana, Maha Harathi, and community prasadam"]'::jsonb, 'Temple Ritual Package', 'Full Day', '[]'::jsonb, '/assets/temple2.jpeg', 'Temple Balalayam and Kumbhabhishekam consecration ritual'),
  ('temple-mandala-abhishekam-48-days', '48-Day Temple Mandala Abhishekam', '48 நாள் மண்டல அபிஷேகம்', '48-Day Mandala', 'A 48-day series of abhishekam and archana offered to the deity with prayers and devotional observances.', '["48 days of abhishekam and archana tharpanam","Kalasha abhishekam and traditional naivedhyam","Mandala pravachanam, kola purasabha, and prasadam"]'::jsonb, 'Temple Ritual Package', '48 Days', '[]'::jsonb, '/assets/temple3.jpeg', '48-Day Temple Mandala Abhishekam bathing ritual')
on conflict (slug) do nothing;
