import type { Metadata } from "next";
import { Toaster } from "sonner";
import AuthProvider from "@/lib/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entoto Peacock Manpower Follow-Up Sheet",
  description: "Staff and DL attendance tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
