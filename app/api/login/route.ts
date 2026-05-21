import { NextRequest, NextResponse } from "next/server";
import { findAccessByEmail } from "@/lib/sheets";
import { createSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    const access = await findAccessByEmail(email);

    if (!access) {
      return NextResponse.json(
        { message: "E-mail não encontrado ou sem acesso ativo." },
        { status: 403 }
      );
    }

    const token = await createSessionToken({
      email,
      slug: access.slug,
      transportador: access.transportador
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: `/relatorio/${access.slug}`
    });

    response.cookies.set("session_3pl", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno ao validar o acesso." },
      { status: 500 }
    );
  }
}
