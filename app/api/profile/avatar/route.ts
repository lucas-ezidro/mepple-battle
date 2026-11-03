import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { logProfileError } from "@/lib/profile-errors";
import { InvalidAvatarFileError, uploadProfileAvatar } from "@/lib/cloudinary";

const profileFields = {
  username: true,
  email: true,
  fullName: true,
  avatarUrl: true,
} as const;

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const avatarUrl = await uploadProfileAvatar(file, userId);
    const profile = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: profileFields,
    });

    return NextResponse.json(profile, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    if (error instanceof InvalidAvatarFileError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logProfileError("[POST /api/profile/avatar] Falha ao enviar a foto de perfil", error);
    return NextResponse.json({ error: "Falha ao enviar a foto de perfil" }, { status: 500 });
  }
}
