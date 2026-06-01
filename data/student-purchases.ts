import { db } from "@/lib/db";
import { convertCurrency, formatCurrency, getUserDisplayCurrency } from "@/lib/money";

function money(value: unknown) {
  return Number(value ?? 0);
}

export function formatMoney(amount: number, currency = "NGN") {
  return formatCurrency(amount, currency);
}

export function formatDate(value: Date | null | undefined) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export async function getStudentPurchasesDashboard(userId: string) {
  const [user, orders, enrollments] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { payoutDetails: true },
    }),
    db.purchaseOrder.findMany({
      where: { userId, type: "COURSE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        provider: true,
        providerReference: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            instructor: { select: { name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            channel: true,
            provider: true,
            paidAt: true,
            createdAt: true,
          },
        },
        refunds: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            amount: true,
            currency: true,
            createdAt: true,
          },
        },
        invoice: {
          select: {
            number: true,
            status: true,
            issuedAt: true,
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            baseCurrency: true,
            instructor: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const orderCourseIds = new Set(orders.map((order) => order.course?.id).filter(Boolean));
  const paidOrders = orders.filter((order) => order.status === "PAID" || order.status === "PARTIALLY_REFUNDED");
  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const refundOrders = orders.filter((order) => order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED" || order.refunds.length > 0);
  const displayCurrency = getUserDisplayCurrency(user, paidOrders[0]?.currency ?? orders[0]?.currency ?? "NGN");
  const convertedPaidOrders = await Promise.all(
    paidOrders.map((order) => convertCurrency(money(order.amount), order.currency, displayCurrency))
  );
  const totalSpent = convertedPaidOrders.reduce((sum, amount) => sum + amount, 0);

  const purchasedCourses = orders.map((order) => {
    const enrollment = enrollments.find((item) => item.course.id === order.course?.id);
    const latestPayment = order.payments[0];
    const latestRefund = order.refunds[0];

    return {
      id: order.id,
      courseId: order.course?.id ?? null,
      title: order.course?.title ?? "Course unavailable",
      slug: order.course?.slug ?? "",
      thumbnail: order.course?.thumbnail ?? null,
      instructorName: order.course?.instructor.name ?? "CSCN Instructor",
      status: order.status,
      accessStatus: enrollment?.status ?? (order.status === "PAID" ? "ACTIVE" : "LOCKED"),
      amount: money(order.amount),
      currency: order.currency,
      provider: order.provider ?? latestPayment?.provider ?? null,
      channel: latestPayment?.channel ?? null,
      providerReference: order.providerReference,
      purchasedAt: order.paidAt ?? latestPayment?.paidAt ?? null,
      createdAt: order.createdAt,
      paymentStatus: latestPayment?.status ?? null,
      refundStatus: latestRefund?.status ?? null,
      invoiceNumber: order.invoice?.number ?? null,
      invoiceIssuedAt: order.invoice?.issuedAt ?? null,
    };
  });

  const freeAccessCourses = enrollments
    .filter((enrollment) => !orderCourseIds.has(enrollment.course.id))
    .map((enrollment) => ({
      id: enrollment.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      thumbnail: enrollment.course.thumbnail,
      instructorName: enrollment.course.instructor.name ?? "CSCN Instructor",
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      price: money(enrollment.course.price),
      currency: enrollment.course.baseCurrency,
    }));

  const paymentHistory = orders.flatMap((order) =>
    order.payments.length > 0
      ? order.payments.map((payment) => ({
          id: `${order.id}-${payment.createdAt.toISOString()}`,
          courseTitle: order.course?.title ?? "Course unavailable",
          status: payment.status,
          amount: money(order.amount),
          currency: order.currency,
          provider: payment.provider,
          channel: payment.channel,
          date: payment.paidAt ?? payment.createdAt,
        }))
      : [
          {
            id: order.id,
            courseTitle: order.course?.title ?? "Course unavailable",
            status: order.status,
            amount: money(order.amount),
            currency: order.currency,
            provider: order.provider,
            channel: null,
            date: order.paidAt ?? order.createdAt,
          },
        ]
  );

  return {
    summary: {
      coursesPurchased: paidOrders.length,
      totalSpent,
      currency: displayCurrency,
      activeAccess: enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length,
      pendingPayments: pendingOrders.length,
      refunds: refundOrders.length,
    },
    purchasedCourses,
    freeAccessCourses,
    paymentHistory,
  };
}
