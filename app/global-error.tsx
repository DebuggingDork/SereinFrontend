"use client";

// The last resort, when the root layout itself fails. It has no stylesheet or fonts to lean
// on, so everything here is inline.
export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          padding: "0 2rem",
          background: "#f6f5f1",
          color: "#14171a",
          fontFamily: "Georgia, serif",
        }}
      >
        <main style={{ maxWidth: "36rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: 400, margin: 0 }}>Something broke.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "1.125rem", lineHeight: 1.6, color: "#55585c" }}>
            Serein could not start, but your data is safe. Reloading usually does it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              border: 0,
              borderRadius: 999,
              background: "#14171c",
              color: "#f6f5f1",
              fontFamily: "system-ui, sans-serif",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Reload Serein
          </button>
        </main>
      </body>
    </html>
  );
}
