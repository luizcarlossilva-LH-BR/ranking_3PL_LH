import { NextRequest, NextResponse } from "next/server";
import { findXptAccessByCpf } from "@/lib/sheets";
import { createSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cpf = String(body?.cpf || "").replace(/\D/g, "");

    if (!cpf) {
      return NextResponse.json(
        { message: "Informe o CPF cadastrado." },
        { status: 400 }
      );
    }

    const access = await findXptAccessByCpf(cpf);

    if (!access) {
      return NextResponse.json(
        { message: "CPF não encontrado ou sem acesso ativo para XPT." },
        { status: 403 }
      );
    }

    const token = await createSessionToken({
      cpf,
      slug: access.slug,
      transportador: access.transportador
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: `/xpt/${access.slug}`
    });

    response.cookies.set("session_xpt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    console.error("Erro no login XPT:", error);
    return NextResponse.json(
      { message: "Erro interno ao validar o acesso XPT." },
      { status: 500 }
    );
  }
}
