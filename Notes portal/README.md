# Notes Portal (Local)

## Quick setup
1. Put `hero.png` into `img/hero.png`.
2. Open project root in VS Code.
3. Install Live Server extension and run `index.html` with Live Server.
4. In Firebase: enable Firestore & Authentication (Email/Password).
5. Create admin user (Authentication -> Add user). Note UID and update `js/firebase.js` if different.
6. Firestore rules (example):
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /syllabus/{document=**} { allow read: if true; allow write: if request.auth != null && request.auth.uid == "I22KZwN7rBVh49Ct0Ysru3NJsJf1"; }
       match /{collection}/{docId}/items/{itemId} { allow read: if true; allow write: if request.auth != null && request.auth.uid == "I22KZwN7rBVh49Ct0Ysru3NJsJf1"; }
     }
   }
