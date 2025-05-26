import { PrismaClient } from "@prisma/client";
import sgMail from "@sendgrid/mail";

const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

async function main() {
  const now = new Date();
  // Find subscriptions that are expired or expiring soon (e.g., within 1 day)
  const expiring = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      // Add your own logic for expiration, e.g., currentPeriodEnd < now + 1 day
      // For demo, just select all ACTIVE
    },
  });

  for (const sub of expiring) {
    // Mark as overdue if needed (add your own expiration logic)
    // await prisma.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });

    // Send notification email
    if (process.env.SENDGRID_TO_EMAIL) {
      await sgMail.send({
        to: process.env.SENDGRID_TO_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@lafayette-app.com",
        subject: "Subscription Expiring Soon",
        text: `Subscription for shop ${sub.shop} is expiring soon or overdue.`,
      });
    }
  }
  console.log("Checked expiring subscriptions and sent notifications.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
