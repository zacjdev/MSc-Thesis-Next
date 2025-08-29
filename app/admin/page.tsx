import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ManageClubsEventsGames from './ManageClubsEventsGames';
import ManageArticlesSports from './ManageArticlesSports';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {session.user?.email}</h1>
      < ManageClubsEventsGames />
      <ManageArticlesSports />
    </div>
  );
}
