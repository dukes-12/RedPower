import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedPower — Simulateur Reddit Ads",
  description: "Analysez une entreprise en temps réel, trouvez ses communautés Reddit, générez et simulez vos campagnes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("rp-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
