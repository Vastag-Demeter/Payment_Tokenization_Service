# Payment Tokenization Service (Fizetési Tokenizáló Szolgáltatás)

## NE HASZNÁLD ÉLES KÖRNYEZETBEN! (Development / Tesztelés)

**Figyelmeztetés:** Ez a szolgáltatás kizárólag egyéni tanulási és fejlesztési célokat szolgál. **Titkosítási és biztonsági szempontból NEM alkalmas éles (production) környezetben való használatra, és nem felel meg a PCI-DSS előírásoknak.**

---

## Szolgáltatás Szerepe

A projekt egy Node.js (Express) alapú API, amelynek fő feladata az érzékeny fizetési adatok (kártyaszám, CVV) bevitele, titkosítása és egyedi **token** formájában történő tárolása. Ezzel elkerülhető a valódi kártyaadatok tárolásával járó biztonsági kockázat.

- **Technológia:** Node.js, Express, Prisma, PostgreSQL.
- **Architektúra:** Két konténeres (API és DB) felépítés a Docker Compose segítségével.

---

## Indítási Útmutató (Docker Compose)

### Előfeltételek

1.  Docker és Docker Compose telepítve.
2.  Egy `.env` fájl létrehozva a projekt gyökérkönyvtárában a szükséges titkosítási és adatbázis beállításokkal.

### A Projekt Indítása

A szolgáltatás indítása a legfrissebb image-et használja, beállítja a belső Docker hálózatot, elindítja a PostgreSQL adatbázist, majd megvárja, és elindítja az API-t.

```bash
sudo docker-compose up --build -d
```
