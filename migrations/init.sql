-- migrations/init.sql
-- Simple schema for listings and users (demo)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  category TEXT,
  location TEXT,
  images TEXT[], -- array of image URLs/keys
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional: seed example data
INSERT INTO listings (title, description, price, category, location, images) SELECT 'Satılık Forklift - 2018', 'Bakımlı forklift, 3000 kg kapasite, düşük saat.', 25000, 'İş makineleri', 'İstanbul', ARRAY['https://via.placeholder.com/800x450?text=Forklift+1']
WHERE NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Satılık Forklift - 2018');