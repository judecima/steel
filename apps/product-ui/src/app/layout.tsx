import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import StyledJsxRegistry from "@/lib/registry";

export const metadata: Metadata = {
  title: "Steel Frame — Product UI",
  description: "Next Generation UI for Steel Frame Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <StyledJsxRegistry>
          <AppShell>{children}</AppShell>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
