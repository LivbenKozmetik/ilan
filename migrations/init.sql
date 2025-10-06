-- migrations/init.sql
-- Simple schema for listings and users (demo)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional: seed example data
INSERT INTO listings (title, description, price, category, location, images) SELECT 'Satılık Forklift - 2018', 'Bakımlı forklift, 3000 kg kapasite, düşük saat.', 25000, 'İş makineleri', 'İstanbul', ARRAY['https://via.placeholder.com/800x450?text=Forklift+1']
WHERE NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Satılık Forklift - 2018');

-- Seed admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) SELECT 'admin@livben.com', '$2a$10$HfzIhgJvNFQT1KkqGgPy7e1oq6z7QjGCqON0J7q1q6v8iGBf9aDzS', 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@livben.com');