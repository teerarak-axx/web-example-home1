'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowUpRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Phone,
  Play,
  Instagram,
  MapPin,
  Image as ImageIcon,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { categoryLabels, type SiteData, type Project, type ProjectImage } from '@/lib/types';
import { LineIcon, FacebookIcon, BrandMark } from './icons';
import { Modal } from './modal';
function Picture({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  ) : (
    <div className={'image-placeholder ' + className}>
      <ImageIcon size={32} />
      <span>เพิ่มรูปภาพใน Admin</span>
    </div>
  );
}
export function videoEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(
        u.hostname,
      )
    )
      id = u.searchParams.get('v') || u.pathname.split('/').pop() || '';
    return /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
      : null;
  } catch {
    return null;
  }
}
function TextLink({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  return href ? (
    <a className="text-link" href={href}>
      {children}
      <ArrowUpRight size={20} />
    </a>
  ) : (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={20} />
    </button>
  );
}
export default function Site({ data }: { data: SiteData }) {
  const { settings: s, hero_slides: slides, services, projects, team_members: team } = data;
  const [slide, setSlide] = useState(0),
    [paused, setPaused] = useState(false),
    [interacting, setInteracting] = useState(false),
    [menu, setMenu] = useState(false),
    [filter, setFilter] = useState('all'),
    [expanded, setExpanded] = useState(false),
    [teamPage, setTeamPage] = useState(0),
    [cookie, setCookie] = useState(false);
  const [article, setArticle] = useState<{ title: string; body: string; image?: string } | null>(
      null,
    ),
    [video, setVideo] = useState<string | null>(null),
    [album, setAlbum] = useState<Project | null>(null),
    [images, setImages] = useState<ProjectImage[]>([]),
    [index, setIndex] = useState(0),
    [albumError, setAlbumError] = useState(''),
    [loading, setLoading] = useState(false);
  const slideNow = slides[slide % Math.max(1, slides.length)];
  useEffect(() => {
    if (
      paused ||
      interacting ||
      slides.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = setInterval(() => setSlide((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [slides.length, paused, interacting]);
  useEffect(() => {
    try {
      setCookie(!localStorage.getItem('nayture-cookie-choice'));
    } catch {
      setCookie(true);
    }
  }, []);
  const chooseCookie = (choice: string) => {
    try {
      localStorage.setItem('nayture-cookie-choice', choice);
    } catch {}
    setCookie(false);
  };
  useEffect(() => {
    if (!album) return;
    const controller = new AbortController();
    setImages([]);
    setIndex(0);
    setLoading(true);
    setAlbumError('');
    fetch('/api/projects/' + album.id, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error('โหลดอัลบั้มไม่สำเร็จ');
        return r.json();
      })
      .then((d) => setImages(d.images))
      .catch((e) => {
        if (e.name !== 'AbortError') setAlbumError('โหลดอัลบั้มไม่สำเร็จ กรุณาลองใหม่');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [album]);
  const move = useCallback(
    (direction: number) =>
      setIndex((i) => (images.length ? (i + direction + images.length) % images.length : 0)),
    [images.length],
  );
  useEffect(() => {
    if (!album) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        move(1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [album, move]);
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => setImageState('loading'), [album, index]);
  const touch = useRef(0);
  const visibleProjects = projects.filter((p) => filter === 'all' || p.category === filter);
  const initial =
    filter === 'all'
      ? visibleProjects.filter((p) => p.is_featured_on_home).slice(0, 8)
      : visibleProjects.slice(0, 8);
  const shown = expanded ? visibleProjects : initial;
  const selectCategory = (key: string) => {
    setFilter(key);
    setExpanded(false);
    setMenu(false);
  };
  const about = () =>
    setArticle({ title: s.welcome_title, body: s.about_detail, image: s.welcome_image_url });
  const categories = categoryLabels(s);
  const contactUrl = s.line_url || s.facebook_url;
  const teamNow = team[teamPage % Math.max(1, team.length)];
  return (
    <div className="public-site">
      <a className="skip-link" href="#about">
        ข้ามไปยังเนื้อหา
      </a>
      <header className="site-header">
        <a href="#home" className="brand" aria-label={s.company_name_en + ' หน้าหลัก'}>
          <BrandMark src={s.logo_image_url} alt={s.logo_alt_text || s.company_name_th} />
          <span className="brand-word">
            {s.company_name_en}
            <span>{s.company_name_th}</span>
          </span>
        </a>
        <nav className={menu ? 'nav open' : 'nav'} aria-label="เมนูหลัก">
          <a href="#home" onClick={() => setMenu(false)}>
            {s.nav_home}
          </a>
          <a href="#about" onClick={() => setMenu(false)}>
            {s.nav_about}
          </a>
          {s.show_team === '1' && (
            <a href="#team" onClick={() => setMenu(false)}>
              {s.nav_team}
            </a>
          )}
          <a href="#service" onClick={() => setMenu(false)}>
            {s.nav_service}
          </a>
          <div className="nav-dropdown">
            <a href="#gallery" onClick={() => selectCategory('all')}>
              {s.nav_gallery} <ChevronDown size={12} />
            </a>
            <div className="dropdown-items">
              {Object.entries(categories).map(([k, v]) => (
                <a href="#gallery" onClick={() => selectCategory(k)} key={k}>
                  {v}
                </a>
              ))}
            </div>
          </div>
          <a href="#contact" onClick={() => setMenu(false)}>
            {s.nav_contact}
          </a>
        </nav>
        <div className="header-social">
          {s.line_url && (
            <a href={s.line_url} target="_blank" rel="noopener noreferrer" className="social-line">
              <LineIcon size={20} /> LINE
            </a>
          )}
          <a
            href={s.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-fb"
            aria-label="Facebook"
          >
            <FacebookIcon size={20} />
          </a>
        </div>
        <button
          className="mobile-menu icon-button"
          aria-label={menu ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section
          className="hero"
          id="home"
          aria-roledescription="carousel"
          aria-label="ภาพแนะนำสตูดิโอ"
          onMouseEnter={() => setInteracting(true)}
          onMouseLeave={() => setInteracting(false)}
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setInteracting(false);
          }}
        >
          {slides.map((h, i) => (
            <div
              className={'hero-slide ' + (i === slide % Math.max(1, slides.length) ? 'active' : '')}
              key={h.id}
              aria-hidden={i !== slide % slides.length}
            >
              <Picture src={h.image_url} alt={h.alt_text} eager={i === 0} />
            </div>
          ))}
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">{s.hero_eyebrow}</p>
            <h2>{slideNow?.title || s.company_name_th}</h2>
            <p className="hero-sub">{slideNow?.subtitle}</p>
            <a href="#gallery" className="hero-cta">
              {s.hero_cta_text} <ArrowUpRight size={19} />
            </a>
          </div>
          <div className="hero-bottom">
            <a href="#about" className="scroll-hint">
              <ArrowDown size={15} /> {s.hero_scroll_text}
            </a>
            <div className="hero-pagination">
              <span>{String(slide + 1).padStart(2, '0')}</span>
              <div className="slide-dots">
                {slides.map((h, i) => (
                  <button
                    aria-label={'ไปสไลด์ ' + (i + 1)}
                    aria-current={i === slide}
                    className={i === slide ? 'active' : ''}
                    key={h.id}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
              <span>{String(slides.length).padStart(2, '0')}</span>
              <button
                aria-label="สไลด์ก่อนหน้า"
                onClick={() => setSlide((i) => (i - 1 + slides.length) % slides.length)}
                disabled={slides.length < 2}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                aria-label="สไลด์ถัดไป"
                onClick={() => setSlide((i) => (i + 1) % slides.length)}
                disabled={slides.length < 2}
              >
                <ChevronRight size={17} />
              </button>
              <button
                className="pause"
                onClick={() => setPaused(!paused)}
                aria-label={paused ? 'เล่นสไลด์อัตโนมัติ' : 'หยุดสไลด์อัตโนมัติ'}
              >
                {paused ? '▶' : 'Ⅱ'}
              </button>
            </div>
          </div>
        </section>
        <section className="welcome section-shell" id="about">
          <div className="welcome-photo">
            <Picture src={s.welcome_image_url} alt={s.welcome_image_alt_text} />
            <span className="photo-badge">{s.projects_badge_text}</span>
            <span className="image-credit">{s.welcome_photo_caption}</span>
          </div>
          <div className="welcome-copy">
            <p className="small-label">{s.welcome_label}</p>
            <h1>{s.welcome_title}</h1>
            <p className="thai-company">{s.company_name_th}</p>
            <p className="thai-subtitle">{s.welcome_subtitle}</p>
            <div className="fine-line" />
            <p className="body-copy">{s.welcome_body}</p>
            <TextLink onClick={about}>{s.welcome_button_text.replace('⤿', '')}</TextLink>
          </div>
        </section>
        {s.show_concept !== '0' && (
          <section className="concept section-shell">
            <div className="concept-copy">
              <span className="quote-watermark" aria-hidden="true">
                “
              </span>
              <p>{s.concept_quote_th}</p>
              <span className="concept-signature">{s.company_name_en}</span>
            </div>
            <div className="concept-image">
              <Picture src={s.concept_image_url} alt={s.concept_image_alt_text} />
            </div>
          </section>
        )}
        {s.show_video_banner !== '0' && (
          <section className="video-banner">
            <Picture src={s.video_cover_url} alt={s.video_cover_alt_text} />
            <div className="video-shade" />
            <div className="video-copy">
              <p className="eyebrow">{s.video_banner_subtitle}</p>
              {s.youtube_url ? (
                <button
                  className="play-button"
                  aria-label={s.video_watch_text}
                  onClick={() => setVideo(s.youtube_url)}
                >
                  <Play size={25} fill="currentColor" />
                </button>
              ) : (
                <a
                  className="play-button"
                  href={s.facebook_url}
                  aria-label={s.video_watch_text}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowUpRight size={28} />
                </a>
              )}
              <h2>{s.video_banner_title}</h2>
              <p>{s.video_watch_text}</p>
            </div>
          </section>
        )}
        {s.show_mission !== '0' && (
          <section className="mission section-shell">
            <div className="mission-copy">
              <p className="eyebrow muted">{s.mission_label}</p>
              <h2>{s.mission_title}</h2>
              <p className="body-copy">{s.mission_body}</p>
              <TextLink href="#contact">{s.mission_button_text}</TextLink>
            </div>
            <div className="mission-photo">
              <Picture src={s.mission_cover_url} alt={s.mission_cover_alt_text} />
              {s.mission_video_url && (
                <button
                  className="play-button"
                  aria-label={s.mission_title}
                  onClick={() => setVideo(s.mission_video_url)}
                >
                  <Play size={24} fill="currentColor" />
                </button>
              )}
              <span className="photo-corner">{s.mission_photo_caption}</span>
            </div>
            <div className="philosophy-photo">
              <Picture src={s.philosophy_bw_image_url} alt={s.philosophy_image_alt_text} />
            </div>
            <div className="philosophy-copy">
              <span className="small-label">{s.philosophy_label}</span>
              <p className="body-copy">{s.philosophy_body}</p>
              <TextLink href="#gallery">{s.view_more_text}</TextLink>
            </div>
          </section>
        )}
        <section className="services-section" id="service">
          <div className="section-heading">
            <p className="eyebrow muted">{s.service_label}</p>
            <h2>{s.service_title}</h2>
            <p>{s.service_subtitle}</p>
          </div>
          <div className="services-grid section-shell">
            {services.map((service, i) => (
              <article className="service-card" key={service.id}>
                <button
                  className="service-image"
                  aria-label={'อ่านรายละเอียด ' + service.title_th}
                  onClick={() =>
                    setArticle({
                      title: service.title_th,
                      body: service.full_content_th,
                      image: service.image_url,
                    })
                  }
                >
                  <Picture src={service.image_url} alt={service.alt_text} />
                  <span className="service-number">0{i + 1}</span>
                  <span className="service-plus">
                    <Plus size={20} />
                  </span>
                </button>
                <p className="eyebrow muted">{service.title_en}</p>
                <h3>{service.title_th}</h3>
                <p>{service.description_th}</p>
                <TextLink
                  onClick={() =>
                    setArticle({
                      title: service.title_th,
                      body: service.full_content_th,
                      image: service.image_url,
                    })
                  }
                >
                  {s.service_read_more_text}
                </TextLink>
              </article>
            ))}
          </div>
        </section>
        <section className="gallery-section section-shell" id="gallery">
          <div className="gallery-header">
            <div>
              <p className="eyebrow muted">{s.gallery_eyebrow}</p>
              <h2>{s.gallery_title}</h2>
            </div>
            <p style={{ whiteSpace: 'pre-line' }}>{s.gallery_intro}</p>
          </div>
          <div className="gallery-tabs" role="group" aria-label="กรองหมวดหมู่ผลงาน">
            {[['all', s.gallery_all_text], ...Object.entries(categories)].map(([k, v]) => (
              <button
                aria-pressed={filter === k}
                className={filter === k ? 'active' : ''}
                onClick={() => selectCategory(k)}
                key={k}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="gallery-grid">
            {shown.map((p, i) => (
              <button
                className={'project-card project-shape-' + (i % 4)}
                key={p.id}
                onClick={() => setAlbum(p)}
                aria-label={'เปิดอัลบั้ม ' + p.title + ' ' + p.image_count + ' รูป'}
              >
                <div className="project-image">
                  <Picture src={p.cover_thumb_url} alt={p.title} />
                  <span className="project-open">
                    <ArrowUpRight size={26} />
                  </span>
                  <span className="image-count">
                    <ImageIcon size={12} />
                    {p.image_count} {s.photo_unit}
                  </span>
                </div>
                <div className="project-caption">
                  <span>
                    <strong>{p.title}</strong>
                    <small>{categories[p.category]}</small>
                  </span>
                  <ArrowUpRight size={18} />
                </div>
              </button>
            ))}
          </div>
          {!shown.length && <p className="empty-state">{s.gallery_empty_text}</p>}
          <div className="gallery-more">
            {visibleProjects.length > initial.length && (
              <TextLink onClick={() => setExpanded(!expanded)}>
                {expanded ? s.gallery_less_text : s.gallery_more_text}
              </TextLink>
            )}
            <p className="demo-caption">{s.gallery_note}</p>
          </div>
        </section>
        {s.show_social_follow !== '0' && s.social_follow_url && (
          <section className="instagram-strip">
            <FacebookIcon size={20} />
            <a href={s.social_follow_url} target="_blank" rel="noopener noreferrer">
              {s.social_follow_title}
              <ArrowUpRight size={18} />
            </a>
            <span>{s.social_follow_handle}</span>
          </section>
        )}
        {s.show_team === '1' && (
          <section className="team-section section-shell" id="team">
            <div className="team-copy">
              <p className="eyebrow muted">{s.company_name_en.split(' ')[0]}</p>
              <h2>{s.team_title}</h2>
              <p>{s.team_label}</p>
              <p className="body-copy">{s.team_intro}</p>
              <div className="team-controls">
                <button
                  className="icon-button bordered"
                  aria-label="ทีมก่อนหน้า"
                  onClick={() => setTeamPage((i) => (i - 1 + team.length) % team.length)}
                  disabled={team.length < 2}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="icon-button bordered"
                  aria-label="ทีมถัดไป"
                  onClick={() => setTeamPage((i) => (i + 1) % team.length)}
                  disabled={team.length < 2}
                >
                  <ChevronRight size={18} />
                </button>
                <span>
                  {String(teamPage + 1).padStart(2, '0')} / {String(team.length).padStart(2, '0')}
                </span>
              </div>
              <TextLink
                onClick={() =>
                  setArticle({
                    title: s.team_title,
                    body:
                      team.map((t) => t.name + ' — ' + t.role).join('\n\n') +
                      '\n\n' +
                      s.team_detail,
                  })
                }
              >
                {s.team_more_text}
              </TextLink>
            </div>
            <div className="team-photo">
              {teamNow && (
                <>
                  <Picture src={teamNow.image_url} alt={teamNow.alt_text} />
                  <div className="team-caption">
                    <span>
                      {teamNow.name}
                      <small>{teamNow.role}</small>
                    </span>
                    <div className="team-dots">
                      {team.map((t, i) => (
                        <button
                          key={t.id}
                          aria-label={'ดูทีม ' + (i + 1)}
                          aria-current={teamPage === i}
                          className={teamPage === i ? 'active' : ''}
                          onClick={() => setTeamPage(i)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
              <p className="demo-caption">{s.team_note}</p>
            </div>
          </section>
        )}
        <section className="contact-section section-shell" id="contact">
          <div className="contact-photo">
            <div className="contact-photo-frame">
              <Picture src={s.contact_image_url} alt={s.contact_image_alt_text} />
            </div>
            <div className="contact-photo-title">
              {s.contact_photo_title}
              <span>{s.contact_photo_subtitle}</span>
            </div>
          </div>
          <div className="contact-copy">
            <p className="small-label">{s.contact_label}</p>
            <h2>{s.contact_title}</h2>
            <p className="contact-intro">{s.contact_intro}</p>
            <div className="contact-phones">
              <Phone size={18} />
              <div>
                {s.phone_primary && (
                  <a href={'tel:' + s.phone_primary.replace(/[^+0-9]/g, '')}>
                    {s.phone_primary}
                    <small>{s.phone_primary_label}</small>
                  </a>
                )}
                {s.phone_secondary && (
                  <a href={'tel:' + s.phone_secondary.replace(/[^+0-9]/g, '')}>
                    {s.phone_secondary}
                    <small>{s.phone_secondary_label}</small>
                  </a>
                )}
              </div>
            </div>
            <p className="address">{s.address_th}</p>
            {s.email && (
              <a className="email" href={'mailto:' + s.email}>
                {s.email}
              </a>
            )}
            <div className="contact-socials">
              {s.line_url && (
                <a href={s.line_url} target="_blank" rel="noopener noreferrer">
                  <LineIcon />
                  LINE<small>{s.line_id}</small>
                </a>
              )}
              {s.line_secondary_url && (
                <a href={s.line_secondary_url} target="_blank" rel="noopener noreferrer">
                  <LineIcon />
                  LINE<small>{s.line_secondary_id}</small>
                </a>
              )}
              {s.facebook_url && (
                <a href={s.facebook_url} target="_blank" rel="noopener noreferrer">
                  <FacebookIcon />
                  Facebook
                </a>
              )}
              {s.instagram_url && (
                <a href={s.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Instagram size={21} />
                  Instagram
                </a>
              )}
              {s.tiktok_url && (
                <a href={s.tiktok_url} target="_blank" rel="noopener noreferrer">
                  <span className="tiktok-icon">♪</span>TikTok
                </a>
              )}
            </div>
            {s.google_maps_url && (
              <a
                className="text-link"
                href={s.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={17} />
                {s.location_button_text}
                <ArrowUpRight size={19} />
              </a>
            )}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <a href="#home" className="footer-brand">
          <BrandMark src={s.logo_image_url} alt={s.logo_alt_text || s.company_name_th} />
          {s.company_name_en}
        </a>
        <p>
          © {new Date().getFullYear()} {s.copyright_text}
        </p>
        <button onClick={() => setArticle({ title: s.privacy_title, body: s.privacy_body })}>
          {s.privacy_link_text}
        </button>
        <a className="back-top" href="#home" aria-label="กลับด้านบน">
          <ArrowUpRight size={20} />
        </a>
      </footer>
      <div className="floating-actions">
        <a className="floating-line" href={contactUrl} target="_blank" rel="noopener noreferrer">
          <span>{s.line_url ? s.floating_line_text : s.floating_facebook_text}</span>
          {s.line_url ? <LineIcon size={29} /> : <FacebookIcon size={25} />}
        </a>
        <a
          className="floating-fb"
          href={s.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.floating_facebook_text}
          title={s.floating_facebook_text}
        >
          <FacebookIcon size={24} />
        </a>
        <a
          className="floating-phone"
          href={'tel:' + s.phone_primary.replace(/[^+0-9]/g, '')}
          aria-label="โทรปรึกษา"
        >
          <Phone size={21} />
        </a>
      </div>
      <div className="mobile-conversion">
        <a href={contactUrl} target="_blank" rel="noopener noreferrer">
          <LineIcon />
          {s.line_url ? s.mobile_line_text : s.mobile_facebook_text}
        </a>
        <a href={s.facebook_url} target="_blank" rel="noopener noreferrer">
          <FacebookIcon />
          {s.mobile_facebook_text}
        </a>
      </div>
      {cookie && (
        <aside className="cookie-banner" aria-label="การใช้คุกกี้">
          <p>
            {s.cookie_message}{' '}
            <button onClick={() => setArticle({ title: s.privacy_title, body: s.privacy_body })}>
              {s.cookie_policy_text}
            </button>
          </p>
          <div>
            <button onClick={() => chooseCookie('necessary')}>{s.cookie_necessary_text}</button>
            <button className="cookie-accept" onClick={() => chooseCookie('accepted')}>
              {s.cookie_accept_text}
            </button>
          </div>
        </aside>
      )}
      {article && (
        <Modal title={article.title} onClose={() => setArticle(null)}>
          {article.image && <Picture src={article.image} alt={article.title} />}
          <div className="article-content">
            <h2>{article.title}</h2>
            <p>{article.body}</p>
            <a href={contactUrl} className="button green" target="_blank" rel="noopener noreferrer">
              <LineIcon />
              {s.contact_button_text}
              <ArrowUpRight size={18} />
            </a>
          </div>
        </Modal>
      )}
      {video && (
        <Modal
          title={s.company_name_th + ' — ' + s.video_watch_text}
          onClose={() => setVideo(null)}
          wide
        >
          {videoEmbed(video) ? (
            <iframe
              className="video-embed"
              src={videoEmbed(video)!}
              title={s.company_name_th + ' — วิดีโอ'}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <p className="empty-state">กรุณาตั้งค่าลิงก์ YouTube ที่ถูกต้องใน Admin</p>
          )}
          <p className="video-notice">{s.video_notice_text}</p>
        </Modal>
      )}
      {album && (
        <Modal title={album.title} onClose={() => setAlbum(null)} wide>
          <div className="album-layout">
            <div
              className="album-main"
              onTouchStart={(e) => (touch.current = e.changedTouches[0].screenX)}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].screenX - touch.current;
                if (Math.abs(dx) > 45) move(dx > 0 ? -1 : 1);
              }}
            >
              {loading ? (
                <div className="empty-state">กำลังโหลดอัลบั้ม…</div>
              ) : albumError ? (
                <p className="empty-state">{albumError}</p>
              ) : images.length ? (
                <img
                  onLoad={() => setImageState('ready')}
                  onError={() => setImageState('error')}
                  key={images[index]?.id}
                  src={images[index]?.full_url}
                  width={images[index]?.width}
                  height={images[index]?.height}
                  alt={images[index]?.alt_text || album.title}
                />
              ) : (
                <p className="empty-state">ยังไม่มีรูปภาพในอัลบั้มนี้</p>
              )}
              {!loading && images.length > 0 && imageState !== 'ready' && (
                <span className="album-image-status" role="status">
                  {imageState === 'error'
                    ? 'โหลดรูปไม่สำเร็จ กรุณาลองใหม่'
                    : 'กำลังโหลดภาพความละเอียดสูง…'}
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button className="album-prev" aria-label="รูปก่อนหน้า" onClick={() => move(-1)}>
                    <ChevronLeft />
                  </button>
                  <button className="album-next" aria-label="รูปถัดไป" onClick={() => move(1)}>
                    <ChevronRight />
                  </button>
                  <span className="album-counter">
                    {index + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
            <div className="album-thumbnails">
              {images.map((img, i) => (
                <button
                  className={index === i ? 'active' : ''}
                  key={img.id}
                  aria-label={'ดูรูป ' + (i + 1)}
                  onClick={() => setIndex(i)}
                >
                  <img src={img.thumb_url} alt="" loading="lazy" width={80} height={60} />
                </button>
              ))}
            </div>
            <div className="album-details">
              <div>
                <p className="eyebrow muted">{categories[album.category]}</p>
                <h2>{album.title}</h2>
                <p>{album.location}</p>
                <p>{album.description}</p>
                {images[index]?.caption && <p>{images[index].caption}</p>}
              </div>
              <a
                href={contactUrl}
                className="button green"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LineIcon />
                {s.album_contact_text}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
