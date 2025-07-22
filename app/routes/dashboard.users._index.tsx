import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { like, eq } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { users, shops } from "db/schema";
import { getUser } from "~/utils/session.server";
import bcrypt from "bcryptjs";

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const rows = await db
    .select()
    .from(users)
    .where(like(users.email, `%${q}%`));
  const shopsList = await db.select().from(shops);
  return json({ users: rows, shops: shopsList });
}

export async function action({ request }: ActionArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  const shopId = Number(form.get("shopId"));
  await db.insert(users).values({ email, password: bcrypt.hashSync(password), role: "ShopAdmin", shopId });
  return redirect("/dashboard/users");
}

export default function UsersIndex() {
  const { users: data, shops } = useLoaderData<typeof loader>();
  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Form method="get">
          <input name="q" placeholder="Search" className="border p-1" />
        </Form>
        <button
          type="button"
          onClick={() => {
            const modal = document.getElementById("createUserModal");
            if (modal) modal.classList.remove("hidden");
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          New User
        </button>
      </div>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
          </tr>
        </thead>
        <tbody>
          {data.map(u => (
            <tr key={u.id}>
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div id="createUserModal" className="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded">
          <Form method="post" className="space-y-2">
            <div>
              <label>Email</label>
              <input name="email" type="email" className="border w-full" />
            </div>
            <div>
              <label>Password</label>
              <input name="password" type="password" className="border w-full" />
            </div>
            <div>
              <label>Shop</label>
              <select name="shopId" className="border w-full">
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded">Create</button>
              <button type="button" onClick={() => {
                const modal = document.getElementById("createUserModal");
                if (modal) modal.classList.add("hidden");
              }}>Close</button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
