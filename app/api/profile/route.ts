import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { logProfileError } from "@/lib/profile-errors";
import { profileUpdateSchema } from "@/lib/profile-schema";
import { authEmailSchema } from "@/lib/auth-schema";

const profileFields = {
  username: true,
  email: true,
  fullName: true,
  avatarUrl: true,
} as const;

const privateHeaders = { "Cache-Control": "private, no-store" };
class EmailInUseError extends Error {}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const profile = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: profileFields,
    });

    return NextResponse.json(profile, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    logProfileError("[GET /api/profile] Falha ao buscar o perfil", error);
    return NextResponse.json({ error: "Falha ao buscar o perfil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
      }
      throw error;
    }

    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Dados do perfil inválidos" }, { status: 400 });
    }

    const { username, email, fullName, avatarUrl } = result.data;
    if (email !== undefined && !authEmailSchema.safeParse(email).success) {
      return NextResponse.json({ error: "Informe um e-mail de login válido" }, { status: 400 });
    }
    const profile = await prisma.$transaction(async (tx) => {
      if (email !== undefined) {
        try {
          await tx.credential.update({ where: { userId }, data: { email } });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new EmailInUseError();
          }
          throw error;
        }
      }
      return tx.user.update({
        where: { id: userId },
        data: {
          ...(username !== undefined && { username: username || null }),
          ...(email !== undefined && { email }),
          ...(fullName !== undefined && { fullName: fullName || null }),
          ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
        },
        select: profileFields,
      });
    });

    return NextResponse.json(profile, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    if (error instanceof EmailInUseError) {
      return NextResponse.json({ error: "E-mail já está em uso", field: "email" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Nome de usuário já está em uso" }, { status: 409 });
    }
    logProfileError("[PATCH /api/profile] Falha ao atualizar o perfil", error);
    return NextResponse.json({ error: "Falha ao atualizar o perfil" }, { status: 500 });
  }
}
