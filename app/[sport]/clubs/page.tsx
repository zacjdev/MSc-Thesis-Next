// app/[sport]/home/page.tsx
import ClientClubsPage from "./ClientClubsPage";

export default async function HomePage({ params }: { params: Promise<{ sport: string }> }) {
  const resolvedParams = await params;
  const sport = resolvedParams.sport;
  return <ClientClubsPage sport={sport} />;
}
