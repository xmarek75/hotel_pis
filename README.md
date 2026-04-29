# Hotel IS - spuštění projektu

Tento projekt je rozdělený na:
- `hotel-backend` (Java + Open Liberty)
- `hotel-frontend` (React + Vite)
- PostgreSQL + pgAdmin přes Docker Compose

## 1. Požadavky

Nainstalované nástroje:
- Docker + Docker Compose
- Java 17
- Maven 3.9+
- Node.js 20.19+ (doporučeno kvůli Vite)

## 2. Spuštění databáze (Docker)

V rootu projektu:

```bash
docker compose up -d
```

Kontrola běžících kontejnerů:

```bash
docker compose ps
```

### DB parametry
- Host: `localhost`
- Port: `5433`
- Database: `hotel`
- User: `hotel`
- Password: `hotel`

### pgAdmin
- URL: `http://localhost:5050`
- Email: `xmarek75@vutbr.cz`
- Heslo: `admin`

## 3. Spuštění backendu

### Varianta A: backend v Dockeru

V rootu projektu:

```bash
docker compose up -d --build backend
```

Backend poběží na:
- `http://localhost:9080/hotel`

API (příklad):
- `http://localhost:9080/hotel/api/rooms`

Tato varianta je doporučená, pokud `mvn liberty:dev` zlobí při instalaci Liberty features.

### Varianta B: backend lokálně přes Maven

```bash
cd hotel-backend
mvn liberty:dev
```

Backend poběží na:
- `http://localhost:9080/hotel`

API (příklad):
- `http://localhost:9080/hotel/api/rooms`

### Přihlášení do API (Basic Auth)
- admin: `admin` / `admin123`
- recepce: `reception` / `reception123`

## 4. Spuštění frontendu

V novém terminálu:

```bash
cd hotel-frontend
npm install
npm run dev
```

Frontend běží typicky na:
- `http://localhost:5173`

Vite proxy přeposílá `/api/*` na backend `http://localhost:9080/hotel/api/*`.

## 5. Seed demo dat

Backend při startu vkládá demo data (pokoje, zákazníky, rezervace), pokud chybí.

Poznámka:
- V `persistence.xml` je `drop-and-create`, takže při novém startu backendu se schéma resetuje.

## 6. Zastavení

Zastavení backendu:
- v terminálu s `mvn liberty:dev` stiskni `q` nebo `Ctrl+C`

Zastavení DB kontejnerů:

```bash
docker compose down
```

Smazání DB volume (čistý start databáze):

```bash
docker compose down -v
```

## 7. Nejčastější problémy

### Chyba připojení k DB / authentication failed
- ověř, že běží Docker kontejnery: `docker compose ps`
- ověř, že backend používá port `5433` (`hotel-backend/src/main/liberty/config/server.xml`)

### Frontend build hlásí Node verzi
- použij Node.js `20.19+` (nebo `22.12+`)

---

Rychlý start:
1. `docker compose up -d --build backend`
2. `cd hotel-frontend && npm install && npm run dev`
