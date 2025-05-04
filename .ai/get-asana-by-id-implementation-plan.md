# API Endpoint Implementation Plan: GET /api/asanas/:id

## 1. Przegląd punktu końcowego
Ten punkt końcowy służy do pobierania szczegółowych informacji o pojedynczej asanie na podstawie jej unikalnego identyfikatora (ID).

## 2. Szczegóły żądania
- Metoda HTTP: `GET`
- Struktura URL: `/api/asanas/:id`
- Parametry:
  - Wymagane: `id` (parametr ścieżki, UUID asany)
  - Opcjonalne: Brak
- Request Body: Brak

## 3. Wykorzystywane typy
- **DTO (Data Transfer Object):**
  - `Asana` (z `src/types.ts`) dla struktury odpowiedzi.
- **Schemat Walidacji (Zod):**
  - Schemat do walidacji parametru ścieżki `id` (musi być stringiem w formacie UUID).

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):**
  ```json
  {
    "id": "string (uuid)",
    "sanskrit_name": "string",
    "polish_name": "string",
    "illustration_url": "string",
    "is_archived": false,
    "created_at": "string (ISO 8601 timestamp)"
  }
  ```
- **Błędy:**
  - `400 Bad Request`: Nieprawidłowy format `id`.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Asana o podanym `id` nie została znaleziona.
  - `500 Internal Server Error`: Błąd serwera podczas przetwarzania żądania.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu Astro `/src/pages/api/asanas/[id].ts`.
2.  Middleware (`src/middleware/index.ts`) sprawdza uwierzytelnienie użytkownika za pomocą Supabase Auth. Jeśli użytkownik nie jest uwierzytelniony, zwraca `401 Unauthorized`.
3.  Handler endpointu (`GET` w `[id].ts`) pobiera parametr `id` z `context.params`.
4.  Parametr `id` jest walidowany za pomocą schematu Zod (musi być UUID). Jeśli walidacja nie powiodła się, zwraca `400 Bad Request`.
5.  Handler wywołuje metodę `getAsanaById(id, supabase)` z serwisu `AsanaService` (`src/lib/services/asana.service.ts`), przekazując zwalidowany `id` oraz instancję `SupabaseClient` z `context.locals.supabase`.
6.  Metoda `getAsanaById` wykonuje zapytanie do tabeli `asanas` w bazie danych Supabase, wyszukując asanę o podanym `id`, która nie jest zarchiwizowana (`is_archived = false`).
7.  Jeśli asana nie zostanie znaleziona, serwis zwraca `null` lub rzuca dedykowany błąd. Handler endpointu przechwytuje to i zwraca `404 Not Found`.
8.  Jeśli wystąpi błąd podczas zapytania do bazy danych, serwis rzuca błąd. Handler endpointu przechwytuje go i zwraca `500 Internal Server Error`.
9.  Jeśli asana zostanie znaleziona, serwis zwraca obiekt `Asana`.
10. Handler endpointu formatuje odpowiedź zgodnie ze specyfikacją i zwraca ją z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Wszystkie żądania do tego endpointu muszą być uwierzytelnione. Middleware Astro z integracją Supabase Auth będzie odpowiedzialne za weryfikację sesji użytkownika.
- **Autoryzacja:** Obecnie nie ma specyficznych wymagań dotyczących ról. Każdy uwierzytelniony użytkownik może uzyskać dostęp do danych asany.
- **Walidacja danych wejściowych:** Parametr `id` musi być ściśle walidowany jako UUID, aby zapobiec potencjalnym atakom (np. SQL injection, chociaż ORM Supabase zapewnia ochronę) i błędom przetwarzania.
- **Ograniczenie dostępu do niearchiwizowanych:** Zapytanie SQL powinno jawnie filtrować `is_archived = false`, aby uniknąć ujawnienia danych, które nie powinny być publicznie dostępne.

## 7. Obsługa błędów
- **Błąd walidacji `id`:** Zwróć `400 Bad Request` z komunikatem wskazującym na nieprawidłowy format ID.
- **Brak uwierzytelnienia:** Middleware zwróci `401 Unauthorized`.
- **Asana nie znaleziona:** Serwis `AsanaService` powinien zasygnalizować brak zasobu (np. zwracając `null`). Handler endpointu powinien na tej podstawie zwrócić `404 Not Found`.
- **Błąd bazy danych/serwera:** Wszelkie nieoczekiwane błędy podczas interakcji z bazą danych lub inne błędy serwera powinny skutkować zwróceniem `500 Internal Server Error`. Należy logować szczegóły błędu po stronie serwera dla celów diagnostycznych.
- **Logowanie:** Błędy (walidacji, bazy danych, inne błędy 500) powinny być logowane za pomocą standardowego mechanizmu logowania aplikacji.

## 8. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych:** Upewnij się, że kolumna `id` (która jest kluczem głównym) w tabeli `asanas` jest prawidłowo zindeksowana, co jest domyślne dla kluczy głównych.
- **Rozmiar odpowiedzi:** Odpowiedź zawiera tylko dane dla jednej asany, więc jej rozmiar jest niewielki. Nie przewiduje się problemów z wydajnością związanych z rozmiarem odpowiedzi.
- **Optymalizacja zapytań:** Zapytanie SQL powinno być proste (`SELECT * FROM asanas WHERE id = $1 AND is_archived = false LIMIT 1`).

## 9. Etapy wdrożenia
1.  **Utworzenie pliku endpointu:** Stwórz plik `/src/pages/api/asanas/[id].ts`.
2.  **Zdefiniowanie schematu walidacji:** W pliku `[id].ts` zdefiniuj schemat Zod do walidacji parametru ścieżki `id` jako UUID.
3.  **Implementacja handlera GET:** W pliku `[id].ts` zaimplementuj funkcję `GET` obsługującą żądanie:
    - Pobierz `id` z `context.params`.
    - Pobierz klienta `supabase` z `context.locals.supabase`.
    - Zwaliduj `id` za pomocą schematu Zod. Zwróć `400` w przypadku błędu.
    - Wywołaj metodę serwisu `AsanaService.getAsanaById(id, supabase)`.
    - Obsłuż przypadki błędów (`404`, `500`).
    - Zwróć znalezioną asanę z kodem `200`.
4.  **Utworzenie/aktualizacja serwisu:**
    - Jeśli `AsanaService` (`src/lib/services/asana.service.ts`) nie istnieje, utwórz go.
    - Dodaj metodę `getAsanaById(id: string, supabase: SupabaseClient): Promise<Asana | null>`:
      - Wykonaj zapytanie Supabase, aby pobrać asanę po `id` (`eq('id', id)`) i upewnij się, że `is_archived` jest `false`.
      - Obsłuż błędy zapytania (rzucaj błąd lub loguj i zwracaj `null` w przypadku błędu DB).
      - Zwróć znalezioną asanę lub `null`, jeśli nie istnieje.
5.  **Aktualizacja typów (jeśli konieczne):** Upewnij się, że typ `Asana` w `src/types.ts` jest aktualny i zgodny ze strukturą tabeli `asanas` oraz oczekiwaną odpowiedzią API.
6.  **Dokumentacja:** Zaktualizuj dokumentację API (np. plik OpenAPI/Swagger, jeśli istnieje), aby odzwierciedlić nowy endpoint.
