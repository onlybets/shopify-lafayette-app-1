import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return json({ active: false, error: "Missing shop parameter" }, { status: 400 });
  }

  const subscription = await db.subscription.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  const active = !!subscription && subscription.status === "ACTIVE";
  return json({ active });
};
