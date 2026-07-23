import type { Metadata } from "next";
import { Inter } from "next/font/google";

// 🚪 Carrega estritamente o visual necessário para o login e modais básicos
import "./css/login.css";
import "./css/modal.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forby Client — Autenticação",
  description: "Portal de entrada e seleção de personagens",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${inter.className} w-full h-full min-h-screen bg-neutral-950 text-stone-200 flex flex-col justify-center items-center overflow-hidden select-none antialiased`}
      style={{ margin: 0, padding: 0 }}
    >
      {/* Container flexível para centralizar e alinhar perfeitamente os modais */}
      <div id="login-layout-wrapper" className="relative w-full max-w-md px-4 flex flex-col items-center justify-center animate-fade-in">
        {children}
      </div>
    </div>
  );
}