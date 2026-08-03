import { NextResponse } from "next/server";

import { getLearnerInsightExportRows } from "@/data/learner-insights";
import { requireAnyAdminPermission } from "@/lib/admin-guards";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET() {
  await requireAnyAdminPermission(["canManageLearners", "canManageMarketing", "canViewAnalytics"]);
  const rows = await getLearnerInsightExportRows();
  const headers = [
    "Name",
    "Email",
    "Cohort",
    "Pioneer Joined At",
    "Interest Areas",
    "Skill Level",
    "Primary Goal",
    "Learning Style",
    "Note",
    "Submitted At",
    "Updated At",
  ];

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => [
      row.name,
      row.email,
      row.cohort,
      row.pioneerJoinedAt,
      row.interestAreas,
      row.skillLevel,
      row.primaryGoal,
      row.learningStyle,
      row.note,
      row.submittedAt,
      row.updatedAt,
    ].map(csvCell).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cscn-learner-insights.csv"',
    },
  });
}
