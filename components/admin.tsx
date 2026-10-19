'use client';
import { useCallback, useEffect, useRef, useState, useId, type FormEvent } from 'react';
import {
  LayoutDashboard,
  FileText,
  Images,
  Layers,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Download,
  ShieldCheck,
  HardDrive,
  Camera,
  FolderOpen,
  ChevronRight,
  Check,
  LoaderCircle,
  Leaf,
} from 'lucide-react';
import {
  categories as baseCategories,
  categoryLabels,
  type Settings as SiteSettings,
  type ProjectImage,
} from '@/lib/types';
import { BrandMark } from './icons';
import { Modal } from './modal';
import { imageSettingKeys } from '@/lib/content';
import { labels, groups, entityFields, textAreas, isImage, seoSettingKeys } from '@/lib/cms';
type Row = Record<string, string | number>;
const nav = [
  ['dashboard', 'ภาพรวม', LayoutDashboard],
  ['settings', 'เนื้อหาเว็บไซต์', FileText],
  ['media', 'รูปภาพทั้งหมด', Camera],
  ['projects', 'อัลบั้มผลงาน', Images],
  ['services', 'บริการ', Layers],
  ['hero_slides', 'สไลด์หน้าแรก', Camera],
  ['team_members', 'ทีมงาน', Users],
  ['security', 'SEO และความปลอดภัย', Settings],
] as const;
async function api(url: string, method = 'GET', data?: unknown) {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && url !== '/api/auth')
      window.dispatchEvent(new Event('admin-expired'));
    throw new Error(result.error || 'ไม่สามารถดำเนินการได้');
  }
  return result;
}
function thumb(url: string) {
  return url.replace('/full_', '/thumb_');
}
function Field({
  name,
  value,
  onChange,
  bucket = 'sections',
  notify,
  categoryOptions = baseCategories,
}: {
  categoryOptions?: Record<string, string>;
  name: string;
  value: string | number;
  onChange: (v: string | number) => void;
  bucket?: string;
  notify: (m: string, error?: boolean) => void;
}) {
  const fieldId = 'cms-' + useId().replace(/:/g, '');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    window.dispatchEvent(new CustomEvent('admin-image-upload', { detail: 1 }));
    try {
      const f = new FormData();
      f.append('files', file);
      f.append('bucket', bucket);
      const r = await fetch('/api/upload', { method: 'POST', body: f });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onChange(d.images[0].full_url);
      notify('เตรียมรูปแล้ว กดบันทึกเพื่อใช้งาน');
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setUploading(false);
      window.dispatchEvent(new CustomEvent('admin-image-upload', { detail: -1 }));
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  return (
    <div className={'admin-field ' + (textAreas.has(name) || isImage(name) ? 'field-wide' : '')}>
      <label htmlFor={fieldId}>{labels[name] || name}</label>
      {name.startsWith('show_') ? (
        <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="1">แสดงส่วนนี้</option>
          <option value="0">ซ่อนส่วนนี้</option>
        </select>
      ) : ['is_active', 'is_featured_on_home'].includes(name) ? (
        <select id={fieldId} value={value} onChange={(e) => onChange(Number(e.target.value))}>
          <option value={1}>เปิดใช้งาน</option>
          <option value={0}>ปิดใช้งาน</option>
        </select>
      ) : name === 'category' ? (
        <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)}>
          {Object.entries(categoryOptions).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
      ) : textAreas.has(name) ? (
        <textarea
          id={fieldId}
          rows={name.includes('body') || name === 'about_detail' ? 6 : 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={fieldId}
          type={name === 'sort_order' ? 'number' : 'text'}
          min={name === 'sort_order' ? 0 : undefined}
          value={value}
          onChange={(e) =>
            onChange(name === 'sort_order' ? Number(e.target.value) : e.target.value)
          }
          placeholder={name.endsWith('_url') ? 'https://…' : ''}
        />
      )}
      {isImage(name) && (
        <span className="field-upload">
          {value ? (
            <img
              src={thumb(String(value))}
              alt="ตัวอย่างรูป"
              width={140}
              height={90}
              loading="lazy"
            />
          ) : (
            <span className="mini-placeholder">
              <Camera size={24} />
            </span>
          )}
          <span>
            <input
              aria-label={'อัปโหลด ' + (labels[name] || name)}
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
              onChange={(e) => upload(e.target.files?.[0])}
              className="sr-only"
            />
            <button
              type="button"
              className="button small"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? <LoaderCircle size={15} className="spin" /> : <Upload size={15} />}{' '}
              {uploading ? 'กำลังบีบอัด…' : 'อัปโหลดรูปใหม่'}
            </button>
            <small>
              JPEG, PNG, WebP, AVIF, TIFF • ไม่เกิน 10 MB
              <br />
              สร้าง WebP 640px + 1920px อัตโนมัติ
            </small>
          </span>
        </span>
      )}
    </div>
  );
}
function BatchUploader({
  projectId,
  onComplete,
  notify,
  onActivityChange,
}: {
  projectId: number;
  onComplete: () => void;
  onActivityChange: (active: boolean) => void;
  notify: (m: string, error?: boolean) => void;
}) {
  const [pending, setPending] = useState<File[]>([]),
    [total, setTotal] = useState(0),
    [done, setDone] = useState(0),
    [busy, setBusy] = useState(false),
    [dragging, setDragging] = useState(false),
    [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    onActivityChange(busy || pending.length > 0);
    const warn = (e: BeforeUnloadEvent) => {
      if (busy || pending.length) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      onActivityChange(false);
    };
  }, [busy, pending.length, onActivityChange]);
  function select(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list);
    if (files.length + pending.length > 50) {
      notify('เลือกได้สูงสุด 50 รูปต่อคิว', true);
      return;
    }
    if (files.some((f) => f.size > 10 * 1024 * 1024 || !f.type.startsWith('image/'))) {
      notify('กรุณาเลือกไฟล์รูปภาพขนาดไม่เกิน 10 MB ต่อรูป', true);
      return;
    }
    setPending((old) => [...old, ...files]);
    setTotal((t) => t + files.length);
    setError('');
    if (input.current) input.current.value = '';
  }
  async function start() {
    if (busy || !pending.length) return;
    setBusy(true);
    setError('');
    let queue = [...pending];
    try {
      while (queue.length) {
        const batch = queue.slice(0, 3);
        const form = new FormData();
        batch.forEach((file) => form.append('files', file));
        form.append('bucket', 'projects');
        form.append('project_id', String(projectId));
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'การอัปโหลดขัดข้อง');
        queue = queue.slice(batch.length);
        setDone((n) => n + batch.length);
        setPending(queue);
        onComplete();
      }
      notify('อัปโหลดรูปภาพครบแล้ว');
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      notify(message + ' — รูปที่ยังไม่ส่งอยู่ในคิว กดลองต่อได้', true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="batch-uploader">
      <h3>
        <Upload size={19} /> อัปโหลดหลายรูป
      </h3>
      <div
        className={'dropzone ' + (dragging ? 'dragging' : '')}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) select(e.dataTransfer.files);
        }}
      >
        <Upload size={28} />
        <strong>ลากรูปมาวางที่นี่ หรือเลือกจากเครื่อง</strong>
        <p>เลือกได้ครั้งละ 10–50 รูป • ส่งครั้งละไม่เกิน 3 รูป • รูปละไม่เกิน 10 MB</p>
        <input
          ref={input}
          className="sr-only"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
          onChange={(e) => select(e.target.files)}
        />
        <button
          className="button small"
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          เลือกรูปภาพ
        </button>
      </div>
      {total > 0 && (
        <>
          <div className="progress-label" aria-live="polite">
            <span>
              {busy ? 'กำลังอัปโหลดและบีบอัดรูปภาพ' : 'ความคืบหน้า'} {done} / {total}…
            </span>
            <strong>{Math.round((done / total) * 100)}%</strong>
          </div>
          <progress value={done} max={total} />
          <p className="queue-names">
            {pending
              .slice(0, 5)
              .map((f) => f.name)
              .join(' • ')}
            {pending.length > 5 ? ' และอีก ' + (pending.length - 5) + ' รูป' : ''}
          </p>
          <div className="button-row">
            <button className="button green" disabled={busy || !pending.length} onClick={start}>
              {busy ? <LoaderCircle size={16} className="spin" /> : <Upload size={16} />}{' '}
              {busy
                ? 'กำลังอัปโหลด…'
                : !pending.length
                  ? 'อัปโหลดครบแล้ว'
                  : error
                    ? 'ลองอัปโหลดต่อ'
                    : 'เริ่มอัปโหลด ' + pending.length + ' รูป'}
            </button>
            <button
              className="button small"
              disabled={busy}
              onClick={() => {
                setPending([]);
                setTotal(0);
                setDone(0);
                setError('');
              }}
            >
              ล้างคิว
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
export default function Admin({
  authenticated,
  branding,
}: {
  authenticated: boolean;
  branding: SiteSettings;
}) {
  const [authed, setAuthed] = useState(authenticated),
    [password, setPassword] = useState(''),
    [loginError, setLoginError] = useState(''),
    [tab, setTab] = useState('dashboard'),
    [settings, setSettings] = useState<SiteSettings>(branding),
    [rows, setRows] = useState<Row[]>([]),
    [stats, setStats] = useState({ projects: 0, images: 0, bytes: 0, local_images: 0 }),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null),
    [editing, setEditing] = useState<Row | null>(null),
    [album, setAlbum] = useState<Row | null>(null),
    [images, setImages] = useState<ProjectImage[]>([]),
    [deleteTarget, setDeleteTarget] = useState<{ entity: string; id: number; name: string } | null>(
      null,
    ),
    [currentPw, setCurrentPw] = useState(''),
    [newPw, setNewPw] = useState(''),
    [confirmPw, setConfirmPw] = useState(''),
    [imageEdit, setImageEdit] = useState<ProjectImage | null>(null);
  const categories = categoryLabels(settings);
  const [pendingImageUploads, setPendingImageUploads] = useState(0);
  useEffect(() => {
    const handler = (event: Event) =>
      setPendingImageUploads((n) => Math.max(0, n + (event as CustomEvent<number>).detail));
    window.addEventListener('admin-image-upload', handler);
    return () => window.removeEventListener('admin-image-upload', handler);
  }, []);
  const [uploadActive, setUploadActive] = useState(false);
  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const expire = () => {
      setAuthed(false);
      setAlbum(null);
      setEditing(null);
      notify('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่', true);
    };
    window.addEventListener('admin-expired', expire);
    return () => window.removeEventListener('admin-expired', expire);
  }, [notify]);
  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      if (tab === 'dashboard') setStats(await api('/api/admin/dashboard'));
      else if (['settings', 'security', 'media'].includes(tab))
        setSettings(await api('/api/admin/settings'));
      else setRows(await api('/api/admin/' + tab));
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoading(false);
    }
  }, [tab, authed, notify]);
  useEffect(() => {
    void load();
  }, [load]);
  const albumLoadVersion = useRef(0);
  async function loadImages(id = Number(album?.id)) {
    const version = ++albumLoadVersion.current;
    try {
      const result = await api('/api/projects/' + id);
      if (version !== albumLoadVersion.current) return;
      setImages(result.images);
      setAlbum((current) =>
        current && Number(current.id) === id
          ? {
              ...current,
              cover_thumb_url: result.project.cover_thumb_url,
              cover_full_url: result.project.cover_full_url,
            }
          : current,
      );
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setLoginError('');
    try {
      await api('/api/auth', 'POST', { password });
      setAuthed(true);
      setPassword('');
    } catch (e) {
      setLoginError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    try {
      await api('/api/auth', 'DELETE');
      setAuthed(false);
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    if (pendingImageUploads) {
      notify('กรุณารอให้รูปอัปโหลดเสร็จก่อนบันทึก', true);
      return;
    }
    setSaving(true);
    try {
      await api('/api/admin/settings', 'PATCH', settings);
      notify('บันทึกแล้ว หน้าเว็บและ SEO อัปเดตทันที');
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  async function saveRow(e: FormEvent) {
    e.preventDefault();
    if (pendingImageUploads) {
      notify('กรุณารอให้รูปอัปโหลดเสร็จก่อนบันทึก', true);
      return;
    }
    if (!editing) return;
    setSaving(true);
    try {
      const result = await api('/api/admin/' + tab, editing.id ? 'PATCH' : 'POST', editing);
      notify('บันทึกเรียบร้อย');
      setEditing(null);
      await load();
      if (tab === 'projects' && !editing.id) {
        const a = { ...editing, id: result.id };
        setAlbum(a);
        await loadImages(result.id);
      }
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  function newRow() {
    const row: Row = { sort_order: rows.length };
    entityFields[tab].forEach(
      (key) =>
        (row[key] = ['is_active', 'is_featured_on_home'].includes(key)
          ? 1
          : key === 'sort_order'
            ? rows.length
            : key === 'category'
              ? 'landscape-construction'
              : ''),
    );
    setEditing(row);
  }
  async function deleteRow() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api('/api/admin/' + deleteTarget.entity + '?id=' + deleteTarget.id, 'DELETE');
      setDeleteTarget(null);
      notify('ลบข้อมูลและไฟล์ที่เกี่ยวข้องแล้ว');
      if (album) await loadImages();
      else await load();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  async function shiftImage(image: ProjectImage, direction: number) {
    const i = images.findIndex((img) => img.id === image.id),
      other = images[i + direction];
    if (!other) return;
    setSaving(true);
    try {
      const reordered = images.map((img) => img.id);
      [reordered[i], reordered[i + direction]] = [reordered[i + direction], reordered[i]];
      await api('/api/admin/reorder', 'POST', { project_id: album?.id, ids: reordered });
      await loadImages();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  async function setCover(img: ProjectImage) {
    try {
      await api('/api/admin/projects', 'PATCH', { id: album?.id, cover_image_id: img.id });
      setAlbum((a) => (a ? { ...a, cover_thumb_url: img.thumb_url } : a));
      notify('ตั้งเป็นภาพปกแล้ว');
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      notify('ยืนยันรหัสผ่านไม่ตรงกัน', true);
      return;
    }
    setSaving(true);
    try {
      await api('/api/admin/password', 'POST', {
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setAuthed(false);
      notify('เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่');
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  async function backup() {
    try {
      const r = await fetch('/api/admin/backup');
      if (!r.ok) throw new Error('ดาวน์โหลดไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'baanpoo-' + new Date().toISOString().slice(0, 10) + '.sqlite';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('ดาวน์โหลดฐานข้อมูลแล้ว อย่าลืมสำรองโฟลเดอร์ uploads แยกด้วย');
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  if (!authed)
    return (
      <main className="admin-login">
        <div className="login-art">
          <div className="login-brand">
            <BrandMark src={settings.logo_image_url} alt={settings.company_name_th} />
            <span>
              {settings.company_name_en}
              <br />
              {settings.company_name_th}
            </span>
          </div>
          <div>
            <p>BAAN POO / DIGITAL STUDIO</p>
            <h1>
              Your garden.
              <br />
              In a new dimension.
            </h1>
            <span>ดูแลทุกเรื่องราวของสตูดิโอ ในพื้นที่เดียว</span>
          </div>
          <small>GARDEN • DECK • OUTDOOR LIVING</small>
        </div>
        <div className="login-form-wrap">
          <a href="/" className="admin-back">
            <ExternalLink size={15} /> กลับหน้าเว็บไซต์
          </a>
          <form onSubmit={login} className="login-form">
            <span className="login-icon">
              <Leaf size={25} />
            </span>
            <p className="eyebrow muted">{settings.company_name_en} / ADMIN</p>
            <h2>ยินดีต้อนรับกลับ</h2>
            <p>เข้าสู่ระบบเพื่อจัดการเว็บไซต์ของคุณ</p>
            <label className="admin-field">
              <span>รหัสผ่านผู้ดูแล</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                maxLength={256}
              />
            </label>
            {loginError && (
              <p className="form-error" role="alert">
                {loginError}
              </p>
            )}
            <button className="button green" disabled={saving || pendingImageUploads > 0}>
              {saving ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}{' '}
              {saving ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
              <ChevronRight size={17} />
            </button>
            <small>
              <ShieldCheck size={13} /> การเชื่อมต่อผู้ดูแลป้องกันด้วย HTTP-only session
            </small>
          </form>
        </div>
        {toast && (
          <div role="status" className={'admin-toast ' + (toast.error ? 'error' : '')}>
            {toast.message}
          </div>
        )}
      </main>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <BrandMark src={settings.logo_image_url} alt={settings.company_name_th} />
          <span>
            {settings.company_name_th}
            <small>GARDEN STUDIO MANAGEMENT</small>
          </span>
        </a>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="เมนูจัดการเว็บไซต์">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => {
                if (uploadActive) {
                  notify('กรุณาอัปโหลดให้เสร็จหรือล้างคิวก่อนเปลี่ยนหน้า', true);
                  return;
                }
                setTab(key);
                setAlbum(null);
                setRows([]);
              }}
            >
              <Icon size={18} />
              {label}
              {tab === key && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={17} />
            ดูหน้าเว็บไซต์
          </a>
          <button onClick={logout}>
            <LogOut size={17} />
            ออกจากระบบ
          </button>
          <small>BAAN POO CMS · v2.0</small>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>
            Studio / <strong>{nav.find((n) => n[0] === tab)?.[1]}</strong>
          </span>
          <div>
            <span className="online-dot" /> เว็บไซต์พร้อมใช้งาน
            <span className="admin-avatar">B</span>
            <button
              className="mobile-admin-logout icon-button"
              aria-label="ออกจากระบบ"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-heading">
            <div>
              <p className="eyebrow muted">YOUR DIGITAL GARDEN</p>
              <h1>{nav.find((n) => n[0] === tab)?.[1]}</h1>
              <p>
                {tab === 'dashboard'
                  ? 'ดูแลเรื่องราวและผลงานของสตูดิโอ ให้เติบโตอย่างสวยงาม'
                  : tab === 'projects'
                    ? 'จัดระเบียบอัลบั้ม อัปโหลดรูป และเล่าเรื่องราวของทุกพื้นที่'
                    : 'ปรับแต่งข้อมูลที่ลูกค้าจะมองเห็นบนเว็บไซต์'}
              </p>
            </div>
            {entityFields[tab] && (
              <button className="button green" disabled={uploadActive} onClick={newRow}>
                <Plus size={18} />
                เพิ่ม{tab === 'projects' ? 'อัลบั้ม' : 'ข้อมูล'}
              </button>
            )}
          </div>
          {loading ? (
            <div className="admin-loading">
              <LoaderCircle className="spin" />
              กำลังโหลดข้อมูล…
            </div>
          ) : (
            <>
              {tab === 'dashboard' && (
                <>
                  <div className="stats-grid">
                    {[
                      [FolderOpen, stats.projects, 'อัลบั้มผลงาน', 'PROJECT ALBUMS'],
                      [Images, stats.images, 'รูปภาพในอัลบั้ม', 'PORTFOLIO IMAGES'],
                      [
                        HardDrive,
                        (stats.bytes / 1024 / 1024).toFixed(1) + ' MB',
                        'พื้นที่เก็บรูปในเครื่อง',
                        'PERSISTENT STORAGE',
                      ],
                    ].map(([Icon, value, label, en], i) => {
                      const I = Icon as typeof FolderOpen;
                      return (
                        <article className="stat-card" key={i}>
                          <div>
                            <I size={21} />
                            <span>{String(i + 1).padStart(2, '0')}</span>
                          </div>
                          <strong>{value as string | number}</strong>
                          <p>{label as string}</p>
                          <small>{en as string}</small>
                        </article>
                      );
                    })}
                  </div>
                  <div className="dashboard-feature">
                    <div>
                      <p className="eyebrow">LET YOUR WORK TELL THE STORY</p>
                      <h2>
                        ผลงานใหม่
                        <br />
                        เริ่มต้นเรื่องราวบทใหม่
                      </h2>
                      <p>สร้างอัลบั้ม เลือกรูป แล้วให้ระบบดูแลการบีบอัดภาพให้คุณ</p>
                      <button className="button" onClick={() => setTab('projects')}>
                        จัดการอัลบั้มผลงาน <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="admin-panel">
                    <h2>เริ่มต้นได้จากตรงนี้</h2>
                    <div className="quick-links">
                      {[
                        ['settings', 'แก้ไขเนื้อหาและช่องทางติดต่อ', FileText],
                        ['hero_slides', 'เปลี่ยนภาพสไลด์หน้าแรก', Camera],
                        ['security', 'สำรองข้อมูลและตั้งค่า SEO', ShieldCheck],
                      ].map(([key, label, Icon]) => {
                        const I = Icon as typeof FileText;
                        return (
                          <button key={key as string} onClick={() => setTab(key as string)}>
                            <I size={20} />
                            <span>{label as string}</span>
                            <ChevronRight size={17} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="admin-note">
                    <Leaf size={20} />
                    <p>
                      จัดการรูปภาพ ข้อความ และช่องทางติดต่อของบ้านปูการ์เด้นได้จากเมนูด้านบน
                      กดบันทึกหลังแก้ไขเพื่ออัปเดตหน้าเว็บไซต์
                    </p>
                  </div>
                </>
              )}
              {tab === 'media' && (
                <form onSubmit={saveSettings}>
                  <div className="admin-note media-note">
                    <Camera size={21} />
                    <p>
                      รูปภาพทุกจุดแก้ไขได้: เปลี่ยนโลโก้ ไอคอน และรูปแต่ละส่วนด้านล่าง ส่วนภาพสไลด์
                      บริการ ทีมงาน และรูปในอัลบั้ม ใช้ปุ่มทางลัดเพื่อจัดการ
                    </p>
                  </div>
                  <div className="media-shortcuts">
                    {[
                      ['hero_slides', 'ภาพสไลด์หน้าแรก'],
                      ['services', 'ภาพบริการ'],
                      ['projects', 'ภาพอัลบั้มผลงาน'],
                      ['team_members', 'ภาพทีมงาน'],
                    ].map(([key, title]) => (
                      <button type="button" key={key} onClick={() => setTab(key)}>
                        <Images size={20} />
                        <span>{title}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  <div className="media-settings-grid">
                    {imageSettingKeys.map((key) => (
                      <section className="admin-panel" key={key}>
                        <Field
                          name={key}
                          categoryOptions={categories}
                          value={settings[key] || ''}
                          onChange={(value) =>
                            setSettings((current) => ({ ...current, [key]: String(value) }))
                          }
                          notify={notify}
                        />
                      </section>
                    ))}
                  </div>
                  <div className="save-bar">
                    <p>
                      {pendingImageUploads
                        ? 'กำลังเตรียมรูปภาพ…'
                        : 'รูปที่บันทึกจะเปลี่ยนบนหน้าเว็บไซต์ทันที'}
                    </p>
                    <button className="button green" disabled={saving || pendingImageUploads > 0}>
                      <Save size={17} />
                      {saving ? 'กำลังบันทึก…' : 'บันทึกรูปภาพ'}
                    </button>
                  </div>
                </form>
              )}
              {tab === 'settings' && (
                <form onSubmit={saveSettings}>
                  {groups.map(([title, keys]) => (
                    <section className="admin-panel" key={title}>
                      <h2>{title}</h2>
                      <div className="admin-fields">
                        {keys.map((key) => (
                          <Field
                            key={key}
                            name={key}
                            categoryOptions={categories}
                            value={settings[key] || ''}
                            onChange={(v) => setSettings((s) => ({ ...s, [key]: String(v) }))}
                            notify={notify}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                  <div className="save-bar">
                    <p>
                      <Check size={16} /> บันทึกแล้วอัปเดตหน้าเว็บทันที
                    </p>
                    <button className="button green" disabled={saving || pendingImageUploads > 0}>
                      <Save size={17} />
                      {saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                  </div>
                </form>
              )}
              {entityFields[tab] && !album && (
                <div className="admin-record-grid">
                  {rows.map((row) => (
                    <article className="admin-record" key={row.id}>
                      <div className="record-image">
                        {row.image_url || row.cover_thumb_url ? (
                          <img
                            src={thumb(String(row.image_url || row.cover_thumb_url))}
                            alt={String(row.alt_text || row.title || row.name)}
                            loading="lazy"
                          />
                        ) : (
                          <Camera size={32} />
                        )}
                        <span>
                          {tab === 'projects'
                            ? categories[String(row.category)]
                            : row.is_active === 0
                              ? 'ปิดใช้งาน'
                              : 'ลำดับ ' + row.sort_order}
                        </span>
                      </div>
                      <div className="record-content">
                        <h3>{row.title_th || row.title || row.name}</h3>
                        <p>
                          {row.description_th ||
                            row.subtitle ||
                            row.role ||
                            row.location ||
                            'เพิ่มรายละเอียดเพื่อเล่าเรื่องราวของคุณ'}
                        </p>
                        <div className="record-actions">
                          <button onClick={() => setEditing({ ...row })}>แก้ไข</button>
                          {tab === 'projects' && (
                            <button
                              onClick={() => {
                                setAlbum(row);
                                void loadImages(Number(row.id));
                              }}
                            >
                              จัดการรูป <Images size={14} />
                            </button>
                          )}
                          <button
                            className="delete-icon"
                            aria-label={'ลบ ' + (row.title || row.title_th || row.name)}
                            onClick={() =>
                              setDeleteTarget({
                                entity: tab,
                                id: Number(row.id),
                                name: String(row.title || row.title_th || row.name),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!rows.length && (
                    <div className="empty-state">ยังไม่มีข้อมูล กดเพิ่มข้อมูลเพื่อเริ่มต้น</div>
                  )}
                </div>
              )}
              {tab === 'projects' && album && (
                <>
                  <button
                    className="admin-back"
                    onClick={() => {
                      if (uploadActive) {
                        notify('กรุณาอัปโหลดให้เสร็จหรือล้างคิวก่อนออกจากอัลบั้ม', true);
                        return;
                      }
                      setAlbum(null);
                      void load();
                    }}
                  >
                    ← กลับหน้าอัลบั้มทั้งหมด
                  </button>
                  <section className="admin-panel album-admin-heading">
                    <div>
                      <p className="eyebrow muted">PROJECT ALBUM</p>
                      <h2>{album.title}</h2>
                      <p>
                        {images.length} รูป • {categories[String(album.category)]}
                      </p>
                    </div>
                  </section>
                  <BatchUploader
                    key={album.id}
                    projectId={Number(album.id)}
                    onActivityChange={setUploadActive}
                    onComplete={() => void loadImages()}
                    notify={notify}
                  />
                  <div className="admin-image-grid">
                    {images.map((image, i) => (
                      <article key={image.id}>
                        <div className="admin-image-preview">
                          <img
                            src={image.thumb_url}
                            alt={image.alt_text}
                            loading="lazy"
                            width={image.width}
                            height={image.height}
                          />
                          {album.cover_thumb_url === image.thumb_url && <span>ภาพปก</span>}
                        </div>
                        <div className="admin-image-tools">
                          <strong>
                            {i + 1}. {image.alt_text || 'ไม่มี Alt text'}
                          </strong>
                          <p>
                            {image.width} × {image.height} px
                          </p>
                          <div className="button-row">
                            <button
                              aria-label="เลื่อนรูปขึ้น"
                              disabled={i === 0 || saving}
                              onClick={() => shiftImage(image, -1)}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              aria-label="เลื่อนรูปลง"
                              disabled={i === images.length - 1 || saving}
                              onClick={() => shiftImage(image, 1)}
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button onClick={() => setCover(image)}>ตั้งปก</button>
                            <button onClick={() => setImageEdit({ ...image })}>Alt</button>
                            <button
                              className="delete-icon"
                              aria-label="ลบรูปภาพ"
                              onClick={() =>
                                setDeleteTarget({
                                  entity: 'project_images',
                                  id: image.id,
                                  name: image.alt_text || 'รูปภาพนี้',
                                })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  {!images.length && <p className="empty-state">เริ่มอัปโหลดรูปแรกของอัลบั้มนี้</p>}
                </>
              )}
              {tab === 'security' && (
                <>
                  <form onSubmit={saveSettings} className="admin-panel">
                    <h2>การค้นหาและแชร์เว็บไซต์ (SEO)</h2>
                    <p className="panel-intro">
                      แก้ไขแล้วส่งผลต่อ Metadata และ JSON-LD ของหน้าเว็บทันที
                    </p>
                    <div className="admin-fields">
                      {[
                        'meta_title',
                        'meta_description',
                        'meta_keywords',
                        'canonical_url',
                        'og_image_url',
                      ].map((key) => (
                        <Field
                          key={key}
                          name={key}
                          categoryOptions={categories}
                          value={settings[key] || ''}
                          onChange={(v) => setSettings((s) => ({ ...s, [key]: String(v) }))}
                          notify={notify}
                        />
                      ))}
                    </div>
                    <button className="button green" disabled={saving || pendingImageUploads > 0}>
                      <Save size={17} />
                      บันทึก SEO
                    </button>
                  </form>
                  <section className="admin-panel backup-panel">
                    <div>
                      <h2>
                        <Download size={19} /> สำรองฐานข้อมูล
                      </h2>
                      <p>ดาวน์โหลดไฟล์ SQLite ที่สอดคล้องกันขณะระบบทำงาน ผ่าน SQLite Backup API</p>
                      <small>
                        ไฟล์นี้รวมข้อมูลและรหัสผ่านที่เข้ารหัสไว้ แต่ไม่รวมรูปภาพ ต้องสำรอง
                        storage/uploads เพิ่มเติม
                      </small>
                    </div>
                    <button className="button" onClick={backup}>
                      <Download size={17} />
                      ดาวน์โหลด .sqlite
                    </button>
                  </section>
                  <section className="admin-panel">
                    <h2>จัดการไฟล์ที่ไม่ได้ใช้งาน</h2>
                    <p className="panel-intro">
                      ลบเฉพาะรูปที่ไม่มีเนื้อหาใดอ้างอิง และอัปโหลดไว้เกิน 24 ชั่วโมง
                    </p>
                    <button
                      className="button"
                      onClick={async () => {
                        try {
                          const result = await api('/api/admin/cleanup', 'POST', {});
                          notify('ล้างรูปที่ไม่ได้ใช้งานแล้ว ' + result.removed + ' รายการ');
                        } catch (e) {
                          notify((e as Error).message, true);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      ล้างไฟล์ที่ไม่ได้ใช้งาน
                    </button>
                  </section>
                  <form className="admin-panel" onSubmit={changePassword}>
                    <h2>เปลี่ยนรหัสผ่านผู้ดูแล</h2>
                    <p className="panel-intro">
                      อย่างน้อย 12 ตัวอักษร เปลี่ยนแล้วทุก Session จะออกจากระบบ
                    </p>
                    <div className="admin-fields">
                      <label className="admin-field">
                        <span>รหัสผ่านปัจจุบัน</span>
                        <input
                          type="password"
                          required
                          autoComplete="current-password"
                          value={currentPw}
                          maxLength={256}
                          onChange={(e) => setCurrentPw(e.target.value)}
                        />
                      </label>
                      <label className="admin-field">
                        <span>รหัสผ่านใหม่</span>
                        <input
                          type="password"
                          required
                          minLength={12}
                          maxLength={256}
                          autoComplete="new-password"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                        />
                      </label>
                      <label className="admin-field">
                        <span>ยืนยันรหัสผ่านใหม่</span>
                        <input
                          type="password"
                          required
                          minLength={12}
                          maxLength={256}
                          autoComplete="new-password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                        />
                      </label>
                    </div>
                    <button className="button green" disabled={saving || pendingImageUploads > 0}>
                      <ShieldCheck size={17} />
                      เปลี่ยนรหัสผ่าน
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </main>
        <footer className="admin-footer">
          {settings.company_name_en} <span>พื้นที่ที่ดี เติบโตไปพร้อมกับคุณ</span>
        </footer>
      </div>
      {toast && (
        <div role="status" className={'admin-toast ' + (toast.error ? 'error' : '')}>
          {toast.error ? '' : <Check size={17} />} {toast.message}
          <button onClick={() => setToast(null)} aria-label="ปิดการแจ้งเตือน">
            ×
          </button>
        </div>
      )}
      {editing && (
        <Modal
          title={editing.id ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
          onClose={() => {
            if (!saving) setEditing(null);
          }}
        >
          <form className="admin-edit-form" onSubmit={saveRow}>
            <div className="admin-fields">
              {entityFields[tab].map((key) => (
                <Field
                  key={key}
                  name={key}
                  categoryOptions={categories}
                  value={editing[key] ?? ''}
                  onChange={(v) => setEditing((row) => (row ? { ...row, [key]: v } : row))}
                  bucket={
                    tab === 'hero_slides'
                      ? 'hero'
                      : tab === 'team_members'
                        ? 'team'
                        : tab === 'services'
                          ? 'services'
                          : 'sections'
                  }
                  notify={notify}
                />
              ))}
            </div>
            <button className="button green" disabled={saving || pendingImageUploads > 0}>
              <Save size={17} />
              {saving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </Modal>
      )}
      {imageEdit && (
        <Modal title="แก้ไขคำอธิบายรูปภาพ" onClose={() => setImageEdit(null)}>
          <form
            className="admin-edit-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api('/api/admin/project_images', 'PATCH', {
                  id: imageEdit.id,
                  alt_text: imageEdit.alt_text,
                  caption: imageEdit.caption,
                });
                setImageEdit(null);
                await loadImages();
                notify('บันทึกคำอธิบายแล้ว');
              } catch (e) {
                notify((e as Error).message, true);
              }
            }}
          >
            <Field
              name="alt_text"
              value={imageEdit.alt_text}
              onChange={(v) => setImageEdit((i) => (i ? { ...i, alt_text: String(v) } : i))}
              notify={notify}
            />
            <Field
              name="caption"
              value={imageEdit.caption}
              onChange={(v) => setImageEdit((i) => (i ? { ...i, caption: String(v) } : i))}
              notify={notify}
            />
            <button className="button green">
              <Save size={16} />
              บันทึก
            </button>
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="ยืนยันการลบข้อมูล" onClose={() => setDeleteTarget(null)}>
          <div className="delete-confirm">
            <Trash2 size={30} />
            <h2>ลบ “{deleteTarget.name}”?</h2>
            <p>ข้อมูลและไฟล์รูปที่เกี่ยวข้องจะถูกลบถาวร กรุณาสำรองข้อมูลก่อนดำเนินการ</p>
            <div className="button-row">
              <button
                className="button"
                disabled={saving || pendingImageUploads > 0}
                onClick={() => setDeleteTarget(null)}
              >
                ยกเลิก
              </button>
              <button
                className="button danger"
                disabled={saving || pendingImageUploads > 0}
                onClick={deleteRow}
              >
                {saving ? 'กำลังลบ…' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
