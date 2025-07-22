import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { like, eq, and, sql, desc } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { users, shops } from "db/schema";
import { getUser } from "~/utils/session.server";
import bcrypt from "bcryptjs";
import { useRef, useState } from "react";

// Update relevant const on server: lib/invoice.server.ts
const PAGE_SIZE = 10;

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const searchQuery = url.searchParams.get("q") || "";
  
  let where = like(users.email, `%${searchQuery}%`);
  
  let query = db
    .select()
    .from(users)
    .leftJoin(shops, eq(users.shopId, shops.id))
    .where(where)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)
    .orderBy(desc(users.id))
    .$dynamic();
    
  const result = await query;
  const usersWithShops = result.map(({ users, shops }) => ({ ...users, shop: shops }));
  
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .where(where);

  const shopsList = await db.select().from(shops);
  
  return json({ users: usersWithShops, total, shops: shopsList });
}

export async function action({ request }: ActionArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  const form = await request.formData();
  const action = form.get("action") as string;
  
  if (action === "delete") {
    const id = Number(form.get("id"));
    await db.delete(users).where(eq(users.id, id));
    return redirect("/dashboard/users");
  }
  
  if (action === "create") {
    // Create new user
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const shopId = Number(form.get("shopId"));
    await db.insert(users).values({ email, password: bcrypt.hashSync(password), role: "ShopAdmin", shopId });
    return redirect("/dashboard/users");
  }
  
  if (action === "edit") {
    // Edit existing user
    const id = Number(form.get("id"));
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const shopId = Number(form.get("shopId"));
    
    const updateData: any = { email, shopId };
    
    // Only update password if a new one is provided
    if (password && password.trim() !== "") {
      updateData.password = bcrypt.hashSync(password);
    }
    
    await db.update(users).set(updateData).where(eq(users.id, id));
    return redirect("/dashboard/users");
  }
  
  return redirect("/dashboard/users");
}

export default function UsersIndex() {
  const { users: data, total, shops } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const transition = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: number; email: string; shopId: number } | null>(null);

  const page = Number(searchParams.get("page") || "1");
  const q = searchParams.get("q");

  function formatDate(inputDate: any) {
    const months: any = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const parts = inputDate.split(" ");
    const day = parts[2];
    const month = months[parts[1]];
    const year = parts[3];

    return `${day}/${month}/${year}`;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full mb-1">
              <div className="mb-4">
                <nav className="flex mb-5" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 text-sm font-medium md:space-x-2">
                    <li className="inline-flex items-center">
                      <Link
                        to="/"
                        className="inline-flex items-center text-gray-700 hover:text-[#f3c41a] dark:text-gray-300 dark:hover:text-white"
                      >
                        <svg
                          className="w-5 h-5 mr-2.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                        </svg>
                        Home
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <Link
                          to="/dashboard/users"
                          className="ml-1 text-gray-700 hover:text-[#f3c41a] md:ml-2 dark:text-gray-300 dark:hover:text-white"
                        >
                          Users
                        </Link>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500" aria-current="page">
                          List
                        </span>
                      </div>
                    </li>
                  </ol>
                </nav>
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All users</h1>
              </div>
              <div className="sm:flex mb-2">
                <Form
                  method="get"
                  action="/dashboard/users"
                  ref={formRef}
                  className="items-center mb-3 sm:flex sm:divide-x sm:divide-gray-100 sm:mb-0 dark:divide-gray-700"
                >
                  <div className="lg:pr-3 mb-3 sm:mb-0">
                    <label htmlFor="users-search" className="sr-only">
                      Search
                    </label>
                    <div className="relative lg:w-64 xl:w-96">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                          aria-hidden="true"
                          className={`w-5 h-5 ${q ? "text-[#f3c41a]" : "text-gray-400"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="q"
                        defaultValue={q || ""}
                        id="users-search"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submit(formRef.current);
                          }
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#f3c41a] focus:border-[#f3c41a] block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-[#f3c41a] dark:focus:border-[#f3c41a]"
                        placeholder="Search for users"
                      />
                      <button
                        type="submit"
                        className="absolute top-0 right-0 p-2.5 text-sm font-medium text-gray-900 bg-[#f3c41a] rounded-r-lg border border-[#f3c41a] focus:ring-2 focus:outline-none focus:ring-[#f3c41a] hover:bg-[#e6b800]"
                      >
                        <span className="px-2">Search</span>
                      </button>
                    </div>
                  </div>
                </Form>
                <div className="flex items-center ml-auto space-x-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null); // Clear editing state
                      setShowPassword(false); // Reset password visibility
                      const modal = document.getElementById("createUserModal");
                      if (modal) modal.classList.remove("hidden");
                      // Clear the form when opening modal
                      const form = modal?.querySelector('form');
                      if (form) form.reset();
                    }}
                    className="inline-flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium text-center text-gray-900 bg-[#f3c41a] rounded-lg focus:ring-2 focus:ring-[#f3c41a] hover:bg-[#e6b800] sm:w-auto"
                  >
                    <svg
                      className="w-5 h-5 mr-2 -ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Add new user
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-600">
                    <thead className="bg-gray-900 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Role
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Shop
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {data.length === 0 && (
                        <tr>
                          <td colSpan={100} className="w-full text-gray-500 text-sm p-4 sm:p-6 text-center">
                            There are no users to show. Please add a new user or change your search criteria
                          </td>
                        </tr>
                      )}
                      {data.map((user) => (
                        <tr
                          className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            transition.state === "idle" ? "text-gray-900" : "text-gray-500"
                          }`}
                          key={user.id}
                        >
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">#{user.id}</td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {user.email}
                          </td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {user.role}
                          </td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {user.shop?.name || "N/A"}
                          </td>
                          <td className="p-4 space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser({ id: user.id, email: user.email, shopId: user.shopId || 0 });
                                setShowPassword(false); // Reset password visibility
                                const modal = document.getElementById("createUserModal");
                                if (modal) modal.classList.remove("hidden");
                              }}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-gray-900 border border-gray-900 hover:bg-[#f3c41a] focus:ring-2 focus:ring-[#f3c41a]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                let shouldDelete = confirm("Do you want to delete this user?");
                                if (shouldDelete) {
                                  submit({ id: user.id, action: "delete" }, { method: "POST" });
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg border-gray-900 border hover:bg-red-400 focus:ring-2 focus:ring-[#f3c41a]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="items-center w-full p-4 bg-white border-t border-gray-200 sm:flex sm:justify-between dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center mb-4 sm:mb-0">
              <button
                className="inline-flex justify-center p-1 text-gray-500 rounded cursor-pointer disabled:opacity-50 disabled:hover:text-gray-500 disabled:cursor-default hover:text-gray-900"
                onClick={() => {
                  searchParams.set("page", (page - 1).toString());
                  setSearchParams(searchParams);
                }}
                disabled={page === 1}
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
              <button
                className="inline-flex justify-center p-1 text-gray-500 rounded cursor-pointer disabled:opacity-50 disabled:hover:text-gray-500 disabled:cursor-default hover:text-gray-900"
                onClick={() => {
                  searchParams.set("page", (page + 1).toString());
                  setSearchParams(searchParams);
                }}
                disabled={page === Math.ceil(total / PAGE_SIZE)}
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {`${Math.min((page - 1) * PAGE_SIZE + 1, total)}-${Math.min(page * PAGE_SIZE, total)}`}
                </span>{" "}
                of <span className="font-semibold text-gray-900 dark:text-white">{`${total}`}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <div id="createUserModal" className="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingUser ? "Edit User" : "Create New User"}
            </h3>
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById("createUserModal");
                if (modal) modal.classList.add("hidden");
                setEditingUser(null);
                setShowPassword(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Form 
            method="post" 
            className="space-y-4"
            onSubmit={() => {
              // Close modal when form is submitted
              const modal = document.getElementById("createUserModal");
              if (modal) modal.classList.add("hidden");
              setEditingUser(null);
              setShowPassword(false);
            }}
          >
            <input type="hidden" name="action" value={editingUser ? "edit" : "create"} />
            {editingUser && <input type="hidden" name="id" value={editingUser.id} />}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                name="email" 
                type="email" 
                required
                defaultValue={editingUser?.email || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f3c41a] focus:border-[#f3c41a]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingUser && "(leave blank to keep current)"}
              </label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  required={!editingUser}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f3c41a] focus:border-[#f3c41a]" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
              <select 
                name="shopId" 
                required
                defaultValue={editingUser?.shopId || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f3c41a] focus:border-[#f3c41a]"
              >
                <option value="">Select a shop</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  const modal = document.getElementById("createUserModal");
                  if (modal) modal.classList.add("hidden");
                  setEditingUser(null);
                  setShowPassword(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-[#f3c41a] border border-[#f3c41a] rounded-md hover:bg-[#f3c41a] focus:outline-none focus:ring-2 focus:ring-[#f3c41a]"
              >
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
