import "./globals.css";

export const metadata = {
  title: "ClyraHealth",
  description: "Gestão inteligente para profissionais da saúde"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
