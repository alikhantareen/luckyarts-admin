import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { initDropdowns } from "flowbite";
import { useEffect, useRef } from "react";
import { db } from "~/utils/db.server";
import { eq, inArray, and, sql, desc, like, or } from "drizzle-orm";
import { InvoiceStatus, InvoiceWorkStatus, customers, invoices } from "db/schema";

// Update relavant const on server: lib/invoice.server.ts
const PAGE_SIZE = 5;

export async function loader({ request }: LoaderArgs) {
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

export default function InvoicesIndexRoute() {
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
    <div>
      <div className="p-4 bg-white block sm:flex items-center justify-between border-b border-gray-200 lg:mt-1.5 dark:bg-gray-800 dark:border-gray-700">
        <div className="w-full mb-1">
          <div className="mb-4">
            <nav className="flex mb-5" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 text-sm font-medium md:space-x-2">
                <li className="inline-flex items-center">
                  <Link
                    to="/"
                    className="inline-flex items-center text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white"
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
                      to="/dashboard/invoices"
                      className="ml-1 text-gray-700 hover:text-primary-600 md:ml-2 dark:text-gray-300 dark:hover:text-white"
                    >
                      Invoices
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
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All invoices</h1>
          </div>
          <div className="sm:flex mb-2">
            <Form
              method="get"
              action="/dashboard/invoices"
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
                      className={`w-5 h-5 ${q ? "text-blue-700" : "text-gray-400"}`}
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
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Search for invoices"
                  />
                  <button
                    type="submit"
                    className="absolute top-0 right-0 p-2.5 text-sm font-medium text-slate-900 bg-[#f3c41a] rounded-r-lg border border-[#f3c41a] focus:ring-2 focus:outline-none focus:ring-slate-900 dark:bg-[#f3c41a] dark:hover:bg-[#f3c41a] dark:focus:ring-[#f3c41a]"
                  >
                    <span className="px-2">Search</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center w-full space-x-4 md:w-auto ">
                <button
                  id="filterDropdownButton"
                  data-dropdown-toggle="filterDropdown"
                  className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg md:w-auto focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w2.org/2000/svg"
                    aria-hidden="true"
                    className={`w-5 h-4 mr-2 ${status.length === 0 ? "text-gray-400" : "text-[#f3c41a]"}`}
                    viewBox="-1 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Invoice Status
                  <svg
                    className="-mr-2 ml-1.5 w-5 h-5"
                    fill="currentColor"
                    viewBox="-1 0 20 20"
                    xmlns="http://www.w2.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M4.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    />
                  </svg>
                </button>
                <div id="filterDropdown" className="z-10 hidden w-48 p-3 bg-white rounded-lg shadow dark:bg-gray-700">
                  <h5 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Status</h5>
                  <ul className="space-y-3 text-sm" aria-labelledby="dropdownDefault">
                    <li className="flex items-center">
                      <input
                        id="Unpaid"
                        type="checkbox"
                        value="Unpaid"
                        name="status"
                        defaultChecked={status.includes("Unpaid")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor="Unpaid" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Unpaid
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="PartialPaid"
                        type="checkbox"
                        value="PartialPaid"
                        name="status"
                        defaultChecked={status.includes("PartialPaid")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label
                        htmlFor="PartialPaid"
                        className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        Partial Paid
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="FullyPaid"
                        type="checkbox"
                        value="FullyPaid"
                        name="status"
                        defaultChecked={status.includes("FullyPaid")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor="FullyPaid" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Fully Paid
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="Archived"
                        type="checkbox"
                        value="Archived"
                        name="status"
                        defaultChecked={status.includes("Archived")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor="Archived" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Archived
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center w-full space-x-4 md:w-auto mt-5 md:ml-5 md:mt-0">
                <button
                  id="filterDropdownButtonSecond"
                  data-dropdown-toggle="filterDropdownSecond"
                  className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg md:w-auto focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w2.org/2000/svg"
                    aria-hidden="true"
                    className={`w-5 h-4 mr-2 ${workStatus.length === 0 ? "text-gray-400" : "text-[#f3c41a]"}`}
                    viewBox="-1 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Work Status
                  <svg
                    className="-mr-2 ml-1.5 w-5 h-5"
                    fill="currentColor"
                    viewBox="-1 0 20 20"
                    xmlns="http://www.w2.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M4.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    />
                  </svg>
                </button>
                <div
                  id="filterDropdownSecond"
                  className="z-10 hidden w-48 p-3 bg-white rounded-lg shadow dark:bg-gray-700"
                >
                  <h5 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Status</h5>
                  <ul className="space-y-3 text-sm" aria-labelledby="dropdownDefault">
                    <li className="flex items-center">
                      <input
                        id="Pending"
                        type="checkbox"
                        value="Pending"
                        name="workStatus"
                        defaultChecked={workStatus.includes("Pending")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor="Pending" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Pending
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="InProgress"
                        type="checkbox"
                        value="InProgress"
                        name="workStatus"
                        defaultChecked={workStatus.includes("InProgress")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor="InProgress" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        In Progress
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="Completed"
                        type="checkbox"
                        value="Completed"
                        name="workStatus"
                        defaultChecked={workStatus.includes("Completed")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-[#f3c41a] focus:ring-slate-900 dark:focus:ring-slate-900 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label htmlFor="Completed" className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Completed
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
            </Form>
            <div className="flex items-center ml-auto space-x-2 sm:space-x-3">
              <Link
                to="new"
                className="inline-flex items-center justify-center w-full  px-3 py-2.5 text-sm font-medium text-center text-slate-900 bg-[#f3c41a] rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] hover:bg-[#f3c41a] sm:w-auto"
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
                Add new invoice
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
                <thead className="bg-stone-950 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                    >
                      Invoice Number
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
                      Amount Due
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                    >
                      Invoice
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400"
                    >
                      Work
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
                        There are no invoices to show. Please add a new invoice or change your search/filter criteria
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
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        Rs. {invoice.amountDue}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">{invoice.status}</td>
                      <td
                        className={`${
                          invoice?.workStatus?.toLocaleLowerCase() === "complete"
                            ? "text-green-500"
                            : invoice?.workStatus?.toLocaleLowerCase() === "pending"
                            ? "text-red-500"
                            : "text-slate-500"
                        } p-4 text-base font-medium whitespace-nowrap dark:text-white`}
                      >
                        {invoice.workStatus?.toLocaleUpperCase()}
                      </td>
                      <td className="p-4 space-x-2 whitespace-nowrap">
                        <Link to={`/dashboard/invoices/${invoice.id}`}>
                          <button
                            type="button"
                            id="updateProductButton"
                            data-drawer-target="drawer-update-product-default"
                            data-drawer-show="drawer-update-product-default"
                            aria-controls="drawer-update-product-default"
                            data-drawer-placement="right"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-slate-900 border border-slate-900 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] dark:hover:bg-[#f3c41a]"
                          >
                            See details
                          </button>
                        </Link>
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
  );
}
