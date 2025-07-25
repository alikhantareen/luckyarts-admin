import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { like, eq, sql, desc, and } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { shops, users, customers, invoices, items, transactions } from "db/schema";
import { getUser } from "~/utils/session.server";
import { useRef, useState } from "react";

// Update relevant const on server: lib/invoice.server.ts
const PAGE_SIZE = 10;

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const searchQuery = url.searchParams.get("q") || "";
  
  let where = and(
    like(shops.name, `%${searchQuery}%`),
    sql`${shops.name} != 'Main Shop'`
  );
  
  let query = db
    .select()
    .from(shops)
    .where(where)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)
    .orderBy(desc(shops.id))
    .$dynamic();
    
  const result = await query;
  
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(shops)
    .where(where);
  
  return json({ shops: result, total });
}

export async function action({ request }: ActionArgs) {
  const user = await getUser(request);
  if (!user || user.role !== "SuperAdmin") throw redirect("/dashboard");
  const form = await request.formData();
  const action = form.get("action") as string;
  
  if (action === "delete") {
    const id = Number(form.get("id"));
    
    // Delete related records in the correct order to avoid foreign key constraint violations
    // 1. Delete transactions (references invoices and users)
    await db.delete(transactions).where(eq(transactions.shopId, id));
    
    // 2. Delete items (references invoices)
    await db.delete(items).where(eq(items.shopId, id));
    
    // 3. Delete invoices (references customers and users)
    await db.delete(invoices).where(eq(invoices.shopId, id));
    
    // 4. Delete customers (references shops)
    await db.delete(customers).where(eq(customers.shopId, id));
    
    // 5. Delete users associated with this shop
    await db.delete(users).where(eq(users.shopId, id));
    
    // 6. Finally delete the shop
    await db.delete(shops).where(eq(shops.id, id));
    
    return redirect("/dashboard/shops");
  }
  
  if (action === "create") {
    // Create new shop
    const name = form.get("name") as string;
    await db.insert(shops).values({ name });
    return redirect("/dashboard/shops");
  }
  
  if (action === "edit") {
    // Edit existing shop
    const id = Number(form.get("id"));
    const name = form.get("name") as string;
    await db.update(shops).set({ name }).where(eq(shops.id, id));
    return redirect("/dashboard/shops");
  }
  
  return redirect("/dashboard/shops");
}

export default function ShopsIndex() {
  const { shops: data, total } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const transition = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const [editingShop, setEditingShop] = useState<{ id: number; name: string } | null>(null);

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
                          to="/dashboard/shops"
                          className="ml-1 text-gray-700 hover:text-[#f3c41a] md:ml-2 dark:text-gray-300 dark:hover:text-white"
                        >
                          Shops
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
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All shops</h1>
              </div>
              <div className="sm:flex mb-2">
                <Form
                  method="get"
                  action="/dashboard/shops"
                  ref={formRef}
                  className="items-center mb-3 sm:flex sm:divide-x sm:divide-gray-100 sm:mb-0 dark:divide-gray-700"
                >
                  <div className="lg:pr-3 mb-3 sm:mb-0">
                    <label htmlFor="shops-search" className="sr-only">
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
                        id="shops-search"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submit(formRef.current);
                          }
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#f3c41a] focus:border-[#f3c41a] block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-[#f3c41a] dark:focus:border-[#f3c41a]"
                        placeholder="Search for shops"
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
                      setEditingShop(null); // Clear editing state
                      const modal = document.getElementById("createShopModal");
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
                    Add new shop
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
                          Name
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
                            There are no shops to show. Please add a new shop or change your search criteria
                          </td>
                        </tr>
                      )}
                      {data.map((shop) => (
                        <tr
                          className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            transition.state === "idle" ? "text-gray-900" : "text-gray-500"
                          }`}
                          key={shop.id}
                        >
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">#{shop.id}</td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {shop.name}
                          </td>
                          <td className="p-4 space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingShop({ id: shop.id, name: shop.name });
                                const modal = document.getElementById("createShopModal");
                                if (modal) modal.classList.remove("hidden");
                              }}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-gray-900 border border-gray-900 hover:bg-[#f3c41a] focus:ring-2 focus:ring-[#f3c41a]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                let shouldDelete = confirm("Do you want to delete this shop? This will delete all related data.");
                                if (shouldDelete) {
                                  submit({ id: shop.id, action: "delete" }, { method: "POST" });
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

      {/* Create/Edit Shop Modal */}
      <div id="createShopModal" className="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingShop ? "Edit Shop" : "Create New Shop"}
            </h3>
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById("createShopModal");
                if (modal) modal.classList.add("hidden");
                setEditingShop(null);
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
              const modal = document.getElementById("createShopModal");
              if (modal) modal.classList.add("hidden");
              setEditingShop(null);
            }}
          >
            <input type="hidden" name="action" value={editingShop ? "edit" : "create"} />
            {editingShop && <input type="hidden" name="id" value={editingShop.id} />}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
              <input 
                name="name" 
                type="text" 
                required
                defaultValue={editingShop?.name || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f3c41a] focus:border-[#f3c41a]" 
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  const modal = document.getElementById("createShopModal");
                  if (modal) modal.classList.add("hidden");
                  setEditingShop(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-[#f3c41a] border border-[#f3c41a] rounded-md hover:bg-[#f3c41a] focus:outline-none focus:ring-2 focus:ring-[#f3c41a]"
              >
                {editingShop ? "Update Shop" : "Create Shop"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
