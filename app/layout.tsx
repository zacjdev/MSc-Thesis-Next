// app/layout.tsx
import React from "react";
import Container from "./core/container.tsx";
import Nav from "./core/nav.tsx";
import './globals.css'

export const metadata = {
  title: "My App",
  description: "This is a Next.js App Router example",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* This logic runs/wraps all pages */}
        <Nav> </Nav>
        <Container>
          {children}
        </Container>
      </body>
    </html>
  );
}
