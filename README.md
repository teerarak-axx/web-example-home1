# บ้านปูการ์เด้น — Website + Admin CMS

เว็บไซต์หน้าเดียวสำหรับสตูดิโอจัดสวนและต่อเติมบ้าน พร้อม CMS ภาษาไทย บน Next.js App Router, TypeScript, Tailwind CSS, SQLite (`better-sqlite3`), `sharp` และ `lucide-react`

## เริ่มใช้งานในเครื่อง

ต้องมี Node.js 24 LTS และ npm (รองรับ Linux VPS ที่มีดิสก์ถาวร) แนะนำ RAM 2–4 GB สำหรับประมวลผลรูปหลายไฟล์และพื้นที่ดิสก์ตามจำนวนอัลบั้ม

```bash
npm ci
cp .env.example .env.local
npm run dev
```

เปิด http://localhost:3000 และ http://localhost:3000/admin รหัสผ่านเริ่มต้นสำหรับ development คือ `admin1234` เท่านั้น ฐานข้อมูลและข้อมูลตัวอย่างจะสร้างอัตโนมัติเมื่อมีคำขอครั้งแรก แก้พอร์ตได้ด้วย `npm run dev -- --port 3001` และแก้ SITE_URL ให้ตรงกัน

```bash
npm run typecheck
npm run build
npm test
```

## โครงสร้างและฟังก์ชัน

- `app/page.tsx` — SSR หน้าเว็บและ `generateMetadata`; อ่าน SQLite ใหม่ทุก request
- `components/site.tsx` — slider, category filter, load more, album lightbox, keyboard/swipe, video modal, cookie notice, CTA
- `components/admin.tsx` — dashboard, content/contact editor, CRUD บริการ/สไลด์/ทีม/อัลบั้ม, รูปหลายรูป, alt/caption, เลื่อนลำดับ, ภาพปก, SEO, password, backup
- `lib/db.ts` — schema และ seed; เปิด WAL, synchronous NORMAL, foreign keys และ busy timeout 5000
- `lib/media.ts` — แปลงเป็น WebP 640px quality78 + 1920px quality85, auto-rotate, จำกัดจำนวนพิกเซล, ลบไฟล์เป็นคู่และเคารพภาพที่ใช้งานร่วมกัน
- `app/api/media/[...path]` — stream จาก storage พร้อม immutable cache และตรวจชื่อไฟล์/หมวดหมู่ ป้องกัน traversal
- `app/api/admin/[entity]` — authenticated CRUD, dashboard, password และ online SQLite backup
- `app/api/upload` — สูงสุด 3 รูป/คำขอ, 10MB/รูป, จำกัด body จริงที่ 31MB, ประมวลผลพร้อมกันไม่เกิน 3 รูป
- `tests/` — integration ทดสอบ production server จริงด้วย storage ชั่วคราว

### ข้อมูลบ้านปูการ์เด้นและการแก้ไขใน Admin

ปรับข้อมูลจากเพจสาธารณะ [บ้านปูการ์เด้น](https://www.facebook.com/baanpoogarden/) ตามคำขอของผู้ใช้ ตรวจเมื่อ 19 ตุลาคม 2026: บริการจัดสวน เดคไม้ WPC ระแนง โครงหลังคา ศาลา ทางเดิน และสปริงเกอร์ รับงานกรุงเทพฯ/ปริมณฑล ติดต่อคุณปู 086-571-0005 LINE magathome, คุณโอ 086-329-3277 LINE osuksiri และ bpgarden1@hotmail.com ข้อความแนะนำบริษัทเขียนใหม่จากขอบเขตบริการ ไม่ใส่ชื่อลูกค้า สถานที่ หรือประวัติทีมงานที่ยืนยันไม่ได้

ภาพโลโก้ แบนเนอร์ และภาพผลงานจริง 15 ภาพเก็บเป็น WebP ใน `public/brand/baanpoo` พร้อมแหล่งที่มาใน SOURCE.md แบ่งผลงานเป็น 3 อัลบั้ม รวม 13 รูป ไม่มีภาพ Unsplash หรือทีมงานสมมติในชุดเริ่มต้น ภาพจากเพจมีขนาดต้นฉบับจำกัด เปลี่ยนเป็นไฟล์ต้นฉบับความละเอียดสูงผ่าน Admin ได้

- **รูปภาพทั้งหมด:** โลโก้, favicon, ภาพแนะนำบริษัท, แนวคิด, ปกวิดีโอ, Mission, ปรัชญา, ติดต่อ และ Open Graph รวม 9 ตำแหน่ง พร้อมทางลัดไปภาพสไลด์/บริการ/ทีม/อัลบั้ม
- **เนื้อหาเว็บไซต์:** ข้อความแต่ละส่วน ชื่อเมนู ปุ่ม ชื่อหมวดหมู่ ข้อมูลติดต่อ LINE สองบัญชี นโยบายความเป็นส่วนตัว คำอธิบายรูป และการแสดง/ซ่อน section
- **บริการ / สไลด์ / ทีมงาน / อัลบั้ม:** เพิ่ม แก้ไข ลบ เรียงลำดับ เปลี่ยนรูปและข้อความได้ พร้อม caption/alt และภาพปกอัลบั้ม
- **SEO และความปลอดภัย:** title, description, canonical, social preview, เปลี่ยนรหัสผ่าน และดาวน์โหลดฐานข้อมูลสำรอง

Admin เน้นพื้นสีขาว ใช้การ์ด/ปุ่มที่มีมิติ และเงาแบบเรียบสะอาด ตัวอักษรและปุ่มขยายให้อ่านและกดง่าย ภาพอยู่ในกรอบแยกจากปุ่ม หน้า User มีเอฟเฟกต์ภาพซูมเบา ๆ เมื่อชี้เมาส์ หน้าเว็บและ Admin รองรับโทรศัพท์ แท็บเล็ต และคอมพิวเตอร์ เมื่อจอแคบเมนู Admin เลื่อนแนวนอนได้ เมนูเว็บไซต์ยุบเป็นปุ่มเปิด/ปิด

ยังไม่พบที่อยู่หรือแผนที่ที่ยืนยันได้ และไม่พบลิงก์ YouTube/Instagram/TikTok หรือรายชื่อทีมงาน จึงซ่อนข้อมูลเหล่านี้ ผู้ดูแลเพิ่มและเปิดแสดงภายหลังได้ วิดีโอรองรับ URL YouTube ผ่าน youtube-nocookie เมื่อกดเล่น ไม่รองรับอัปโหลด MP4 โดยตรง เมื่อไม่มีวิดีโอ ปุ่มผลงานลิงก์ไป Facebook จริง

ฟอนต์ Montserrat/Prompt อยู่ใน `public/fonts` พร้อม SIL OFL ไม่เรียก Google Fonts จากเครื่องผู้เข้าชม หน้าเว็บไม่มี analytics/โฆษณาที่โหลดอัตโนมัติ ปรับนโยบายความเป็นส่วนตัวตามการใช้งานจริง

### ย้ายจากข้อมูลเดิม

เมื่อเปิดฐานข้อมูลเดิมที่มีแบรนด์ NAYTURE PRIME DESIGN ระบบจะสำรองฐานข้อมูลก่อนเปลี่ยนเป็นบ้านปูการ์เด้นไว้ใน `storage/backups/before-baanpoo-*.sqlite` แล้วเพิ่ม field ใหม่ เก็บรหัสผ่านและ session เดิมไว้ ลบเฉพาะข้อมูลตัวอย่างที่ระบุได้ และไม่เขียนทับการแก้ไข Admin หลัง migration สำเร็จ หากฐานข้อมูลมีแบรนด์ที่ปรับแต่งเองอยู่แล้ว ระบบจะเพิ่มเฉพาะ field ที่ขาดและเก็บข้อมูลเดิม ควรสำรอง storage ทั้งชุดก่อนอัปเดต production

### ที่เก็บถาวร

```text
storage/
  db/site.sqlite           # รวมไฟล์ -wal และ -shm ระหว่างเปิดระบบ
  uploads/
    hero/
    sections/
    services/
    projects/
    team/
```

ตั้ง `STORAGE_DIR` เป็น absolute path เพื่อย้ายไปโฟลเดอร์ถาวรนอก release ได้ ห้ามใช้ `public` เก็บรูปอัปโหลด และห้าม commit storage/.env ลง Git ภาพอัปโหลดใช้ UUID URL ใหม่จึงไม่ต้อง restart และ cache แบบ immutable ได้ ไม่มี BLOB/Base64 ใน SQLite ขนาดไฟล์ขึ้นกับรายละเอียดภาพ ไม่สามารถรับประกัน KB คงที่ได้

ตัวอัปโหลดเลือกได้ 1–50 รูป ส่งชุดละ 3 รูป มีความคืบหน้า หากเครือข่ายผิดพลาดจะคงรูปที่ยังไม่สำเร็จในคิวให้กดส่งต่อ คิวอยู่ในหน่วยความจำของแท็บ ต้องอยู่ในหน้าอัลบั้มจนจบ อย่า reload/สลับอัลบั้มระหว่างอัปโหลด รูป section ที่อัปโหลดแล้วต้องกดบันทึก หากยกเลิกแบบฟอร์ม ใช้ปุ่มล้างไฟล์ที่ไม่ได้ใช้งานใน SEO/ความปลอดภัยเพื่อลบไฟล์ที่ไม่มี reference และเก่ากว่า 24 ชั่วโมง ระบบตรวจการใช้งานร่วมกันก่อนลบทั้งสองขนาด

## ตั้งค่า production

ใช้เซิร์ฟเวอร์ Node.js ที่มี persistent disk เช่น VPS/Docker หลีกเลี่ยง serverless/edge หรือ network filesystem สำหรับ SQLite/sharp ใช้ instance เดียวเป็นค่าเริ่มต้น

สร้าง `.env` (Docker Compose) หรือ `.env.local` (PM2) จาก `.env.example`:

```dotenv
SITE_URL=https://example.com
STORAGE_DIR=/absolute/path/to/persistent/storage
ADMIN_INITIAL_PASSWORD=replace-with-a-long-random-password
COOKIE_SECURE=true
TRUST_PROXY=true
```

ครั้งแรกบน production ต้องกำหนด ADMIN_INITIAL_PASSWORD อย่างน้อย 12 ตัวอักษร หากมีฐานข้อมูลอยู่แล้วจะไม่เขียนทับรหัสผ่าน ให้เปลี่ยนใน CMS ก่อนนำฐาน development ไปใช้จริง COOKIE_SECURE ต้องเป็น true เมื่อใช้งาน HTTPS; false ใช้เฉพาะ local HTTP SITE_URL ต้องตรง origin ที่ผู้ดูแลเปิดใช้งาน มิฉะนั้น API จะปฏิเสธการแก้ไขเพื่อป้องกัน CSRF

TRUST_PROXY=true ใช้เมื่อ Nginx เขียนทับ X-Forwarded-For และแอปเข้าถึงได้ผ่าน proxy เท่านั้น เมื่อ false จะจำกัด login ร่วมกันทั้งระบบ 10 ครั้งผิด/15 นาที รหัสผ่านเก็บด้วย scrypt + salt, session token สุ่มเก็บ hash ใน SQLite, cookie HttpOnly/SameSite Strict, session 8 ชั่วโมง และยกเลิกทุก session เมื่อเปลี่ยนรหัสผ่าน

### ทางเลือก A: Docker Compose

```bash
cp .env.example .env
# แก้ SITE_URL, ADMIN_INITIAL_PASSWORD และ COOKIE_SECURE ก่อนเริ่ม
mkdir -p storage
sudo chown -R 1000:1000 storage
chmod 700 storage
docker compose up -d --build
docker compose logs -f web
```

Docker ใช้ non-root user node (UID/GID1000) ตรวจ owner ให้ตรงบน host เฉพาะ `storage` เท่านั้น Compose ตั้ง STORAGE_DIR=/app/storage และ mount ./storage คงข้อมูลข้ามการอัปเดต พอร์ต bind เฉพาะ 127.0.0.1:3000 ต้องใช้ Nginx + HTTPS ด้านหน้า อย่าเปิดพอร์ต Node สู่สาธารณะเมื่อใช้ TRUST_PROXY

อัปเดต: สำรองข้อมูล → อัปเดต source → `docker compose up -d --build` ระบบจะใช้ storage เดิม ห้ามลบ storage และอย่านำไฟล์ DB จาก image มาเขียนทับ ใช้ `docker compose ps` ตรวจ healthcheck

### ทางเลือก B: VPS + PM2

```bash
npm ci
npm run build
# ตั้งค่า .env.local ให้ครบก่อน start
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

ติดตั้ง PM2 จาก npm บนเซิร์ฟเวอร์ก่อน Next.js จะอ่าน `.env.local` จาก working directory ให้วาง STORAGE_DIR นอกโฟลเดอร์ release และใช้ service user ที่มีสิทธิ์เขียน ต้อง deploy node_modules สำหรับ OS/CPU ของเซิร์ฟเวอร์เพราะ better-sqlite3/sharp มี native binaries หากไม่มี prebuilt ให้ติดตั้ง python3/make/g++ ตามระบบ

อัปเดต: backup → `npm ci` → `npm run build` → `pm2 restart baanpoo-studio` เมื่อต้องการลด downtime ให้ build ใน release directory ใหม่แล้วสลับ release โดยใช้ STORAGE_DIR เดิม

### Nginx และ HTTPS

ดู `deploy/nginx.conf` แก้โดเมนและ certificate path ให้ตรงกับเซิร์ฟเวอร์ ใช้ client_max_body_size 32m และ proxy_read_timeout 120s ตัวแอปจำกัด body 31MB และไฟล์ละ10MBอยู่แล้ว กรณีผ่าน Cloudflare ให้ตรวจ upload/time limits ของแพ็กเกจที่ใช้งานจริง หาก Nginx อยู่หลัง Cloudflare ให้ตั้ง real_ip เฉพาะช่วง IP ที่เชื่อถือได้ก่อนส่ง remote_addr

เพิ่มโดเมนจริงใน CMS → SEO → Canonical URL และทดสอบ /sitemap.xml /robots.txt /api/health รวมถึงภาพ Open Graph

## สำรองและกู้คืน

ปุ่ม CMS ดาวน์โหลด `/api/admin/backup` ใช้ SQLite online backup จึงไม่ใช่การ copy DB ที่อาจมีข้อมูลใน WAL แต่ไฟล์นี้ **ไม่รวมรูปภาพ** และมีข้อมูลติดต่อ/รหัสผ่านที่เข้ารหัสไว้ ต้องเก็บอย่างเป็นส่วนตัว

สำหรับทั้งระบบ ให้หยุดการแก้ไขใน CMS ชั่วคราวระหว่าง backup แล้วรัน:

```bash
node --env-file=.env.local scripts/backup.mjs /absolute/private-backup-directory
```

ได้ `site-*.sqlite` และ `uploads-*.tar.gz` สำหรับ Docker ให้ backup DB ผ่าน CMS และสำรอง host `./storage/uploads` ในช่วงเดียวกัน หรือหยุด container แล้วเก็บทั้ง storage (รวม WAL/SHM) ไปด้วย ห้าม copy เฉพาะ site.sqlite ขณะระบบเขียนอยู่

กู้คืน: หยุดแอป → สำรอง storage ปัจจุบันอีกชุด → ใช้ DB backup แทน storage/db/site.sqlite → นำ uploads archive กลับไป storage/uploads → ลบไฟล์ -wal/-shm เก่าหลังหยุดแอปแล้ว → ตรวจ owner → start แอป → ทดสอบภาพและการเข้าสู่ระบบ

## ขอบเขตการส่งมอบ

ซอร์สและไฟล์ deploy พร้อมสำหรับนำไปตั้งค่าบนเซิร์ฟเวอร์ ยังไม่ได้เผยแพร่โดเมนจริงหรือทดสอบบนเซิร์ฟเวอร์ลูกค้า ไม่มีระบบรับชำระเงิน/อีเมลฟอร์มตามขอบเขต brief ควรตรวจข้อมูลติดต่อและทดสอบ restore บน staging ก่อนเปิดใช้งานลูกค้า


## ผลตรวจและการทดสอบ Docker

ดู `VALIDATION.md` สำหรับผลตรวจของชุดส่งมอบ ทดสอบคอนเทนเนอร์ซ้ำได้ด้วย `docker build -t nayture-web:local .` แล้ว `node tests/docker-smoke.mjs` (ต้องมี Docker daemon) สคริปต์ใช้ container และ storage ชั่วคราวของตัวเอง
