import { NextRequest, NextResponse } from "next/server";
import { findHibridoAccessByCpf } from "@/lib/sheets";
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

    const access = await findHibridoAccessByCpf(cpf);

    if (!access) {
      return NextResponse.json(
        { message: "CPF nao encontrado ou sem acesso ativo para Hibrido." },
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
      redirectTo: `/hibrido/${access.slug}`
    });

    response.cookies.set("session_hibrido", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    console.error("Erro no login Hibrido:", error);
    return NextResponse.json(
      { message: "Erro interno ao validar o acesso Hibrido." },
      { status: 500 }
    );
  }
}
