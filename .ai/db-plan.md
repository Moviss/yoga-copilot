# Schemat bazy danych PostgreSQL dla Yoga CoPilot (MVP)

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### Definicje typów ENUM

```sql
-- Cele praktyki jogi
CREATE TYPE goal_enum AS ENUM (
  'balance',          -- równowaga
  'strength',         -- siła
  'flexibility',      -- gibkość
  'relaxation',       -- relaksacja
  'energy',           -- energia
  'mindfulness'       -- uważność
);

-- Poziomy zaawansowania
CREATE TYPE level_enum AS ENUM (
  'beginner',         -- początkujący
  'intermediate',     -- średniozaawansowany
  'advanced'          -- zaawansowany
);

-- Status feedbacku
CREATE TYPE feedback_status_enum AS ENUM (
  'accepted',         -- zaakceptowana sekwencja
  'rejected'          -- odrzucona sekwencja
);

-- Status generowania
CREATE TYPE generation_status_enum AS ENUM (
  'success',          -- udane generowanie
  'failure'           -- nieudane generowanie
);
```

### Tabela `asanas`

```sql
CREATE TABLE asanas
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    sanskrit_name    TEXT        NOT NULL,
    polish_name      TEXT        NOT NULL,
    illustration_url TEXT        NOT NULL,
    is_archived      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Tabela `generated_sequences`

```sql
CREATE TABLE generated_sequences
(
    id                UUID PRIMARY KEY                DEFAULT gen_random_uuid(),
    user_id           UUID                   NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
    duration_minutes  INTEGER                NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 30),
    goal              goal_enum              NOT NULL,
    level             level_enum             NOT NULL,
    generation_status generation_status_enum NOT NULL DEFAULT 'failure',
    raw_llm_response  JSONB,
    created_at        TIMESTAMPTZ            NOT NULL DEFAULT now()
);
```

### Tabela `sequence_asanas`

```sql
CREATE TABLE sequence_asanas
(
    id                    UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    generated_sequence_id UUID        NOT NULL REFERENCES generated_sequences (id) ON DELETE RESTRICT,
    asana_id              UUID        NOT NULL REFERENCES asanas (id) ON DELETE RESTRICT,
    step_number           INTEGER     NOT NULL CHECK (step_number > 0),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (generated_sequence_id, step_number)
);
```

### Tabela `feedback`

```sql
CREATE TABLE feedback
(
    id                    UUID PRIMARY KEY              DEFAULT gen_random_uuid(),
    generated_sequence_id UUID                 NOT NULL UNIQUE REFERENCES generated_sequences (id) ON DELETE RESTRICT,
    feedback_status       feedback_status_enum NOT NULL,
    user_comment          TEXT,
    created_at            TIMESTAMPTZ          NOT NULL DEFAULT now()
);
```

## 2. Relacje między tabelami

- **`generated_sequences` → `auth.users`**: Relacja wiele-do-jednego (wiele sekwencji może być przypisanych do jednego
  użytkownika).
    - Klucz obcy: `generated_sequences.user_id` odnosi się do `auth.users.id` z ograniczeniem `ON DELETE RESTRICT`.

- **`sequence_asanas` → `generated_sequences`**: Relacja wiele-do-jednego (wiele kroków sekwencji może należeć do jednej
  wygenerowanej sekwencji).
    - Klucz obcy: `sequence_asanas.generated_sequence_id` odnosi się do `generated_sequences.id` z ograniczeniem
      `ON DELETE RESTRICT`.

- **`sequence_asanas` → `asanas`**: Relacja wiele-do-jednego (wiele kroków sekwencji może odnosić się do tej samej
  asany).
    - Klucz obcy: `sequence_asanas.asana_id` odnosi się do `asanas.id` z ograniczeniem `ON DELETE RESTRICT`.

- **`feedback` → `generated_sequences`**: Relacja jeden-do-jednego (jeden feedback dla jednej wygenerowanej sekwencji).
    - Klucz obcy: `feedback.generated_sequence_id` odnosi się do `generated_sequences.id` z ograniczeniem
      `ON DELETE RESTRICT`.
    - Ograniczenie `UNIQUE` na `feedback.generated_sequence_id` zapewnia relację jeden-do-jednego.

## 3. Indeksy

```sql
-- Indeksy tworzone automatycznie na kluczach głównych (PRIMARY KEY)
-- Indeksy tworzone automatycznie na kluczach obcych (FOREIGN KEY)

-- Dodatkowy indeks dla szybkiego wyszukiwania kroków sekwencji
CREATE INDEX idx_sequence_asanas_sequence_step ON sequence_asanas (generated_sequence_id, step_number);

-- Indeks dla szybkiego filtrowania aktywnych asan
CREATE INDEX idx_asanas_is_archived ON asanas (is_archived);

-- Indeks dla szybkiego wyszukiwania sekwencji danego użytkownika
CREATE INDEX idx_generated_sequences_user_id ON generated_sequences (user_id);

-- Indeks na statusie generowania, przydatny do raportowania i analizy
CREATE INDEX idx_generated_sequences_status ON generated_sequences (generation_status);
```

## 4. Zasady PostgreSQL (Row Level Security)

```sql
-- Włączenie Row Level Security dla wszystkich tabel
ALTER TABLE asanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_asanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Polityka dla tabeli asanas - tylko odczyt dla uwierzytelnionych użytkowników
CREATE
POLICY asanas_select_policy ON asanas
  FOR
SELECT
    TO authenticated
    USING (TRUE);

-- Polityki dla tabeli generated_sequences
CREATE
POLICY generated_sequences_select_policy ON generated_sequences
  FOR
SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE
POLICY generated_sequences_insert_policy ON generated_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Polityki dla tabeli sequence_asanas
CREATE
POLICY sequence_asanas_select_policy ON sequence_asanas
  FOR
SELECT
    TO authenticated
    USING (
    EXISTS (
    SELECT 1 FROM generated_sequences
    WHERE id = generated_sequence_id
    AND user_id = auth.uid()
    )
    );

CREATE
POLICY sequence_asanas_insert_policy ON sequence_asanas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM generated_sequences
      WHERE id = generated_sequence_id
      AND user_id = auth.uid()
    )
  );

-- Polityki dla tabeli feedback
CREATE
POLICY feedback_select_policy ON feedback
  FOR
SELECT
    TO authenticated
    USING (
    EXISTS (
    SELECT 1 FROM generated_sequences
    WHERE id = generated_sequence_id
    AND user_id = auth.uid()
    )
    );

CREATE
POLICY feedback_insert_policy ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM generated_sequences
      WHERE id = generated_sequence_id
      AND user_id = auth.uid()
    )
  );
```

## 5. Dodatkowe uwagi i wyjaśnienia

1. **Archiwizacja danych**: Zamiast fizycznego usuwania rekordów, stosujemy flagę `is_archived` w tabeli `asanas`. Dla
   użytkowników korzystamy z wbudowanych mechanizmów Supabase do dezaktywacji kont.

2. **Kaskadowe ograniczenia**: Wszystkie klucze obce mają ograniczenie `ON DELETE RESTRICT`, co zapobiega przypadkowemu
   usunięciu danych, które są referencjonowane przez inne tabele. Jest to zgodne z podejściem archiwizacji zamiast
   usuwania.

3. **Row Level Security (RLS)**: Zasady bezpieczeństwa na poziomie wiersza zapewniają, że:
    - Użytkownicy mogą widzieć tylko swoje wygenerowane sekwencje i związane z nimi dane.
    - Wszyscy uwierzytelnieni użytkownicy mają dostęp do odczytu asan (ale nie mogą ich modyfikować).
    - Brak uprawnień do usuwania lub aktualizacji danych, co chroni integralność bazy danych.

4. **Typy ENUM**: Wykorzystano typy ENUM dla standaryzacji i ograniczenia dozwolonych wartości w kolumnach `goal`,
   `level`, `feedback_status` i `generation_status`.

5. **Obsługa błędów generowania**: Implementacja statusu generacji (`generation_status`) wraz z przechowywaniem surowej
   odpowiedzi LLM (`raw_llm_response`) umożliwia debugowanie i analizę nieudanych prób generowania.

6. **Relacyjne przechowywanie sekwencji**: Sekwencje asan są przechowywane w sposób relacyjny w tabeli
   `sequence_asanas`, co umożliwia łatwe wyszukiwanie, sortowanie i modyfikację bez konieczności parsowania struktur
   JSON.

7. **Indeksowanie**: Oprócz automatycznych indeksów na kluczach głównych i obcych, dodano indeksy dla najczęstszych
   wzorców zapytań, takich jak filtrowanie po użytkowniku, statusie generowania i archiwizacji.

8. **Ograniczenia walidacyjne**: Dodano ograniczenia CHECK dla poprawności danych, np. dla `duration_minutes` (1-30
   minut) oraz `step_number` (musi być większy od 0).