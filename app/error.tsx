'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>ไม่สามารถโหลดหน้าได้ชั่วคราว</h1>
      <p>กรุณาลองอีกครั้ง หรือติดต่อผู้ดูแลเว็บไซต์</p>
      <button className="button" onClick={reset}>
        ลองอีกครั้ง
      </button>
    </main>
  );
}
