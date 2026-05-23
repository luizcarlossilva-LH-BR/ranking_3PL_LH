import { NextRequest, NextResponse } from "next/server";
import { getMonthlyBySlug, getRankingBySlug, makeSlug } from "@/lib/sheets";
import { getSessionFromCookies } from "@/lib/session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const session = await getSessionFromCookies();

    if (!session || makeSlug(session.slug) !== makeSlug(slug)) {
      return NextResponse.json(
        { message: "Acesso não autorizado para esta transportadora." },
        { status: 403 }
      );
    }

    const ranking = await getRankingBySlug(slug);
    const mensal = await getMonthlyBySlug(slug);

    if (!ranking) {
      return NextResponse.json(
        { message: "Transportadora não encontrada na aba ranking." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ranking, mensal });
  } catch (error) {
    console.error("Erro na API transportador:", error);
    return NextResponse.json(
      { message: "Erro ao carregar dados." },
      { status: 500 }
    );
  }
}
