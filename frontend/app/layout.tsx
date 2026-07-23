import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Importando os estilos originais do jogo salvos na pasta public
import "../public/css/canvas.css";
import "../public/css/login.css";
import "../public/css/window.css";
import "../public/css/equipment.css";
import "../public/css/chatbox.css";
import "../public/css/hotbar.css";
import "../public/css/minimap.css";
import "../public/css/modal.css";
import "../public/css/slot.css";
import "../public/css/skillwindow.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forby HTML5 Open Tibia Client",
  description: "Cliente Tibia adaptado para Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}