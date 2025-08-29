// app/club/[id]/page.tsx
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ClubClient from "./ClubClient";

interface ClubPageProps {
  params: { id: string };
}

export default async function ClubPage({ params: { id } }: ClubPageProps) {
  const client = await clientPromise;
  const db = client.db("myappdb");

  const club = await db.collection("clubs").findOne({ _id: new ObjectId(id) });

  if (!club) return <div>Club not found</div>;

  return <ClubClient club={club} />;
}
