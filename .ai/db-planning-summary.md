<conversation_summary>
<decisions>
1.  Utworzona zostanie tabela `asanas` do przechowywania informacji o pozycjach jogi.
2.  Kolumny w tabeli `asanas` będą miały angielskie nazwy (`id`, `sanskrit_name`, `polish_name`, `illustration_url`, `is_archived`).
3.  Poziom trudności asan nie będzie przechowywany w bazie; model LLM będzie odpowiedzialny za jego ocenę przy generowaniu sekwencji.
4.  Zostaną utworzone dwie oddzielne tabele: `generated_sequences` do przechowywania metadanych wygenerowanych sekwencji oraz `feedback` do przechowywania opinii użytkowników.
5.  Tabela `feedback` będzie miała relację 1-do-1 z tabelą `generated_sequences` poprzez klucz obcy `generated_sequence_id`.
6.  Kolumny `duration`, `goal`, `level` będą przechowywane w tabeli `generated_sequences`.
7.  Kolumny `goal` i `level` będą typu ENUM. Czas trwania (`duration_minutes`) będzie typu INTEGER.
8.  Status feedbacku (`feedback_status`) będzie typu ENUM ('accepted', 'rejected') i przechowywany w tabeli `feedback`.
9.  Wiersz w tabeli `feedback` będzie tworzony tylko w momencie przesłania feedbacku przez użytkownika.
10. W tabeli `generated_sequences` zostanie dodana kolumna `generation_status` typu ENUM ('success', 'failure') z wartością domyślną 'failure'.
11. Próby generowania, które zakończą się niepowodzeniem, będą zapisywane w `generated_sequences` ze statusem 'failure'. Surowa odpowiedź LLM (`raw_llm_response`) będzie zapisywana, jeśli jest dostępna, w celu analizy błędów.
12. Sekwencja asan będzie przechowywana w sposób relacyjny w dedykowanej tabeli `sequence_asanas`, zawierającej `generated_sequence_id`, `asana_id` oraz `step_number`. Kolumna `processed_sequence` (JSONB) w `generated_sequences` nie jest potrzebna.
13. Dane użytkowników i asan nie będą fizycznie usuwane. Zamiast tego będzie stosowana archiwizacja (flaga `is_archived` w `asanas`, poleganie na mechanizmach Supabase dla użytkowników).
14. Zasady `ON DELETE` dla kluczy obcych zostaną ustawione na `RESTRICT` dla `user_id` (w `generated_sequences`) i `asana_id` (w `sequence_asanas`), aby zapobiec usunięciu danych używanych w innych miejscach.
15. Dla klucza obcego `generated_sequence_id` w tabelach `sequence_asanas` i `feedback` zostanie użyte `ON DELETE RESTRICT`, ponieważ użytkownik nie będzie miał możliwości usuwania sekwencji.
16. Polityki bezpieczeństwa na poziomie wiersza (RLS) będą włączone. Użytkownicy będą mieli dostęp tylko do swoich danych (sekwencji, feedbacku). Dostęp do `asanas` będzie ograniczony do odczytu dla uwierzytelnionych użytkowników.
17. Użytkownicy nie będą mieli uprawnień `DELETE` ani `UPDATE` (z wyjątkiem potencjalnego dodania komentarza w `feedback`) dla większości tabel.
18. Nie ma potrzeby tworzenia dodatkowych indeksów poza tymi na kluczach głównych, obcych oraz na `(generated_sequence_id, step_number)` w `sequence_asanas`.
19. Na etapie MVP nie będzie roli administratora; interfejs będzie obsługiwał tylko widok użytkownika.
20. Oczekiwane obciążenie na etapie MVP jest niskie (10-15 testerów, użycie nierównoczesne).
</decisions>

<matched_recommendations>
1.  **Nazewnictwo**: Zaakceptowano użycie angielskich nazw tabel i kolumn w stylu `snake_case`.
2.  **Typy danych**: Potwierdzono użycie `UUID` dla PK, `TIMESTAMPTZ` dla czasu, `INTEGER` dla czasu trwania, `TEXT` dla nazw/komentarzy, `JSONB` dla surowej odpowiedzi LLM oraz zdefiniowanych typów `ENUM`.
3.  **Ograniczenia**: Zaakceptowano użycie `NOT NULL`, `UNIQUE` (dla `feedback.generated_sequence_id` i `sequence_asanas.(generated_sequence_id, step_number)`), `FOREIGN KEY` z określonymi akcjami `ON DELETE` (`RESTRICT`).
4.  **Indeksy**: Zgodzono się na potrzebę indeksów na kluczach głównych/obcych oraz na `(generated_sequence_id, step_number)` w `sequence_asanas`.
5.  **RLS**: Potwierdzono konieczność włączenia RLS i zdefiniowania polityk opartych na `auth.uid()` dla zapewnienia własności danych i ograniczenia operacji (`SELECT`, `INSERT`, brak `UPDATE`/`DELETE`).
6.  **ENUMS**: Zdefiniowano i potwierdzono konkretne typy ENUM i ich wartości (`goal_enum`, `level_enum`, `feedback_status_enum`, `generation_status_enum`).
7.  **Archiwizacja Asan**: Zaakceptowano dodanie kolumny `is_archived` (BOOLEAN) do tabeli `asanas` zamiast fizycznego usuwania.
8.  **Obsługa Błędów Generowania**: Zaakceptowano dodanie kolumny `generation_status` (ENUM) w `generated_sequences` i zapisywanie nieudanych prób.
9.  **Relacyjne Przechowywanie Sekwencji**: Zaakceptowano rekomendację utworzenia tabeli `sequence_asanas` zamiast przechowywania sekwencji w JSON, co eliminuje potrzebę kolumny `processed_sequence`.
10. **Wartości Domyślne**: Zaakceptowano użycie `DEFAULT now()` dla `created_at` oraz `DEFAULT 'failure'` dla `generation_status`.
</matched_recommendations>

<database_planning_summary>
Celem było zaprojektowanie schematu bazy danych PostgreSQL dla aplikacji MVP Yoga CoPilot, która generuje sekwencje jogi dla użytkowników za pomocą LLM.

**Główne Wymagania:**
*   Przechowywanie informacji o asanach (pozycjach jogi), w tym nazwy (sanskryt, polski) i ilustracje.
*   Przechowywanie metadanych wygenerowanych sekwencji jogi (użytkownik, czas trwania, cel, poziom).
*   Przechowywanie samej sekwencji (kolejności asan).
*   Przechowywanie feedbacku użytkownika (akceptacja/odrzucenie, komentarz) dla każdej sekwencji.
*   Rejestrowanie statusu generowania sekwencji (sukces/porażka) i surowej odpowiedzi LLM.
*   Zapewnienie bezpieczeństwa danych (użytkownik widzi tylko swoje dane).
*   Umożliwienie archiwizacji asan i użytkowników zamiast ich usuwania.

**Kluczowe Encje i Relacje:**
1.  **`asanas`**: Lista dostępnych pozycji jogi (`id`, `sanskrit_name`, `polish_name`, `illustration_url`, `is_archived`).
2.  **`generated_sequences`**: Metadane wygenerowanej sekwencji (`id`, `user_id` FK, `duration_minutes`, `goal`, `level`, `generation_status`, `raw_llm_response`, `created_at`).
3.  **`sequence_asanas`**: Tabela łącząca, przechowująca kroki sekwencji (`id`, `generated_sequence_id` FK, `asana_id` FK, `step_number`). Reprezentuje relację wiele-do-wielu między sekwencjami a asanami, z zachowaniem kolejności.
4.  **`feedback`**: Feedback użytkownika (`id`, `generated_sequence_id` FK UNIQUE, `feedback_status`, `user_comment`, `created_at`). Relacja 1-do-1 z `generated_sequences`.

**Relacje Kluczowe:**
*   `generated_sequences.user_id` -> `auth.users.id` (FK, ON DELETE RESTRICT)
*   `sequence_asanas.generated_sequence_id` -> `generated_sequences.id` (FK, ON DELETE RESTRICT)
*   `sequence_asanas.asana_id` -> `asanas.id` (FK, ON DELETE RESTRICT)
*   `feedback.generated_sequence_id` -> `generated_sequences.id` (FK, ON DELETE RESTRICT, UNIQUE)

**Bezpieczeństwo i Skalowalność:**
*   **RLS**: Włączone dla wszystkich tabel. Polityki oparte na `auth.uid()` zapewniają, że użytkownicy mogą tworzyć i odczytywać tylko własne sekwencje i feedback. Dostęp do asan jest tylko do odczytu. Operacje `UPDATE` i `DELETE` są generalnie zabronione dla użytkowników.
*   **Archiwizacja**: Asany mogą być archiwizowane (`is_archived`), a polityka `ON DELETE RESTRICT` dla kluczy obcych zapobiega przypadkowemu usunięciu danych referencyjnych (użytkowników, asan, sekwencji).
*   **Skalowalność MVP**: Schemat jest zaprojektowany z myślą o niskim początkowym obciążeniu, ale użycie UUID, indeksów i relacyjnego podejścia zapewnia dobrą podstawę do przyszłego skalowania.

</database_planning_summary>

<unresolved_issues>
*   Brak zidentyfikowanych nierozwiązanych kwestii dotyczących *schematu bazy danych* na podstawie przeprowadzonej rozmowy. Dalsze szczegóły mogą pojawić się podczas implementacji, np. dokładny mechanizm archiwizacji użytkowników w Supabase lub specyficzna obsługa błędów LLM w logice aplikacji/Edge Functions.
</unresolved_issues>
</conversation_summary>