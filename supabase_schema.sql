-- =======================================================
-- Supabase Schema for MPLSimulasi (ESports Tournament Simulator)
-- Jalankan skrip ini pada menu "SQL Editor" di Dashboard Supabase Anda.
-- =======================================================

-- 1. Table Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT NOT NULL,
    session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    tag TEXT NOT NULL,
    match_played INTEGER DEFAULT 0,
    match_win INTEGER DEFAULT 0,
    match_lose INTEGER DEFAULT 0,
    game_win INTEGER DEFAULT 0,
    game_lose INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    roster JSONB DEFAULT '[]'::jsonb,
    PRIMARY KEY (session_id, id)
);

-- 3. Table Matches
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT NOT NULL,
    session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    day INTEGER NOT NULL,
    day_name TEXT,
    date TEXT,
    team_a_id TEXT,
    team_b_id TEXT,
    score_a TEXT DEFAULT '',
    score_b TEXT DEFAULT '',
    status TEXT DEFAULT 'SCHEDULED',
    games JSONB DEFAULT '[]'::jsonb,
    PRIMARY KEY (session_id, id)
);

-- 4. Table Settings
CREATE TABLE IF NOT EXISTS public.settings (
    session_id TEXT PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
    volatility INTEGER DEFAULT 50,
    h2h_bias BOOLEAN DEFAULT false,
    momentum BOOLEAN DEFAULT true,
    fatigue BOOLEAN DEFAULT true,
    rivalry BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table Playoffs
CREATE TABLE IF NOT EXISTS public.playoffs (
    session_id TEXT PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
    bracket_data JSONB NOT NULL,
    is_forced BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table Master Schedule Templates (Untuk sinkronisasi jadwal ke semua user)
CREATE TABLE IF NOT EXISTS public.schedule_templates (
    id TEXT PRIMARY KEY,
    templates_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;

-- Anon Access Policies (Akses publik REST API dengan anon key)
DROP POLICY IF EXISTS "Anon Full Access Sessions" ON public.sessions;
CREATE POLICY "Anon Full Access Sessions" ON public.sessions FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Teams" ON public.teams;
CREATE POLICY "Anon Full Access Teams" ON public.teams FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Matches" ON public.matches;
CREATE POLICY "Anon Full Access Matches" ON public.matches FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Settings" ON public.settings;
CREATE POLICY "Anon Full Access Settings" ON public.settings FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Playoffs" ON public.playoffs;
CREATE POLICY "Anon Full Access Playoffs" ON public.playoffs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Schedule Templates" ON public.schedule_templates;
CREATE POLICY "Anon Full Access Schedule Templates" ON public.schedule_templates FOR ALL TO anon USING (true) WITH CHECK (true);
