import { NextResponse, type NextRequest } from "next/server";
import {
  buildDailyReport,
  isReportKind,
  reportFilename,
} from "@/lib/reports/daily";
import { getPcmsReadModel } from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const resolvedParams = await params;

  if (!isReportKind(resolvedParams.kind)) {
    return NextResponse.json(
      { error: "Unknown report kind." },
      { status: 404 },
    );
  }

  const readModel = await getPcmsReadModel();
  const csv = buildDailyReport(resolvedParams.kind, readModel);

  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${reportFilename(resolvedParams.kind)}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
