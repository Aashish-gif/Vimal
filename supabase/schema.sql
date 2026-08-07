-- Vimal Opticals Supabase Schema Migration
-- Run this SQL in your Supabase SQL Editor to configure the database.

-- 1. Enable Realtime on these tables
-- Run this block first:
begin;
  -- drop any existing publications if recreating
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- 2. Create CUSTOMERS table
create table ifpos_customers (
  id text primary key,
  name text not null,
  phone text not null
);

-- 3. Create FRAMES table (Inventory)
create table ifpos_frames (
  id text primary key,
  brand text not null,
  model text not null,
  style text not null,
  color text not null,
  price numeric not null,
  stock integer not null,
  image_url text not null
);

-- 4. Create RESERVATIONS table
create table ifpos_reservations (
  id text primary key,
  customer_id text references ifpos_customers(id) on delete cascade,
  frame_id text references ifpos_frames(id) on delete cascade,
  status text not null check (status in ('active', 'cancelled', 'collected')),
  created_at timestamptz not null default now()
);

-- 5. Create ORDERS table
create table ifpos_orders (
  id text primary key,
  customer_id text references ifpos_customers(id) on delete cascade,
  frame_id text references ifpos_frames(id) on delete cascade,
  order_type text not null check (order_type in ('custom-lens', 'ready-pickup', 'repair')),
  status text not null check (status in ('pending', 'processing', 'arrived', 'collected')),
  created_at timestamptz not null default now(),
  arrived_at timestamptz
);

-- 6. Create MESSAGES table (WhatsApp Mock notifications)
create table ifpos_messages (
  id text primary key,
  customer_id text references ifpos_customers(id) on delete cascade,
  kind text not null,
  text text not null,
  order_id text,
  created_at timestamptz not null default now(),
  delivered boolean not null default false
);

-- 7. Add tables to Realtime Publication
alter publication supabase_realtime add table ifpos_frames;
alter publication supabase_realtime add table ifpos_reservations;
alter publication supabase_realtime add table ifpos_orders;
alter publication supabase_realtime add table ifpos_messages;

-- 8. Seed default demo frames
insert into ifpos_frames (id, brand, model, style, color, price, stock, image_url) values
('f-001', 'Ray-Ban', 'RB3025 Classic', 'Aviator', 'Gold', 1299, 4, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gold%20aviator%20sunglasses%20ray-ban%20style%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-002', 'Ray-Ban', 'RB3025 Black', 'Aviator', 'Black', 1399, 2, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20aviator%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-003', 'Ray-Ban', 'RB2140 Original', 'Wayfarer', 'Black', 1199, 5, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20wayfarer%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-004', 'Ray-Ban', 'RB2140 Tortoise', 'Wayfarer', 'Tortoise', 1249, 3, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tortoise%20shell%20wayfarer%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-005', 'Oakley', 'Holbrook', 'Square', 'Black', 1899, 2, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20square%20oakley%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-006', 'Oakley', 'Latch', 'Round', 'Silver', 1749, 1, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=silver%20round%20sunglasses%20oakley%20style%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-007', 'Persol', 'PO3092V', 'Round', 'Tortoise', 2199, 3, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tortoise%20round%20vintage%20eyeglasses%20frames%20persol%20style%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-008', 'Persol', 'PO3103S', 'Aviator', 'Gunmetal', 2299, 1, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gunmetal%20grey%20aviator%20sunglasses%20persol%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-009', 'Vogue', 'VO2714', 'Cat-Eye', 'Black', 999, 6, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20cat%20eye%20eyeglasses%20frames%20womens%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-010', 'Vogue', 'VO5206S', 'Cat-Eye', 'Red', 1099, 4, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=red%20cat%20eye%20sunglasses%20womens%20vogue%20style%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-011', 'Vogue', 'VO5104S', 'Oval', 'Havana', 1149, 2, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=havana%20brown%20oval%20sunglasses%20womens%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-012', 'LensKart', 'LR E10136', 'Round', 'Black', 799, 8, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20round%20eyeglasses%20frames%20affordable%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-013', 'LensKart', 'LR E11240', 'Round', 'Clear', 699, 5, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clear%20transparent%20round%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-014', 'LensKart', 'LR E13581', 'Rectangle', 'Brown', 849, 7, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=brown%20rectangle%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-015', 'LensKart', 'LR E14902', 'Square', 'Blue', 899, 4, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=blue%20square%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-016', 'Tom Ford', 'TF5401', 'Rectangle', 'Black', 2899, 1, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20rectangle%20luxury%20tom%20ford%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-017', 'Tom Ford', 'TF5506', 'Clubmaster', 'Havana', 2799, 2, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=havana%20clubmaster%20browline%20luxury%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-018', 'Vince Camuto', 'VC1001', 'Browline', 'Gunmetal', 1499, 3, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gunmetal%20browline%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-019', 'Vince Camuto', 'VC1056', 'Cat-Eye', 'Tortoise', 1599, 2, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tortoise%20cat%20eye%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-020', 'Titan', 'T1025A', 'Rectangle', 'Silver', 1299, 5, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=silver%20rectangle%20titan%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-021', 'Titan', 'T1146B', 'Clubmaster', 'Gold', 1599, 4, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gold%20black%20clubmaster%20browline%20titan%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-022', 'Fastrack', 'FT1015', 'Aviator', 'Silver', 899, 6, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=silver%20aviator%20fastrack%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-023', 'Fastrack', 'FT1089', 'Square', 'Brown', 749, 3, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=brown%20square%20fastrack%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd'),
('f-024', 'Fastrack', 'FT1150', 'Wayfarer', 'Blue', 799, 0, 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=blue%20wayfarer%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd');


-- Seed Rahul Sharma as a customer
insert into ifpos_customers (id, name, phone) values
('c-rahul', 'Rahul Sharma', '+91 98765 43210');
