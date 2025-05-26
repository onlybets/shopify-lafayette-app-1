import { json, type LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";

// GET /api/storefront-settings?shop=shop-domain.myshopify.com
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }
  const settings = await db.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    return json({ data: { isEnabled: false } });
  }
  return json({ data: settings });
}
