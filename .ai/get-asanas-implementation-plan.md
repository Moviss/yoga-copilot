# API Endpoint Implementation Plan: GET /api/asanas

## 1. Przegląd punktu końcowego

Endpoint GET /api/asanas służy do pobierania listy dostępnych asan (pozycji jogi) z możliwością paginacji i filtrowania.
Endpoint zwraca listę asan wraz z ich szczegółami oraz metadane paginacji.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: /api/asanas
- Parametry:
    - Wymagane: Brak
    - Opcjonalne:
        - `page`: Numer strony (domyślnie: 1)
        - `limit`: Liczba elementów na stronie (domyślnie: 20)
        - `is_archived`: Filtrowanie według statusu archiwizacji (opcjonalne)
- Request Body: Brak (metoda GET)

## 3. Wykorzystywane typy

Wszystkie potrzebne typy są już zdefiniowane w `src/types.ts`:

- `AsanaDTO`: Typ DTO dla encji Asana
- `AsanaQueryParams`: Parametry zapytania dla filtrowania asan
- `PaginationDTO`: Informacje o paginacji
- `PaginatedResponseDTO<AsanaDTO>`: Kompletna struktura odpowiedzi

## 4. Szczegóły odpowiedzi

- Format: JSON
- Struktura:
  ```json
  {
    "data": [
      {
        "id": "string",
        "sanskrit_name": "string",
        "polish_name": "string",
        "illustration_url": "string",
        "is_archived": boolean,
        "created_at": "string"
      }
    ],
    "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "pages": number
    }
  }
  ```
- Kody statusu:
    - 200 OK: Pomyślne pobranie danych
    - 401 Unauthorized: Brak autoryzacji
    - 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych

1. Żądanie GET trafia do endpointu /api/asanas
2. Middleware sprawdza autoryzację użytkownika
3. Parametry zapytania są walidowane za pomocą Zod
4. Serwis AsanaService pobiera dane z bazy Supabase:
    - Wykonuje zapytanie do tabeli asanas
    - Filtruje według is_archived, jeśli podano
    - Implementuje paginację według page i limit
    - Oblicza metadane paginacji (total, pages)
5. Dane są mapowane do formatu odpowiedzi
6. Odpowiedź JSON jest zwracana klientowi

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Endpoint powinien być dostępny tylko dla zalogowanych użytkowników
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania muszą być walidowane
- **Filtrowanie danych**: Zarchiwizowane asany mogą być widoczne tylko dla określonych ról użytkowników
- **Rate limiting**: Implementacja limitu zapytań, aby zapobiec atakom DoS

## 7. Obsługa błędów

- **Nieprawidłowe parametry zapytania**: Zwróć 400 Bad Request z jasnym komunikatem o błędzie
- **Nieuprawniony dostęp**: Zwróć 401 Unauthorized, gdy użytkownik nie jest zalogowany
- **Błędy bazy danych**: Zwróć 500 Internal Server Error, loguj szczegóły błędu, zwracaj użytkownikowi ogólny komunikat
- **Puste wyniki**: Zwróć 200 OK z pustą tablicą data i odpowiednimi metadanymi paginacji

## 8. Rozważania dotyczące wydajności

- **Indeksowanie**: Upewnij się, że kolumny używane do filtrowania (`is_archived`) są zindeksowane
- **Ograniczenie rozmiaru**: Ustaw rozsądne limity dla parametru `limit`, aby uniknąć przeciążenia
- **Buforowanie**: Rozważ buforowanie odpowiedzi dla popularnych kombinacji parametrów
- **Monitorowanie wydajności**: Dodaj metryki wydajności, aby monitorować czas odpowiedzi endpointu

## 9. Etapy wdrożenia

1. Utwórz plik `/src/pages/api/asanas.ts` dla endpointu GET
2. Utwórz lub zaktualizuj serwis `/src/lib/services/asana.service.ts`
3. Zaimplementuj schemat walidacji Zod dla parametrów zapytania
4. Zaimplementuj obsługę GET w pliku endpointu:
   ```typescript
   import { z } from 'zod';
   import type { APIContext } from 'astro';
   import { AsanaService } from '../../lib/services/asana.service';
   
   export const prerender = false;
   
   const querySchema = z.object({
     page: z.coerce.number().positive().default(1),
     limit: z.coerce.number().positive().max(100).default(20),
     is_archived: z.coerce.boolean().optional(),
   });
   
   export async function GET({ request, locals }: APIContext) {
     // Sprawdź autoryzację
     const supabase = locals.supabase;
     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session) {
       return new Response(
         JSON.stringify({ error: 'Unauthorized' }), 
         { status: 401, headers: { 'Content-Type': 'application/json' } }
       );
     }
     
     try {
       // Pobierz i zwaliduj parametry zapytania
       const url = new URL(request.url);
       const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams));
       
       if (!queryResult.success) {
         return new Response(
           JSON.stringify({ error: 'Invalid query parameters', details: queryResult.error.format() }), 
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }
       
       const query = queryResult.data;
       
       // Pobierz dane z serwisu
       const asanaService = new AsanaService(supabase);
       const response = await asanaService.getAsanas(query);
       
       // Zwróć odpowiedź
       return new Response(
         JSON.stringify(response), 
         { status: 200, headers: { 'Content-Type': 'application/json' } }
       );
     } catch (error) {
       console.error('Error fetching asanas:', error);
       
       return new Response(
         JSON.stringify({ error: 'Internal server error' }), 
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   }
   ```
5. Zaimplementuj serwis AsanaService:
   ```typescript
   import type { SupabaseClient } from '../db/supabase.client';
   import type { AsanaQueryParams, PaginatedResponseDTO, AsanaDTO } from '../../types';
   
   export class AsanaService {
     constructor(private supabase: SupabaseClient) {}
     
     async getAsanas(params: AsanaQueryParams): Promise<PaginatedResponseDTO<AsanaDTO>> {
       const { page = 1, limit = 20, is_archived } = params;
       
       // Oblicz offset dla paginacji
       const offset = (page - 1) * limit;
       
       // Utwórz zapytanie bazowe
       let query = this.supabase
         .from('asanas')
         .select('*', { count: 'exact' });
       
       // Dodaj filtr is_archived, jeśli podano
       if (is_archived !== undefined) {
         query = query.eq('is_archived', is_archived);
       }
       
       // Wykonaj zapytanie z paginacją
       const { data, error, count } = await query
         .range(offset, offset + limit - 1)
         .order('created_at', { ascending: false });
       
       if (error) throw error;
       
       // Wylicz metadane paginacji
       const total = count || 0;
       const pages = Math.ceil(total / limit);
       
       // Zwróć odpowiedź w wymaganym formacie
       return {
         data: data || [],
         pagination: {
           total,
           page,
           limit,
           pages
         }
       };
     }
   }
   ```
6. Przetestuj endpoint manualnie
7. Zaktualizuj dokumentację API
