-- 1. Create the 'users' table
CREATE TABLE users (
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    "memberId" TEXT,
    role TEXT DEFAULT 'member',
    name TEXT,
    phone TEXT,
    branch TEXT,
    year TEXT,
    section TEXT,
    interests TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create the 'events' table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TEXT,
    "comingSoon" BOOLEAN DEFAULT false,
    image TEXT,
    description TEXT,
    link TEXT
);

-- 3. Create the 'hardware' table
CREATE TABLE hardware (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    "totalQuantity" INTEGER DEFAULT 0,
    "availableQuantity" INTEGER DEFAULT 0,
    image TEXT
);

-- 4. Create the 'allocations' table
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users(uid) ON DELETE CASCADE,
    "userName" TEXT,
    "memberId" TEXT,
    "itemId" UUID REFERENCES hardware(id) ON DELETE CASCADE,
    "itemName" TEXT,
    "expectedReturn" TEXT,
    status TEXT DEFAULT 'issued',
    "issuedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "returnedAt" TIMESTAMP WITH TIME ZONE
);

-- 5. Enable Public Access (Since we are migrating from a previously open structure)
-- Note: In a production environment, you should enable Row Level Security (RLS) 
--       and write specific policies for who can read/write data.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE hardware DISABLE ROW LEVEL SECURITY;
ALTER TABLE allocations DISABLE ROW LEVEL SECURITY;
