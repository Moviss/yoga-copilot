# Aplikacja - Yoga CoPilot (MVP)

## Główny problem

Instruktorzy jogi oraz osoby samodzielnie praktykujące często potrzebują szybkiej inspiracji lub gotowych, krótkich sekwencji asan dostosowanych do konkretnych potrzeb (np. dostępnego czasu, celu praktyki, poziomu zaawansowania). Tworzenie takich sekwencji "na poczekaniu" lub przeszukiwanie obszernych zasobów w poszukiwaniu odpowiedniego fragmentu jest czasochłonne i nie zawsze efektywne. Yoga CoPilot rozwiązuje ten problem, oferując błyskawiczne generowanie spersonalizowanych "mini-praktyk" za pomocą AI, oszczędzając czas i dostarczając ukierunkowanej inspiracji.

## Najmniejszy zestaw funkcjonalności

- **Uwierzytelnianie użytkowników:** Prosta rejestracja i logowanie (np. przez e-mail/hasło) z wykorzystaniem Supabase Auth.
- **Interfejs wprowadzania danych:** Minimalistyczny formularz (jeden główny widok), gdzie użytkownik może wybrać podstawowe parametry sekwencji:
  - Czas trwania (np. wybór z listy: 5, 10, 15, 20, 30 minut).
  - Cel/Fokus praktyki (np. wybór z listy: Rozciąganie, Wzmocnienie, Relaks, Energia, Balans).
  - Poziom zaawansowania (np. wybór z listy: Początkujący, Średniozaawansowany).
- **Rdzeń generujący (AI):** Funkcja backendowa (Supabase Edge Function) przyjmująca parametry od użytkownika i wysyłająca odpowiednio skonstruowane zapytanie (prompt) do zewnętrznego API modelu językowego (LLM).
- **Wyświetlanie wyniku:** Prezentacja wygenerowanej przez AI sekwencji asan w formie prostej listy tekstowej (np. nazwy pozycji, ewentualnie bardzo krótkie sugestie przejść) w drugim widoku aplikacji oraz ilustracje dla konkretnych pozycji.

## Co NIE wchodzi w zakres MVP

- Zapisywanie ulubionych/wygenerowanych sekwencji przez użytkowników.
- Możliwość edycji wygenerowanych sekwencji.
- Wizualizacje pozycji (zdjęcia, animacje, wideo).
- Instrukcje głosowe lub przewodniki audio/wideo.
- Odtwarzanie muzyki w tle.
- Funkcje społecznościowe (udostępnianie, komentowanie, profile publiczne).
- Zaawansowane filtry i opcje personalizacji (np. wykluczanie konkretnych asan, wybór stylu jogi, dodawanie własnych pozycji).
- Integracje z kalendarzem czy innymi aplikacjami fitness.
- Tryb offline.
- Aplikacje natywne (iOS/Android) - MVP to aplikacja webowa.
- Generowanie bardzo długich, pełnych sesji (powyżej ok. 30 minut).
- Indywidualna analiza przeciwwskazań zdrowotnych.

## Kryteria sukcesu

Głównym celem MVP jest **weryfikacja hipotezy, czy istnieje realne zapotrzebowanie na narzędzie AI generujące krótkie, spersonalizowane sekwencje jogi** oraz **czy jakość generowanych sekwencji jest wystarczająco dobra**, aby użytkownicy (instruktorzy, praktykujący) uznali je za wartościowe i użyteczne.

Mierzalne cele MVP:

- Uruchomienie funkcjonalnej aplikacji webowej dostępnej dla pierwszych użytkowników.
- Generowanie zgodnych z kryteriami sekwecji jogi ze skutecznością (sensownością) na poziomie co najmniej 75%.
