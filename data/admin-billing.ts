import { db } from "@/lib/db";
import { convertCurrency, getUserDisplayCurrency } from "@/lib/money";

function money(value: unknown) {
  return Number(value ?? 0);
}

async function convertSummaryAmount(amount: number, displayCurrency: string, sourceCurrency = "NGN") {
  return convertCurrency(amount, sourceCurrency, displayCurrency);
}

export async function releaseEligibleInstructorEarnings(instructorId?: string) {
  return db.instructorEarning.updateMany({
    where: {
      status: "PENDING",
      holdUntil: { lte: new Date() },
      ...(instructorId ? { instructorId } : {}),
    },
    data: {
      status: "AVAILABLE",
      availableAt: new Date(),
    },
  });
}

export async function getAdminBillingOverview(adminId?: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const admin = adminId
    ? await db.user.findUnique({ where: { id: adminId }, select: { payoutDetails: true } })
    : null;
  const displayCurrency = getUserDisplayCurrency(admin, "NGN");

  const [
    paidOrders,
    monthOrders,
    pendingOrders,
    failedPayments,
    pendingPayouts,
    availableEarnings,
    refunds,
    recentOrders,
    recentPayoutRequests,
  ] = await Promise.all([
    db.purchaseOrder.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.purchaseOrder.aggregate({
      where: { status: "PAID", paidAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.purchaseOrder.count({ where: { status: "PENDING" } }),
    db.payment.count({ where: { status: "FAILED" } }),
    db.payoutRequest.aggregate({
      where: { status: "REQUESTED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.instructorEarning.aggregate({
      where: { status: "AVAILABLE" },
      _sum: { instructorAmount: true },
    }),
    db.refund.aggregate({
      where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        provider: true,
        paidAt: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    db.payoutRequest.findMany({
      orderBy: { requestedAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        payoutMethod: true,
        payoutDetails: true,
        requestedAt: true,
        instructor: { select: { name: true, email: true, payoutSetup: true } },
      },
    }),
  ]);

  const grossRevenue = money(paidOrders._sum.amount);
  const monthRevenue = money(monthOrders._sum.amount);
  const pendingPayoutAmount = money(pendingPayouts._sum.amount);
  const availableInstructorBalance = money(availableEarnings._sum.instructorAmount);
  const openRefundAmount = money(refunds._sum.amount);

  return {
    summary: {
      displayCurrency,
      grossRevenue: await convertSummaryAmount(grossRevenue, displayCurrency),
      monthRevenue: await convertSummaryAmount(monthRevenue, displayCurrency),
      paidOrders: paidOrders._count.id,
      monthOrders: monthOrders._count.id,
      pendingOrders,
      failedPayments,
      pendingPayouts: pendingPayouts._count.id,
      pendingPayoutAmount: await convertSummaryAmount(pendingPayoutAmount, displayCurrency),
      availableInstructorBalance: await convertSummaryAmount(availableInstructorBalance, displayCurrency),
      openRefunds: refunds._count.id,
      openRefundAmount: await convertSummaryAmount(openRefundAmount, displayCurrency),
      estimatedPlatformRevenue: await convertSummaryAmount(Math.max(0, grossRevenue * 0.2), displayCurrency),
    },
    recentOrders: recentOrders.map((order) => ({
      ...order,
      amount: money(order.amount),
    })),
    recentPayoutRequests: recentPayoutRequests.map((request) => ({
      ...request,
      amount: money(request.amount),
    })),
  };
}

export async function getInstructorEarningsSummary(instructorId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [instructor, lifetime, monthly, available, pending, requested, recent] = await Promise.all([
    db.user.findUnique({ where: { id: instructorId }, select: { payoutDetails: true } }),
    db.instructorEarning.aggregate({
      where: { instructorId, status: { not: "REVERSED" } },
      _sum: { instructorAmount: true },
    }),
    db.instructorEarning.aggregate({
      where: { instructorId, createdAt: { gte: monthStart }, status: { not: "REVERSED" } },
      _sum: { instructorAmount: true },
    }),
    db.instructorEarning.aggregate({
      where: { instructorId, status: "AVAILABLE" },
      _sum: { instructorAmount: true },
    }),
    db.instructorEarning.aggregate({
      where: { instructorId, status: "PENDING" },
      _sum: { instructorAmount: true },
    }),
    db.payoutRequest.aggregate({
      where: { instructorId, status: { in: ["REQUESTED", "APPROVED"] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.instructorEarning.findMany({
      where: { instructorId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        instructorAmount: true,
        grossAmount: true,
        platformFee: true,
        currency: true,
        status: true,
        createdAt: true,
        course: { select: { title: true } },
      },
    }),
  ]);
  const displayCurrency = getUserDisplayCurrency(instructor, "NGN");

  return {
    lifetime: await convertCurrency(money(lifetime._sum.instructorAmount), "NGN", displayCurrency),
    thisMonth: await convertCurrency(money(monthly._sum.instructorAmount), "NGN", displayCurrency),
    available: await convertCurrency(money(available._sum.instructorAmount), "NGN", displayCurrency),
    pending: await convertCurrency(money(pending._sum.instructorAmount), "NGN", displayCurrency),
    requested: await convertCurrency(money(requested._sum.amount), "NGN", displayCurrency),
    payoutRequestCount: requested._count.id,
    threshold: await convertCurrency(5000, "NGN", displayCurrency),
    displayCurrency,
    recent: recent.map((earning) => ({
      ...earning,
      instructorAmount: money(earning.instructorAmount),
      grossAmount: money(earning.grossAmount),
      platformFee: money(earning.platformFee),
    })),
  };
}

export async function getInstructorEarningsDetail(instructorId: string) {
  const summary = await getInstructorEarningsSummary(instructorId);
  const [earnings, payoutRequests] = await Promise.all([
    db.instructorEarning.findMany({
      where: { instructorId, status: { not: "REVERSED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        courseId: true,
        grossAmount: true,
        platformFee: true,
        instructorAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        availableAt: true,
        paidAt: true,
        course: { select: { title: true, slug: true, thumbnail: true } },
        order: { select: { id: true, paidAt: true, user: { select: { name: true, email: true } } } },
      },
    }),
    db.payoutRequest.findMany({
      where: { instructorId },
      orderBy: { requestedAt: "desc" },
      take: 12,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        payoutMethod: true,
        requestedAt: true,
        reviewedAt: true,
        adminNote: true,
      },
    }),
  ]);

  const courseMap = new Map<
    string,
    {
      courseId: string;
      title: string;
      slug: string;
      lifetime: number;
      available: number;
      pending: number;
      requested: number;
      paid: number;
      sales: number;
    }
  >();

  for (const earning of earnings) {
    const key = earning.courseId ?? "unknown-course";
    const current = courseMap.get(key) ?? {
      courseId: key,
      title: earning.course?.title ?? "Course",
      slug: earning.course?.slug ?? "",
      lifetime: 0,
      available: 0,
      pending: 0,
      requested: 0,
      paid: 0,
      sales: 0,
    };
    const amount = await convertCurrency(money(earning.instructorAmount), earning.currency, summary.displayCurrency);
    current.lifetime += amount;
    current.sales += 1;
    if (earning.status === "AVAILABLE") current.available += amount;
    if (earning.status === "PENDING") current.pending += amount;
    if (earning.status === "REQUESTED") current.requested += amount;
    if (earning.status === "PAID") current.paid += amount;
    courseMap.set(key, current);
  }

  const recentEarnings = await Promise.all(
    earnings.slice(0, 12).map(async (earning) => ({
      id: earning.id,
      courseTitle: earning.course?.title ?? "Course",
      learnerName: earning.order?.user.name ?? earning.order?.user.email ?? "Learner",
      status: earning.status,
      createdAt: earning.createdAt,
      availableAt: earning.availableAt,
      paidAt: earning.paidAt,
      grossAmount: await convertCurrency(money(earning.grossAmount), earning.currency, summary.displayCurrency),
      platformFee: await convertCurrency(money(earning.platformFee), earning.currency, summary.displayCurrency),
      instructorAmount: await convertCurrency(money(earning.instructorAmount), earning.currency, summary.displayCurrency),
    }))
  );

  const payoutHistory = await Promise.all(
    payoutRequests.map(async (request) => ({
      ...request,
      amount: await convertCurrency(money(request.amount), request.currency, summary.displayCurrency),
    }))
  );

  return {
    summary,
    courseBreakdown: Array.from(courseMap.values()).sort((a, b) => b.lifetime - a.lifetime),
    recentEarnings,
    payoutHistory,
  };
}
