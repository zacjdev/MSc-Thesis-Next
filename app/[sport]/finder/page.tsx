// app/[sport]/home/page.tsx
import ClientHomePage from "./ClientHomePage";

export default async function HomePage({ params }: { params: Promise<{ sport: string }> }) {
  const resolvedParams = await params;
  const sport = resolvedParams.sport;
  return <ClientHomePage sport={sport} />;
}
