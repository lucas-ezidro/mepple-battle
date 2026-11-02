import { Suspense } from "react";
import { PublicProfile } from "@/components/social/public-profile";

async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <PublicProfile id={(await params).id} />;
}

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p role="status" className="p-4">Carregando perfil...</p>}>
    <ProfilePage params={params} />
  </Suspense>;
}
