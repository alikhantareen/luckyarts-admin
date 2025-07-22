import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { like } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { shops } from "db/schema";
import { getUser } from "~/utils/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const rows = await db.select().from(shops).where(like(shops.name, `%${q}%`));
  return json({ shops: rows });
}

export async function action({ request }: ActionArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  const form = await request.formData();
  const name = form.get("name") as string;
  await db.insert(shops).values({ name });
  return redirect("/dashboard/shops");
}

export default function ShopsIndex() {
  const { shops: data } = useLoaderData<typeof loader>();
  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Form method="get">
          <input name="q" placeholder="Search" className="border p-1" />
        </Form>
        <button
          type="button"
          onClick={() => {
            const modal = document.getElementById("createShopModal");
            if (modal) modal.classList.remove("hidden");
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          New Shop
        </button>
      </div>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.id}>
              <td className="border p-2">{s.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div id="createShopModal" className="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded">
          <Form method="post" className="space-y-2">
            <div>
              <label>Name</label>
              <input name="name" type="text" className="border w-full" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded">Create</button>
              <button type="button" onClick={() => {
                const modal = document.getElementById("createShopModal");
                if (modal) modal.classList.add("hidden");
              }}>Close</button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
