import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { initDropdowns } from "flowbite";
import { useEffect, useRef } from "react";
import { db } from "~/utils/db.server";
import { eq, inArray, and, sql, desc, like, or } from "drizzle-orm";
import { getUser } from "~/utils/session.server";
import { InvoiceStatus, InvoiceWorkStatus, customers, invoices, items, transactions } from "db/schema";

// Update relavant const on server: lib/invoice.server.ts
const PAGE_SIZE = 10;

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const id = Number(formData.get("id"));
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  await db.delete(items).where(eq(items.invoiceId, id));
  await db.delete(transactions).where(eq(transactions.invoiceId, id));
  await db
    .delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.shopId, user.shopId!)));
  return redirect(`/dashboard/quotations`);
};

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  const url = new URL(request.url);
  let statusFilters = url.searchParams.getAll("status") as InvoiceStatus[];
  if (statusFilters.length === 0) {
    statusFilters = ["Unpaid", "PartialPaid", "FullyPaid", "Archived"];
  }
  let workStatus = url.searchParams.getAll("workStatus") as InvoiceWorkStatus[];
  if (workStatus.length === 0) {
    workStatus = ["Pending", "InProgress", "Completed"];
  }
  const page = Number(url.searchParams.get("page") || "1");
  const searchQuery = url.searchParams.get("q") || "";
  const invoiceId = searchQuery.startsWith("#") && parseInt(searchQuery.slice(1));

  let where = and(
    eq(invoices.shopId, user.shopId!),
    eq(invoices.type, "Quotation"),
    inArray(invoices.status, statusFilters),
    inArray(invoices.workStatus, workStatus),
    or(like(customers.name, `%${searchQuery}%`), like(customers.phone, `%${searchQuery}%`))
  );
  if (invoiceId) {
    where = eq(invoices.id, invoiceId);
  }
  let query = db
    .select()
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(where)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)
    .orderBy(desc(invoices.createdAt))
    .$dynamic();
  const anotherResult = await query;
  const kk = anotherResult.map(({ invoices, customers }) => ({ ...invoices, customer: customers }));
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(where);

  return json({ invoices: kk, total });
}

export default function QuotationsIndexRoute() {
  // @ts-ignore: https://github.com/remix-run/remix/issues/3931
  const { invoices, total } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const transition = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  const page = Number(searchParams.get("page") || "1");
  const status = searchParams.getAll("status");
  const workStatus = searchParams.getAll("workStatus");
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

  useEffect(() => {
    if (typeof window !== "undefined") initDropdowns();
  }, []);

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
                          to="/dashboard/quotations"
                          className="ml-1 text-gray-700 hover:text-[#f3c41a] md:ml-2 dark:text-gray-300 dark:hover:text-white"
                        >
                          Quotations
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
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All quotations</h1>
              </div>
              <div className="sm:flex mb-2">
                <Form
                  method="get"
                  action="/dashboard/quotations"
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
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#f3c41a] focus:border-[#f3c41a] block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-[#f3c41a] dark:focus:border-[#f3c41a]"
                        placeholder="Search for quotations"
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
                  <Link
                    to="new"
                    className="inline-flex items-center justify-center w-full  px-3 py-2.5 text-sm font-medium text-center text-gray-900 bg-[#f3c41a] rounded-lg focus:ring-2 focus:ring-[#f3c41a] hover:bg-[#e6b800] sm:w-auto"
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
                    Add new quotation
                  </Link>
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
                          Quotation Number
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Customer Name
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Customer Phone
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                        >
                          Total Amount
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
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={100} className="w-full text-gray-500 text-sm p-4 sm:p-6 text-center">
                            There are no quotations to show. Please add a new quotation or change your search/filter criteria
                          </td>
                        </tr>
                      )}
                      {invoices.map((invoice) => (
                        <tr
                          className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            transition.state === "idle" ? "text-gray-900" : "text-gray-500"
                          }`}
                          key={invoice.id}
                        >
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">#{invoice.id}</td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {formatDate(new Date(invoice.createdAt!).toDateString())}
                          </td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {invoice.customer.name}
                          </td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {invoice.customer.phone}
                          </td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            Rs. {invoice.totalAmount}
                          </td>
                          <td className="p-4 space-x-2 whitespace-nowrap">
                            <Link to={`/dashboard/quotations/${invoice.id}`}>
                              <button
                                type="button"
                                id="updateProductButton"
                                data-drawer-target="drawer-update-product-default"
                                data-drawer-show="drawer-update-product-default"
                                aria-controls="drawer-update-product-default"
                                data-drawer-placement="right"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-gray-900 border border-gray-900 hover:bg-[#f3c41a] focus:ring-2 focus:ring-[#f3c41a]"
                              >
                                See details
                              </button>
                            </Link>
                            <Link to={`/dashboard/quotations/edit/${invoice.id}`}>
                              <button
                                type="button"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-gray-900 border border-gray-900 hover:bg-[#f3c41a] focus:ring-2 focus:ring-[#f3c41a]"
                              >
                                Edit
                              </button>
                            </Link>
                            <button
                              onClick={() => {
                                let shouldDelete = confirm("Do you want to delete the quotation?");
                                if (shouldDelete) {
                                  submit({ id: invoice.id }, { method: "DELETE" });
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
    </div>
  );
}
