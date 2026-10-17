"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f3eee3",
          color: "#16233f",
          fontFamily: "Vazirmatn, Tahoma, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "30rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0 }}>
            بایگانی موقتاً در دسترس نیست
          </h1>
          <p style={{ lineHeight: 2.1, color: "#5c6784" }}>
            خطایی در سمت سرور رخ داده است. چند لحظه بعد دوباره تلاش کنید.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "12px",
              border: "1px solid #16233f",
              background: "#16233f",
              color: "#fbf8f1",
              padding: "10px 22px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
