import { getAuth } from "../../../../lib/auth/server";

export async function GET(request, context) {
  return getAuth().handler().GET(request, context);
}

export async function POST(request, context) {
  return getAuth().handler().POST(request, context);
}
