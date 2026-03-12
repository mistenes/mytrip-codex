# myTrip

Teljes stackes utazásszervező alkalmazás:

- React 19 + Vite frontend
- Express backend
- Supabase Postgres adatbázis
- Cloudinary alapú branding és képkiválasztás
- szerepkörök: admin, organizer, traveler

## Production felállás

Az app egyetlen Render Web Service-ként fut:

- a frontend buildelés után ugyanebből a Node service-ből kerül kiszolgálásra
- az API a `/api` útvonal alatt érhető el
- a fájlfeltöltések Render diskre mennek
- a tartós adat Supabase Postgresben van
- a logók és háttérképek Cloudinary-n keresztül választhatók

## Lokális futtatás

Előfeltételek:

- Node.js 20+
- elérhető Postgres adatbázis

Lépések:

1. Hozz létre egy `.env` fájlt a `.env.example` alapján
2. Állíts be működő `DATABASE_URL` értéket
3. Telepítsd a csomagokat:

```bash
npm install
```

4. Frontend fejlesztői szerver:

```bash
npm run dev
```

5. Backend külön terminálból:

```bash
npm start
```

Alapértelmezett lokális címek:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## Legacy MySQL import

Egyszeri migrációhoz van külön import parancs MySQL dump -> Supabase Postgres irányra.

Dry-run:

```bash
npm run import:mysql -- --sql /abs/path/to/dump.sql --files-root /abs/path/to/folder-containing-user_files --dry-run
```

Éles import:

```bash
npm run import:mysql -- --sql /abs/path/to/dump.sql --files-root /abs/path/to/folder-containing-user_files --apply
```

Fontos:

- az import alapból dry-run
- `--apply` nélkül nem ír adatbázisba
- az import csak üres cél adatbázisra fut le
- a dokumentumfájlokhoz a `user_files` mappa tényleges tartalma is kell
- az import után a rendszer már kizárólag Supabase Postgrest használ

## Render Blueprint

A repo tartalmaz egy Render Blueprint-kompatibilis `render.yaml` fájlt.

A blueprint jelenleg ezt definiálja:

- 1 db Node alapú Web Service
- Renderen 20.x vagy 22.x LTS Node célverzió
- build közben teljes `npm run check` futtatás
- `/api/health` health check
- Render persistent disk az `uploads` mappának
- secretként kezelt Supabase Postgres, Cloudinary, Brevo és app URL env varok

Szükséges production változók:

- `DATABASE_URL`
- `ADMIN_PASSWORD`

Ajánlott további változók:

- `APP_URL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_REPLY_TO_EMAIL`
- `PROBLEM_REPORT_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Fontos megjegyzések:

- Renderen a fő adatbázis Supabase Postgres legyen
- a service a Render által adott `PORT` értéken indul
- a feltöltött fájlok az `/opt/render/project/src/uploads` útvonalra kerülnek
- ha nincs `APP_URL`, az email linkek a bejövő host alapján épülnek fel
- ha a backend induláskor adatbázis URL hibát ír, akkor nincs beállítva a `DATABASE_URL`
- a blueprint csak a futó alkalmazást deployolja, a legacy MySQL import nem része az automatikus deploynak

Ajánlott deploy folyamat:

1. töltsd fel a projektet egy git repóba
2. hozz létre Renderben egy Blueprint deployt
3. add meg a secret env varokat
4. állíts be működő Supabase Postgres connection stringet a `DATABASE_URL` alatt
5. deploy

## Legacy import Render mellett

A MySQL -> Supabase Postgres import CLI külön marad. Ez tudatos:

- az importnak kell a teljes `user_files` mappa
- a dokumentumok az app `UPLOAD_DIR` útvonalára másolódnak
- ezt nem érdemes automatikus Blueprint build/predeploy lépésként futtatni

Ajánlott sorrend:

1. Blueprint deploy Renderre
2. dry-run az import parancssal olyan környezetből, ahol a dump, a `user_files` és a cél Postgres is elérhető
3. `--apply` csak akkor, ha a riport teljesen tiszta

## Fő funkciók

- bejelentkezés, session visszaállítás, kijelentkezés
- kötelező első jelszócsere az induló adminnál
- jelszó-visszaállítás email tokennel
- meghívásos regisztráció
- utak létrehozása és kezelése
- organizer és traveler hozzárendelés
- utanként konfigurálható személyes adat mezők
- dokumentum- és személyes fájlfeltöltés
- itinerary kezelés
- pénzügyi nyilvántartás
- üzenetküldés olvasási visszajelzéssel
- Cloudinary alapú oldal branding
- hibabejelentés emailen keresztül

## Ellenőrzések

```bash
npm run typecheck
npm test
npm run build
npm run check
```
