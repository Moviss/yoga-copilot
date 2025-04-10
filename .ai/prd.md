# Dokument wymagań produktu (PRD) - Yoga CoPilot (MVP)

## 1. Przegląd produktu

Yoga CoPilot (MVP) to aplikacja webowa zaprojektowana, aby dostarczać instruktorom jogi oraz osobom samodzielnie praktykującym szybkich, spersonalizowanych "mini-praktyk" jogi generowanych przez sztuczną inteligencję. Celem MVP jest stworzenie narzędzia, które na podstawie podstawowych parametrów wejściowych użytkownika (czas trwania, cel/fokus, poziom zaawansowania) generuje kompletne, przemyślane sekwencje asan trwające do 30 minut. Aplikacja ma za zadanie oszczędzać czas użytkowników i dostarczać ukierunkowanej inspiracji do praktyki. MVP będzie wykorzystywać Supabase do uwierzytelniania, funkcji backendowych (Edge Functions) i bazy danych, oraz zewnętrzny model językowy (LLM) do generowania sekwencji. Interfejs użytkownika zostanie zbudowany przy użyciu Astro, React i Tailwind.

## 2. Problem użytkownika

Instruktorzy jogi oraz osoby samodzielnie praktykujące (szczególnie te z pewnym doświadczeniem) często napotykają na wyzwania związane z tworzeniem krótkich, dopasowanych do bieżących potrzeb sekwencji asan. Brakuje im czasu na przygotowanie, inspiracji do stworzenia nowej sekwencji lub umiejętności efektywnego strukturyzowania krótkiej praktyki. Przeszukiwanie obszernych zasobów (książek, filmów, internetu) w poszukiwaniu odpowiedniego fragmentu jest czasochłonne i nie zawsze prowadzi do znalezienia idealnie dopasowanej sekwencji. Yoga CoPilot adresuje ten problem, oferując natychmiastowe generowanie spersonalizowanych mini-praktyk, eliminując potrzebę samodzielnego planowania lub długotrwałego poszukiwania inspiracji.

## 3. Wymagania funkcjonalne

### 3.1 Uwierzytelnianie użytkowników

- Rejestracja nowych użytkowników za pomocą adresu e-mail i hasła.
- Logowanie istniejących użytkowników za pomocą adresu e-mail i hasła.
- Wylogowanie użytkownika.
- Wykorzystanie Supabase Auth do zarządzania procesem uwierzytelniania.
- Brak zbierania dodatkowych danych demograficznych (płeć, wiek, doświadczenie) w MVP.

### 3.2 Interfejs wprowadzania danych

- Minimalistyczny formularz na głównym widoku aplikacji.
- Możliwość wyboru czasu trwania sekwencji z predefiniowanej listy (np. 5, 10, 15, 20, 30 minut).
- Możliwość wyboru celu/fokusu praktyki z predefiniowanej listy (np. Rozciąganie, Wzmocnienie, Relaks, Energia, Balans).
- Możliwość wyboru poziomu zaawansowania z predefiniowanej listy (np. Początkujący, Średniozaawansowany).

### 3.3 Generowanie sekwencji (Rdzeń AI)

- Funkcja backendowa (Supabase Edge Function) przyjmująca parametry z formularza.
- Funkcja wysyła odpowiednio skonstruowane zapytanie (prompt) do zewnętrznego API LLM (wybór modelu TBD - np. Claude 3.x, Gemini Pro, GPT-4o).
- Prompt zawiera instrukcje dotyczące:
  - Użycia wyłącznie asan z predefiniowanej, dostarczonej listy.
  - Uwzględnienia wybranych przez użytkownika parametrów (czas, cel, poziom).
  - Stosowania podstawowych zasad bezpieczeństwa i logiki sekwencjonowania (np. odpowiednia rozgrzewka, płynne przejścia, unikanie niebezpiecznych kombinacji).
  - Zwrócenia wyniku w ustrukturyzowanym formacie (preferowany JSON).
- Strategia prompt engineeringu będzie rozwijana iteracyjnie.

### 3.4 Wyświetlanie wyniku

- Prezentacja wygenerowanej sekwencji asan w dedykowanym widoku.
- Sekwencja wyświetlana jako lista tekstowa zawierająca:
  - Nazwy poszczególnych asan.
  - Krótkie sugestie dotyczące przejść między asanami.
- Wyświetlanie ilustracji dla każdej asany w sekwencji.
- Ilustracje pochodzą z wcześniej przygotowanej biblioteki obrazów wygenerowanych przez AI dla wszystkich asan z predefiniowanej listy.

### 3.5 Mechanizm zbierania feedbacku

- Przyciski "Akceptuj" i "Odrzuć" widoczne przy każdej wygenerowanej sekwencji.
- Opcjonalne pole tekstowe umożliwiające użytkownikowi dodanie komentarza (dostępne zarówno przy akceptacji, jak i odrzuceniu).
- Zapis danych feedbacku do bazy danych Supabase:
  - Wygenerowana sekwencja (prawdopodobnie pełna odpowiedź JSON z LLM).
  - Status (zaakceptowana/odrzucona).
  - Opcjonalny komentarz użytkownika.
  - Timestamp.
  - ID użytkownika.
- Schemat tabeli/kolumny JSON w bazie danych zostanie doprecyzowany podczas implementacji.

### 3.6 Przewodnik użytkownika i Disclaimer

- Wyświetlenie krótkiej instrukcji obsługi w oknie modalnym przy pierwszym uruchomieniu aplikacji przez użytkownika.
- Stała ikona pomocy (np. znak zapytania "?") w interfejsie, której kliknięcie ponownie otwiera modal z instrukcją.
- Widoczny i jednoznaczny disclaimer zdrowotny informujący, że aplikacja nie dostarcza indywidualnych porad medycznych i zalecający konsultację z lekarzem lub wykwalifikowanym instruktorem przed rozpoczęciem praktyki.

### 3.7 Obsługa błędów

- Rozróżnienie i odpowiednia obsługa błędów technicznych (np. problem z API LLM, błąd sieci):
  - Wyświetlenie użytkownikowi komunikatu o błędzie.
  - Umożliwienie ponowienia próby wygenerowania sekwencji.
- Obsługa przypadków, gdy wygenerowana sekwencja jest niskiej jakości (niespełniająca oczekiwań użytkownika):
  - Użytkownik ma możliwość odrzucenia sekwencji za pomocą dedykowanego przycisku (część mechanizmu feedbacku).

## 4. Granice produktu (Co NIE wchodzi w zakres MVP)

Następujące funkcjonalności i cechy są świadomie wyłączone z zakresu MVP:

- Zapisywanie ulubionych lub historycznych sekwencji przez użytkownika.
- Możliwość edytowania wygenerowanych sekwencji.
- Zaawansowane wizualizacje pozycji (animacje, wideo).
- Instrukcje głosowe lub przewodniki audio/wideo towarzyszące praktyce.
- Integracja z odtwarzaczem muzyki lub dostarczanie muzyki w tle.
- Funkcje społecznościowe (udostępnianie sekwencji, komentowanie, profile publiczne).
- Zaawansowane opcje filtrowania i personalizacji (np. wykluczanie konkretnych asan, wybór specyficznego stylu jogi, dodawanie własnych pozycji, uwzględnianie rekwizytów).
- Integracje z zewnętrznymi aplikacjami (np. kalendarz, aplikacje fitness).
- Tryb offline umożliwiający korzystanie z aplikacji bez połączenia z internetem.
- Aplikacje natywne na platformy iOS/Android.
- Generowanie bardzo długich, pełnych sesji jogi (powyżej ok. 30 minut).
- Indywidualna analiza przeciwwskazań zdrowotnych użytkownika.
- Zbieranie i wykorzystywanie dodatkowych danych demograficznych użytkowników (płeć, wiek, szczegółowe doświadczenie w jodze) poza wymaganymi do uwierzytelniania.

## 5. Historyjki użytkowników

### Rejestracja i Logowanie

- ID: YC-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc utworzyć konto w aplikacji używając mojego adresu e-mail i hasła, abym mógł korzystać z funkcji generowania sekwencji jogi.
- Kryteria akceptacji:

  - Formularz rejestracji zawiera pola na adres e-mail i hasło (z potwierdzeniem).
  - Walidacja adresu e-mail (format).
  - Walidacja siły hasła (minimalne wymagania).
  - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego widoku aplikacji.
  - W przypadku błędu (np. zajęty e-mail) wyświetlany jest odpowiedni komunikat.

- ID: YC-002
- Tytuł: Logowanie istniejącego użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji używając mojego adresu e-mail i hasła, abym mógł uzyskać dostęp do mojego konta i generować sekwencje.
- Kryteria akceptacji:

  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po pomyślnym zalogowaniu użytkownik jest przekierowany do głównego widoku aplikacji.
  - W przypadku błędnych danych logowania wyświetlany jest odpowiedni komunikat.
  - Istnieje opcja przypomnienia/resetu hasła (może być odłożone po MVP, jeśli Supabase Auth nie oferuje tego łatwo).

- ID: YC-010
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zakończyć moją sesję.
- Kryteria akceptacji:

  - W interfejsie dostępna jest opcja "Wyloguj".
  - Po kliknięciu "Wyloguj" sesja użytkownika jest kończona i jest on przekierowywany do strony logowania/głównej strony publicznej.

- ID: YC-011
- Tytuł: Obsługa błędów uwierzytelniania
- Opis: Jako użytkownik próbujący się zarejestrować lub zalogować, chcę otrzymywać jasne komunikaty o błędach, jeśli proces się nie powiedzie (np. zły format e-mail, zajęty e-mail, złe hasło, błąd serwera), abym wiedział, co poszło nie tak i jak to naprawić.
- Kryteria akceptacji:
  - Wyświetlane są zrozumiałe komunikaty błędów walidacji pól formularza (e-mail, hasło).
  - Wyświetlany jest komunikat w przypadku próby rejestracji na już istniejący e-mail.
  - Wyświetlany jest komunikat w przypadku podania błędnych danych logowania.
  - Wyświetlany jest ogólny komunikat w przypadku nieoczekiwanego błędu serwera podczas uwierzytelniania.

### Generowanie Sekwencji

- ID: YC-003
- Tytuł: Wybór parametrów sekwencji
- Opis: Jako zalogowany użytkownik, chcę móc wybrać czas trwania, cel/fokus oraz poziom zaawansowania dla mojej sesji jogi za pomocą prostego formularza, abym mógł wygenerować sekwencję dopasowaną do moich potrzeb.
- Kryteria akceptacji:

  - Formularz zawiera rozwijane listy lub grupy przycisków do wyboru:
    - Czasu trwania (opcje: 5, 10, 15, 20, 30 minut).
    - Celu/Fokusu (opcje: Rozciąganie, Wzmocnienie, Relaks, Energia, Balans).
    - Poziomu zaawansowania (opcje: Początkujący, Średniozaawansowany).
  - Istnieje przycisk "Generuj sekwencję" (lub podobny).
  - Przycisk "Generuj" jest aktywny tylko po wybraniu wszystkich parametrów.

- ID: YC-004
- Tytuł: Inicjowanie generowania sekwencji
- Opis: Jako użytkownik, po wybraniu parametrów, chcę kliknąć przycisk "Generuj", aby wysłać moje preferencje do systemu i rozpocząć proces tworzenia sekwencji jogi przez AI.
- Kryteria akceptacji:

  - Kliknięcie przycisku "Generuj" wywołuje funkcję backendową (Supabase Edge Function).
  - Podczas generowania sekwencji użytkownik widzi wskaźnik postępu lub informację o trwającym procesie (np. animacja ładowania).
  - Wybrane parametry są poprawnie przekazywane do funkcji backendowej.

- ID: YC-005
- Tytuł: Wyświetlanie wygenerowanej sekwencji
- Opis: Jako użytkownik, po zakończeniu generowania, chcę zobaczyć wynikową sekwencję asan w formie czytelnej listy tekstowej wraz z ilustracjami dla każdej pozycji, abym mógł rozpocząć praktykę lub ocenić jej jakość.
- Kryteria akceptacji:

  - Sekwencja jest wyświetlana w dedykowanym widoku/sekcji.
  - Lista zawiera nazwy asan w odpowiedniej kolejności.
  - Lista zawiera krótkie sugestie przejść między asanami (jeśli zwrócone przez AI).
  - Dla każdej asany na liście wyświetlana jest odpowiadająca jej ilustracja z przygotowanej biblioteki.
  - Formatowanie jest przejrzyste i łatwe do odczytania.

- ID: YC-009
- Tytuł: Obsługa błędów podczas generowania sekwencji
- Opis: Jako użytkownik, jeśli wystąpi błąd techniczny podczas generowania sekwencji (np. problem z połączeniem z API LLM), chcę zobaczyć komunikat o błędzie i mieć możliwość ponowienia próby, abym nie utknął w martwym punkcie.
- Kryteria akceptacji:
  - W przypadku błędu technicznego wskaźnik ładowania znika.
  - Wyświetlany jest zrozumiały komunikat informujący o problemie (np. "Nie udało się wygenerować sekwencji. Spróbuj ponownie.").
  - Dostępny jest przycisk lub link umożliwiający ponowne uruchomienie procesu generowania z tymi samymi parametrami.

### Feedback i Interfejs

- ID: YC-006
- Tytuł: Udzielanie feedbacku na temat sekwencji
- Opis: Jako użytkownik, chcę móc ocenić wygenerowaną sekwencję, klikając przycisk "Akceptuj" lub "Odrzuć", oraz opcjonalnie dodać komentarz tekstowy, aby przekazać twórcom informację zwrotną na temat jakości i użyteczności sekwencji.
- Kryteria akceptacji:

  - Pod wygenerowaną sekwencją widoczne są przyciski "Akceptuj" i "Odrzuć".
  - Widoczne jest opcjonalne pole tekstowe do wprowadzenia komentarza.
  - Kliknięcie "Akceptuj" lub "Odrzuć" zapisuje status (zaakceptowana/odrzucona), wygenerowaną sekwencję, opcjonalny komentarz, ID użytkownika i timestamp do bazy danych.
  - Po udzieleniu feedbacku użytkownik może otrzymać potwierdzenie (np. krótki komunikat "Dziękujemy za feedback!").
  - Użytkownik może wygenerować nową sekwencję po udzieleniu feedbacku.

- ID: YC-007
- Tytuł: Dostęp do przewodnika użytkownika/pomocy
- Opis: Jako użytkownik, chcę mieć łatwy dostęp do krótkiej instrukcji obsługi aplikacji (przy pierwszym użyciu oraz później przez ikonę pomocy), abym zrozumiał, jak korzystać z jej funkcji.
- Kryteria akceptacji:

  - Przy pierwszym uruchomieniu aplikacji po rejestracji/logowaniu automatycznie wyświetla się modal z krótką instrukcją.
  - W interfejsie aplikacji widoczna jest stała ikona pomocy (np. "?").
  - Kliknięcie ikony pomocy otwiera ten sam modal z instrukcją.
  - Modal zawiera podstawowe informacje o wybieraniu parametrów, generowaniu sekwencji i udzielaniu feedbacku.
  - Modal można łatwo zamknąć.

- ID: YC-008
- Tytuł: Wyświetlanie disclaimera zdrowotnego
- Opis: Jako użytkownik, chcę widzieć wyraźny komunikat ostrzegawczy (disclaimer), informujący mnie, że aplikacja nie zastępuje porady medycznej i że powinienem skonsultować się z profesjonalistą przed rozpoczęciem praktyki, aby być świadomym potencjalnych ryzyk.
- Kryteria akceptacji:
  - Disclaimer jest widoczny w kluczowym miejscu aplikacji (np. w stopce, przy wynikach generowania, w modalu powitalnym).
  - Treść disclaimera jasno komunikuje, że aplikacja ma charakter inspiracyjny/pomocniczy i nie stanowi porady medycznej.
  - Treść zachęca do konsultacji z lekarzem lub wykwalifikowanym instruktorem jogi.

## 6. Metryki sukcesu

Głównym celem MVP jest weryfikacja hipotezy o realnym zapotrzebowaniu na narzędzie AI generujące krótkie, spersonalizowane sekwencje jogi oraz ocena, czy jakość generowanych sekwencji jest wystarczająco dobra dla użytkowników (instruktorów, praktykujących).

Mierzalne cele i kryteria sukcesu MVP:

1.  Uruchomienie Funkcjonalnej Aplikacji Webowej:

    - Metryka: Działająca aplikacja webowa dostępna pod publicznym (choć ograniczonym dla grupy testowej) adresem URL.
    - Cel: Wdrożenie pierwszej działającej wersji w ciągu 5 tygodni przez jednego dewelopera.
    - Pomiar: Potwierdzenie dostępności i podstawowej funkcjonalności aplikacji.

2.  Jakość Generowanych Sekwencji:

    - Metryka: Wskaźnik akceptacji sekwencji = (Liczba sekwencji oznaczonych jako "Zaakceptowane") / (Całkowita liczba wygenerowanych i ocenionych sekwencji).
    - Cel: Osiągnięcie wskaźnika akceptacji na poziomie > 75% w grupie testowej.
    - Pomiar: Analiza danych z mechanizmu feedbacku (status Akceptuj/Odrzuć) zapisanych w bazie danych. Wstępna walidacja jakości przez doświadczonych instruktorów jogi przed udostępnieniem testerom.

3.  Weryfikacja Zapotrzebowania i Wartości:

    - Metryka: Jakościowy feedback od użytkowników testowych.
    - Cel: Zebranie przeważająco pozytywnych opinii dotyczących użyteczności, wartości i chęci dalszego korzystania z narzędzia.
    - Pomiar: Przeprowadzenie nieformalnych rozmów/wywiadów z członkami grupy testowej, analiza opcjonalnych komentarzy z mechanizmu feedbacku. Konieczne będzie syntetyzowanie notatek z rozmów.

4.  Utrzymanie Budżetu Operacyjnego:
    - Metryka: Miesięczne koszty operacyjne (API LLM + infrastruktura Supabase).
    - Cel: Utrzymanie kosztów poniżej 100 USD miesięcznie.
    - Pomiar: Monitorowanie zużycia i kosztów w panelach administracyjnych dostawców usług (Supabase, dostawca LLM) oraz ustawienie odpowiednich limitów.
