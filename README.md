# Kuźnia Ciała

Aplikacja fitness (SPA) z logowaniem e-mail i danymi przypisanymi do konta użytkownika.

**Strona:** https://daymonqy.github.io/kuznia-ciala/

---

## Funkcje

- Logowanie / rejestracja (Firebase Auth)
- Baza ćwiczeń z filtrem partii i wyszukiwarką
- Plany treningowe (serie, RIR, kolejność ćwiczeń)
- Trening na żywo, historia, regeneracja, postęp
- Dane synchronizowane z Firestore pod UID użytkownika

---

## Konfiguracja Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → projekt
2. Authentication → Email/Password → włącz
3. Firestore → utwórz bazę
4. Wklej config do **`js/firebase-config.js`**

Reguły (przykład):

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

---

## Struktura

```
├── index.html              # Shell SPA
├── css/
│   ├── styles.css          # Style bazowe
│   └── refine.css          # Motyw + UI ćwiczeń
├── data/
│   └── exercises.js        # Baza ćwiczeń + MUSCLE_GROUPS
├── js/
│   ├── firebase-config.js
│   ├── auth-app.js         # Logowanie / rejestracja
│   ├── storage.js          # LocalStorage + sync Firestore
│   ├── utils.js
│   ├── app.js              # Nawigacja SPA
│   └── modules/
│       ├── dashboard.js
│       ├── exercises.js
│       ├── plans.js
│       ├── workout.js
│       ├── history.js
│       ├── recovery.js
│       ├── progress.js
│       ├── calculator.js
│       ├── profile.js
│       └── settings.js
└── README.md
```

---

## GitHub Pages

Settings → Pages → Source: **main** / **root**  
Adres: `https://daymonqy.github.io/kuznia-ciala/`
