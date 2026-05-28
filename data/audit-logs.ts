import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export interface AuditLogInput {
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  page?: number;
  query?: string;
  action?: string;
  entityType?: string;
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    return await db.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityName: input.entityName ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
    return null;
  }
}

export async function getAdminAuditLogs(filters: AuditLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 25;
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.action && filters.action !== "all") {
    where.action = filters.action;
  }
  if (filters.entityType && filters.entityType !== "all") {
    where.entityType = filters.entityType;
  }
  if (filters.query) {
    where.OR = [
      { actorName: { contains: filters.query, mode: "insensitive" } },
      { actorEmail: { contains: filters.query, mode: "insensitive" } },
      { action: { contains: filters.query, mode: "insensitive" } },
      { entityType: { contains: filters.query, mode: "insensitive" } },
      { entityName: { contains: filters.query, mode: "insensitive" } },
      { entityId: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  const [logs, total, actionRows, entityRows] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["action"], _count: { action: true }, orderBy: { _count: { action: "desc" } } }),
    db.auditLog.groupBy({ by: ["entityType"], _count: { entityType: true }, orderBy: { _count: { entityType: "desc" } } }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    actionOptions: actionRows.map((row) => ({ value: row.action, label: row.action, count: row._count.action })),
    entityOptions: entityRows.map((row) => ({ value: row.entityType, label: row.entityType, count: row._count.entityType })),
  };
}
