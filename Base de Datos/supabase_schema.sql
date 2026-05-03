-- ═══════════════════════════════════════════════════════════════════════
-- OpenS — Resilience Edition
-- Schema SQL para Supabase
-- ═══════════════════════════════════════════════════════════════════════
-- INSTRUCCIONES:
-- 1. Ve a https://app.supabase.com y crea un proyecto
-- 2. Abre el SQL Editor (icono de código en el menú lateral)
-- 3. Pega TODO este archivo y haz clic en "Run"
-- 4. Verifica que las tablas aparezcan en Table Editor
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- PASO 1: Crear tablas
-- ─────────────────────────────────────────────────────────

-- Tabla de perfiles (vinculada a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'doctor' -- roles: doctor, admin, paciente
);

-- Tabla de pacientes (expansión del modelo de contactos)
CREATE TABLE IF NOT EXISTS public.patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de registros médicos
CREATE TABLE IF NOT EXISTS public.medical_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT NOT NULL,
    diagnosis TEXT,
    voice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ─────────────────────────────────────────────────────────
-- PASO 2: Habilitar Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────
-- PASO 3: Crear políticas de acceso
-- ─────────────────────────────────────────────────────────

-- Política para perfiles: cada usuario ve su propio perfil
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Política para pacientes: doctores gestionan sus pacientes
CREATE POLICY "Doctors can manage their patients"
    ON public.patients FOR ALL
    USING (auth.uid() = user_id);

-- Política para registros: doctores gestionan registros de sus pacientes
CREATE POLICY "Doctors can manage medical records of their patients"
    ON public.medical_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = medical_records.patient_id
            AND patients.user_id = auth.uid()
        )
    );


-- ─────────────────────────────────────────────────────────
-- PASO 4: Políticas de desarrollo (SOLO para testing)
-- ─────────────────────────────────────────────────────────
-- IMPORTANTE: Estas políticas permiten acceso público.
-- Desactívalas en producción eliminando estas líneas.

-- Permitir lectura pública de pacientes (para la demo)
CREATE POLICY "Public read patients" ON public.patients
    FOR SELECT USING (true);

-- Permitir lectura pública de registros médicos (para la demo)
CREATE POLICY "Public read medical_records" ON public.medical_records
    FOR SELECT USING (true);

-- Permitir inserción pública (para poblar datos de demo)
CREATE POLICY "Public insert patients" ON public.patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public insert medical_records" ON public.medical_records
    FOR INSERT WITH CHECK (true);


-- ─────────────────────────────────────────────────────────
-- PASO 5: Insertar datos de ejemplo
-- ─────────────────────────────────────────────────────────
-- Estos son datos ficticios para probar la plataforma.
-- En producción, los datos se cargan mediante la interfaz.

INSERT INTO public.patients (name, phone, email) VALUES
    ('Ana María Rodríguez', '+58 412-5551234', 'ana.rodriguez@email.com'),
    ('Carlos Eduardo Pérez', '+58 414-5559876', 'carlos.perez@email.com'),
    ('María José González', '+58 424-5554567', 'maria.gonzalez@email.com');

-- Registros médicos para Ana María Rodríguez (ID 1)
INSERT INTO public.medical_records (patient_id, date, description, diagnosis) VALUES
    (1, '2025-10-22 10:00:00+00', 'Consulta de cardiología - Control de presión arterial', 'Hipertensión arterial controlada. PA: 130/85 mmHg. Se mantiene tratamiento con Losartán 50mg.'),
    (1, '2025-10-15 09:00:00+00', 'Resultados de laboratorio', 'Hemoglobina: 13.8 g/dL. Glucosa en ayunas: 102 mg/dL. Colesterol total: 195 mg/dL. Triglicéridos: 140 mg/dL.'),
    (1, '2025-09-28 14:00:00+00', 'Prescripción de medicamento', 'Se prescribe Atorvastatina 20mg, 1 comprimido cada noche por 3 meses para control de colesterol.');

-- Registros médicos para Carlos Eduardo Pérez (ID 2)
INSERT INTO public.medical_records (patient_id, date, description, diagnosis) VALUES
    (2, '2025-10-20 11:00:00+00', 'Consulta de medicina interna', 'Diabetes tipo 2 estable. HbA1c: 6.8%. Se mantiene Metformina 850mg c/12h.'),
    (2, '2025-10-01 08:30:00+00', 'Laboratorio de seguimiento', 'Glucosa en ayunas: 118 mg/dL. Creatinina: 0.9 mg/dL. Función renal normal.');

-- Registros médicos para María José González (ID 3)
INSERT INTO public.medical_records (patient_id, date, description, diagnosis) VALUES
    (3, '2025-10-18 15:00:00+00', 'Consulta de ginecología', 'Control prenatal semana 28. Peso: 68 kg. PA: 110/70 mmHg. Latido fetal: 145 lpm. Sin complicaciones.'),
    (3, '2025-10-05 09:30:00+00', 'Ecografía obstétrica', 'Feto único, presentación cefálica. Peso estimado: 1.1 kg. Líquido amniótico normal. Placenta anterior grado II.');
