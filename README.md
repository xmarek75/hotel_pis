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

```bash
cd hotel-backend
mvn liberty:dev
```

Backend poběží na:
- `http://localhost:9080/hotel`

API (příklad):
- `http://localhost:9080/hotel/api/rooms`

### 4. Swagger UI (OpenAPI)
Dokumentace API a interaktivní testování:
- URL: `http://localhost:9080/openapi/ui/`

#### Jak testovat v Swaggeru (Autorizace):
1. Najdi endpoint `POST /auth/login`.
2. Klikni na **Try it out** a zadej přihlašovací údaje (admin/admin123).
3. Po spuštění (Execute) si zkopíruj `token` z JSON odpovědi.
4. Klikni na zelené tlačítko **Authorize** nahoře na stránce.
5. Vlož zkopírovaný token a potvrď.
6. Nyní můžeš volat ostatní endpointy přímo z prohlížeče.

### 5. Autentizace a role
Aplikace používá **JWT Bearer** tokeny pro veškerou komunikaci kromě login endpointu.

**Uživatelé v systému:**
- **admin**: `admin` / `admin123` (role: `administrator`)
- **recepce**: `reception` / `reception123` (role: `RECEPTIONIST`)

## 7. Spuštění frontendu

V novém terminálu:

```bash
cd hotel-frontend
npm install
npm run dev
```

Frontend běží typicky na:
- `http://localhost:5173`

Vite proxy přeposílá `/api/*` na backend `http://localhost:9080/hotel/api/*`.

## 8. Seed demo dat

Backend při startu vkládá demo data (pokoje, zákazníky, rezervace), pokud chybí.

Poznámka:
- V `persistence.xml` je `drop-and-create`, takže při novém startu backendu se schéma resetuje.

## 9. Zastavení

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

## 10. Nejčastější problémy

### Chyba připojení k DB / authentication failed
- ověř, že běží Docker kontejnery: `docker compose ps`
- ověř, že backend používá port `5433` (`hotel-backend/src/main/liberty/config/server.xml`)

### Frontend build hlásí Node verzi
- použij Node.js `20.19+` (nebo `22.12+`)

---

Rychlý start (3 terminály):
1. `docker compose up -d`
2. `cd hotel-backend && mvn liberty:dev`
3. `cd hotel-frontend && npm install && npm run dev`
