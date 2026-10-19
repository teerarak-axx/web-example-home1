import type Database from 'better-sqlite3';
import { hashPassword } from './password';
import { contentDefaults } from './content';
import assets from './brand-assets.json';
export const defaults: Record<string, string> = {
  ...contentDefaults,
  company_name_en: 'BAAN POO GARDEN',
  company_name_th: 'บ้านปูการ์เด้น',
  projects_badge_text: 'บ้านปูการ์เด้น · ออกแบบและติดตั้ง',
  hero_eyebrow: 'GARDEN DESIGN & OUTDOOR LIVING',
  hero_cta_text: 'ชมผลงานของเรา',
  hero_scroll_text: 'ทำความรู้จักบ้านปู',
  welcome_label: 'ยินดีต้อนรับสู่',
  welcome_title: 'BAAN POO GARDEN',
  welcome_subtitle: 'จัดสวน เดคไม้ ระแนง และพื้นที่พักผ่อนรอบบ้าน',
  welcome_body:
    'บ้านปูการ์เด้น รับออกแบบและติดตั้งงานสวนและพื้นที่ภายนอกบ้าน ทั้งพรรณไม้ เดคไม้ WPC ระแนง ศาลา พื้นทางเดิน และระบบสปริงเกอร์\n\nออกแบบให้เข้ากับบ้านและการใช้งานของคุณ พร้อมดูแลรายละเอียดของพื้นที่ตั้งแต่แนวคิดจนถึงงานติดตั้ง\n\nให้บริการในกรุงเทพฯ และปริมณฑล ส่งภาพหน้างานและขนาดพื้นที่มาพูดคุยเพื่อประเมินงานเบื้องต้นได้',
  welcome_image_url: assets.side1.full_url,
  welcome_button_text: 'รู้จักบ้านปูการ์เด้น',
  about_detail:
    'บ้านปูการ์เด้น ออกแบบและติดตั้งงานภายนอกบ้าน โดยเชื่อมพื้นที่สีเขียวกับพื้นที่ใช้งานให้เป็นส่วนเดียวกัน\n\nบริการประกอบด้วยงานจัดสวนและเลือกพรรณไม้ พื้นไม้ WPC ระแนง โครงหลังคา หลังคาไวนิล ชินโคไลท์ ดีไลท์ ศาลา พื้นทางเดิน และระบบสปริงเกอร์\n\nส่งภาพหน้างาน พร้อมขนาดพื้นที่และแนวทางที่ชอบ เพื่อพูดคุยรายละเอียดและประเมินงานเบื้องต้น\n\nติดต่อคุณปู 086-571-0005 · LINE: magathome\nติดต่อคุณโอ 086-329-3277 · LINE: osuksiri\nอีเมล bpgarden1@hotmail.com\nรับงานกรุงเทพฯ และปริมณฑล',
  concept_quote_th: 'ให้สวนเป็นส่วนหนึ่งของบ้าน\nให้พื้นที่รอบบ้าน\nเป็นมุมโปรดในทุกวัน',
  concept_image_url: assets.pavilion1.full_url,
  video_banner_title: 'บ้าน สวน และพื้นที่พักผ่อนที่เชื่อมถึงกัน',
  video_banner_subtitle: 'BAAN POO GARDEN · SELECTED WORKS',
  youtube_url: '',
  video_cover_url: assets.terrace1.full_url,
  mission_label: 'ความตั้งใจของเรา',
  mission_title: 'พื้นที่สวย\nที่ใช้ชีวิตได้จริง',
  mission_body:
    'เรามองสวนและงานภายนอกบ้านเป็นพื้นที่ใช้ชีวิต ไม่ว่าจะเป็นเดคไม้สำหรับนั่งพัก ศาลาในสวน ระแนงบังแดด หรือทางเดินที่เชื่อมแต่ละมุมเข้าด้วยกัน\n\nเลือกพรรณไม้และวัสดุให้สัมพันธ์กับบริบทของบ้าน พร้อมคำนึงถึงความสวยงาม ประโยชน์ใช้สอย และรายละเอียดการติดตั้ง',
  mission_video_url: '',
  mission_cover_url: assets.side3.full_url,
  philosophy_label: 'พื้นที่ที่ออกแบบจากการใช้งาน',
  philosophy_body:
    'แต่ละบ้านมีพื้นที่และความต้องการต่างกัน\n\nเราจึงเริ่มจากการทำความเข้าใจหน้างาน แล้ววางองค์ประกอบของสวน พื้นทางเดิน เดคไม้ และระแนง ให้ตอบโจทย์การใช้งานและเข้ากับบ้านอย่างกลมกลืน',
  philosophy_bw_image_url: assets.garden2.full_url,
  service_label: 'สิ่งที่เราทำ',
  service_title: 'บริการของบ้านปูการ์เด้น',
  service_subtitle: 'ออกแบบและติดตั้งงานสวนและพื้นที่ภายนอกบ้าน',
  gallery_title: 'ผลงานบ้านปูการ์เด้น',
  gallery_eyebrow: 'SELECTED OUTDOOR SPACES',
  gallery_intro: 'ดูแนวทางจัดสวนและตกแต่งพื้นที่รอบบ้าน\nจากผลงานบนเพจบ้านปูการ์เด้น',
  gallery_note: 'ภาพผลงานจากเพจบ้านปูการ์เด้น',
  team_label: 'ทีมงานของเรา',
  team_title: 'ทีมบ้านปูการ์เด้น',
  team_intro: 'เพิ่มข้อมูลและภาพทีมงานจริงจาก Admin',
  team_detail: '',
  team_note: '',
  contact_label: 'เริ่มต้นจากการพูดคุย',
  contact_title: 'ติดต่อบ้านปูการ์เด้น',
  contact_intro: 'ส่งรูปหน้างานและขนาดพื้นที่ เพื่อประเมินเบื้องต้น',
  contact_photo_title: 'มุมใหม่ของบ้าน\nเริ่มได้จากวันนี้',
  contact_photo_subtitle: 'จัดสวน · เดคไม้ · ระแนง · ศาลา · โครงหลังคา',
  phone_primary: '086-571-0005',
  phone_secondary: '086-329-3277',
  address_th: 'รับงานกรุงเทพฯ และปริมณฑล',
  email: 'bpgarden1@hotmail.com',
  google_maps_url: '',
  line_id: 'magathome',
  line_url: 'https://line.me/ti/p/~magathome',
  facebook_url: 'https://www.facebook.com/baanpoogarden/',
  instagram_url: '',
  tiktok_url: '',
  contact_image_url: assets.pavilion1.full_url,
  meta_title: 'บ้านปูการ์เด้น | จัดสวน เดคไม้ ระแนง และโครงหลังคา',
  meta_description:
    'บ้านปูการ์เด้น รับออกแบบและติดตั้งงานจัดสวน เดคไม้ WPC ระแนง ศาลา โครงหลังคา พื้นทางเดินและระบบสปริงเกอร์ ในกรุงเทพฯ และปริมณฑล ติดต่อ 086-571-0005 หรือ 086-329-3277',
  meta_keywords: 'บ้านปูการ์เด้น,จัดสวน,เดคไม้,WPC,ไม้ระแนง,ศาลา,โครงหลังคา,ระบบสปริงเกอร์',
  og_image_url: assets.cover.full_url,
  canonical_url: '',
  privacy_body:
    'เว็บไซต์ใช้คุกกี้ที่จำเป็นสำหรับระบบผู้ดูแล และเก็บตัวเลือกคุกกี้บนอุปกรณ์ของคุณ ไม่มีการโหลดเครื่องมือวิเคราะห์หรือโฆษณาโดยอัตโนมัติ วิดีโอ YouTube จะโหลดเมื่อกดเล่นเท่านั้น หากติดต่อผ่าน LINE หรือ Facebook ข้อมูลจะอยู่ภายใต้นโยบายของแพลตฟอร์มนั้น สอบถามเรื่องข้อมูลส่วนบุคคลได้ที่ bpgarden1@hotmail.com',
  copyright_text: 'BAAN POO GARDEN. ALL RIGHTS RESERVED.',
};
// Keep newlines in editorial copy as actual paragraph breaks.
for (const key of Object.keys(defaults)) defaults[key] = defaults[key].replace(/\\n/g, '\n');
export function seedBusinessContent(db: Database.Database) {
  if (!db.prepare('SELECT id FROM hero_slides LIMIT 1').get()) {
    const add = db.prepare(
      'INSERT INTO hero_slides(image_url,title,subtitle,alt_text,sort_order,is_active) VALUES(?,?,?,?,?,1)',
    );
    [
      [
        assets.garden2,
        'ให้พื้นที่รอบบ้าน\nเป็นมุมโปรดของคุณ',
        'จัดสวนและพื้นที่พักผ่อน โดยบ้านปูการ์เด้น',
      ],
      [assets.terrace1, 'เดคไม้ ระแนง\nและช่วงเวลาดี ๆ', 'งานภายนอกบ้านที่สวยและใช้ชีวิตได้จริง'],
      [
        assets.pavilion1,
        'เชื่อมบ้านกับสวน\nอย่างลงตัว',
        'ศาลาและมุมพักผ่อนที่เข้ากับพื้นที่ของคุณ',
      ],
    ].forEach(([image, title, subtitle], i) =>
      add.run(
        (image as typeof assets.garden1).full_url,
        String(title).replace(/\\n/g, '\n'),
        subtitle,
        'ผลงานบ้านปูการ์เด้น',
        i,
      ),
    );
  }
  if (!db.prepare('SELECT id FROM services LIMIT 1').get()) {
    const services = [
      [
        'จัดสวนและพรรณไม้',
        'LANDSCAPE & PLANTING',
        'ออกแบบสวนและเลือกพรรณไม้ให้เหมาะกับพื้นที่รอบบ้าน',
        'รับออกแบบและจัดสวน ปรับพื้นที่ และจัดวางพรรณไม้ให้เข้ากับสไตล์บ้านและการใช้งาน ส่งภาพหน้างานและขนาดพื้นที่มาพูดคุยเบื้องต้นได้',
        assets.garden2,
      ],
      [
        'เดคไม้ WPC และงานระแนง',
        'DECK & PERGOLA',
        'เพิ่มพื้นที่ใช้งานด้วยเดคไม้ WPC และงานระแนง',
        'ออกแบบและติดตั้งเดคไม้ WPC ระแนงพื้นไม้ และระแนงตกแต่ง เพื่อเชื่อมพื้นที่ภายในบ้านกับสวนและมุมพักผ่อน',
        assets.side3,
      ],
      [
        'โครงหลังคาและศาลา',
        'ROOF & PAVILION',
        'สร้างมุมพักผ่อนด้วยศาลาและโครงหลังคาที่เข้ากับบ้าน',
        'รับงานโครงหลังคา หลังคาไวนิล ชินโคไลท์ ดีไลท์ และศาลา พูดคุยแนวทางวัสดุและรูปแบบให้เหมาะกับหน้างานก่อนติดตั้ง',
        assets.pavilion1,
      ],
      [
        'พื้นทางเดินและงานระบบ',
        'PATHWAY & SPRINKLER',
        'เชื่อมทุกมุมของสวนด้วยทางเดินและระบบสปริงเกอร์',
        'ปรับปรุงพื้นที่ใช้งานภายนอกบ้าน พื้นทางเดิน และระบบสปริงเกอร์ วางองค์ประกอบให้ใช้งานได้สะดวกและดูเป็นส่วนเดียวกับสวน',
        assets.path4,
      ],
    ] as const;
    services.forEach((s, i) =>
      db
        .prepare(
          'INSERT INTO services(title_th,title_en,description_th,full_content_th,image_url,alt_text,sort_order) VALUES(?,?,?,?,?,?,?)',
        )
        .run(s[0], s[1], s[2], s[3], s[4].full_url, s[0] + ' บ้านปูการ์เด้น', i),
    );
  }
  if (!db.prepare('SELECT id FROM projects LIMIT 1').get()) {
    const albums = [
      {
        title: 'สวนและมุมพักผ่อนรอบบ้าน',
        category: 'landscape-construction',
        description:
          'ภาพคัดเลือกจากโพสต์รวมผลงานของบ้านปูการ์เด้น แสดงแนวทางจัดสวน เดคไม้ ระแนง และมุมพักผ่อนภายนอกบ้าน',
        photos: [assets.garden1, assets.garden2, assets.garden3, assets.terrace1, assets.pavilion1],
      },
      {
        title: 'สวนข้างบ้านและเดคไม้',
        category: 'home-extension',
        description:
          'งานออกแบบพื้นที่ข้างบ้าน เชื่อมสวน ทางเดิน เดคไม้ และระแนงเข้าด้วยกัน ภาพจากโพสต์ผลงานของบ้านปูการ์เด้น',
        photos: [assets.side1, assets.side2, assets.side3, assets.side4],
      },
      {
        title: 'พื้นทางเดินรอบบ้านสไตล์โมเดิร์น',
        category: '3d-design',
        description:
          'แนวทางปรับพื้นที่ใช้งานภายนอกบ้านและพื้นทางเดิน ภาพจากโพสต์ผลงานของบ้านปูการ์เด้น',
        photos: [assets.path1, assets.path2, assets.path3, assets.path4],
      },
    ];
    for (const [index, album] of albums.entries()) {
      const cover = album.photos[0];
      const id = Number(
        db
          .prepare(
            'INSERT INTO projects(title,category,description,location,cover_thumb_url,cover_full_url,is_featured_on_home,sort_order) VALUES(?,?,?,?,?,?,1,?)',
          )
          .run(
            album.title,
            album.category,
            album.description,
            '',
            cover.thumb_url,
            cover.full_url,
            index,
          ).lastInsertRowid,
      );
      album.photos.forEach((image, i) =>
        db
          .prepare(
            'INSERT INTO project_images(project_id,thumb_url,full_url,alt_text,caption,width,height,sort_order) VALUES(?,?,?,?,?,?,?,?)',
          )
          .run(
            id,
            image.thumb_url,
            image.full_url,
            album.title + ' บ้านปูการ์เด้น — รูปที่ ' + (i + 1),
            'ผลงานจากเพจบ้านปูการ์เด้น',
            image.width,
            image.height,
            i,
          ),
      );
    }
  }
}
export function seed(db: Database.Database) {
  if (db.prepare('SELECT id FROM site_settings LIMIT 1').get()) return;
  const password = process.env.ADMIN_INITIAL_PASSWORD || 'admin1234';
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.ADMIN_INITIAL_PASSWORD || password.length < 12 || password === 'admin1234')
  )
    throw new Error('Set ADMIN_INITIAL_PASSWORD (12+ characters) before first production startup');
  db.transaction(() => {
    if (db.prepare('SELECT id FROM site_settings LIMIT 1').get()) return;
    const data = { ...defaults, admin_password_hash: hashPassword(password) };
    db.prepare(
      `INSERT INTO site_settings(id,${Object.keys(data).join(',')}) VALUES(1,${Object.keys(data)
        .map(() => '?')
        .join(',')})`,
    ).run(...Object.values(data));
    seedBusinessContent(db);
  }).immediate();
}
