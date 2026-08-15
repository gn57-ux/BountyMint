import { NextResponse } from "next/server";

import { getJob, toPublicAgentState } from "@/lib/jobs";

export async function GET(_request: Request, context: RouteContext<"/api/jobs/[jobId]">) {
  const { jobId } = await context.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    agents: job.agents.map(toPublicAgentState),
  });
}
