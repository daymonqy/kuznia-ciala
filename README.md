# Kuźnia Ciała

Aplikacja fitness z systemem logowania e-mail i danymi przypisanymi do konta użytkownika.

**Strona:** https://daymonqy.github.io/kuznia-ciala/

---

## System logowania (Firebase)

Wszystkie dane użytkownika (treningi, ulubione, postępy) są zapisywane w chmurze pod jego unikalnym kontem.

### Krok po kroku – konfiguracja Firebase (raz)

1. Wejdź na **[console.firebase.google.com](https://console.firebase.google.com)** i zaloguj się kontem Google.
2. Kliknij **„Dodaj projekt”** → nazwij go np. `kuznia-ciala` → utwórz.
3. W projekcie kliknij ikonę **Web** (`</>`) → zarejestruj aplikację (nazwa dowolna).
4. Skopiuj obiekt `firebaseConfig` (apiKey, authDomain, projectId itd.).
5. Otwórz plik **`js/firebase-config.js`** w tym repozytorium i wklej swoje dane w miejsce placeholderów.
6. W Firebase Console:
   - **Authentication** → **Sign-in method** → włącz **Email/Password** → Zapisz.
   - **Firestore Database** → **Utwórz bazę danych** → wybierz lokalizację (np. `europe-west`) → tryb **testowy** (na start).
7. (Opcjonalnie) W Firestore → **Rules** ustaw na produkcję:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
8. Commit i push zmian w `firebase-config.js` (lub edytuj przez GitHub web).

Po tym logowanie i rejestracja działają. Dane są przypisane do konta.

---

## Jak to działa

| Funkcja | Opis |
|---------|------|
| Rejestracja | E-mail + hasło → tworzy konto i dokument użytkownika w Firestore |
| Logowanie | E-mail + hasło → sesja utrzymywana automatycznie |
| Wylogowanie | Zakładka **Ty** |
| Zapisywanie danych | Funkcje `saveWorkout()`, `addToUserArray()`, `saveUserData()` – zawsze pod UID zalogowanego użytkownika |
| Status | W prawym górnym rogu widać e-mail lub „Gość” |

### Przykład zapisu treningu (już jest na stronie Trening)

```js
await saveWorkout({
  name: 'Trening pełnego ciała',
  exercises: ['Przysiady', 'Pompki'],
  duration: 45
});
```

Dane trafiają do `users/{uid}/workouts` i są widoczne tylko dla tego użytkownika.

---

## Struktura plików

```
├── index.html          # Główna
├── eksploruj.html
├── trening.html        # Przykład zapisu danych do konta
├── biblioteka.html
├── ty.html             # Logowanie / rejestracja / profil
├── css/auth.css
├── js/
│   ├── firebase-config.js   ← TUTAJ wstaw swoje klucze Firebase
│   └── auth.js              # Logika logowania i zapisu danych
└── README.md
```

---

## GitHub Pages

Settings → Pages → Source: **main** / **root** → Save  
Adres: `https://daymonqy.github.io/kuznia-ciala/`
