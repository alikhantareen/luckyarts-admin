import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { findInvoices } from "lib/invoice.server";
import { initDropdowns } from "flowbite";
import { useEffect, useRef } from "react";

// Update relavant const on server: lib/invoice.server.ts
const PAGE_SIZE = 5;

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const statusFilters = url.searchParams.getAll("status");
  const page = Number(url.searchParams.get("page") || "1");
  const searchQuery = url.searchParams.get("q") || "";

  const { invoices, total } = await findInvoices(
    page,
    statusFilters,
    searchQuery
  );
  return json({ invoices, total });
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
  const q = searchParams.get("q");

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
                      to="/invoices"
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
                    <span
                      className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500"
                      aria-current="page"
                    >
                      List
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              All invoices
            </h1>
          </div>
          <div className="sm:flex mb-2">
            <Form
              method="get"
              action="/invoices"
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
                      className={`w-5 h-5 ${
                        q ? "text-blue-700" : "text-gray-400"
                      }`}
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
                    className="absolute top-0 right-0 p-2.5 text-sm font-medium text-white bg-blue-700 rounded-r-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                    className={`w-5 h-4 mr-2 ${
                      status.length === 0 ? "text-gray-400" : "text-blue-700"
                    }`}
                    viewBox="-1 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Filter
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
                  id="filterDropdown"
                  className="z-10 hidden w-48 p-3 bg-white rounded-lg shadow dark:bg-gray-700"
                >
                  <h5 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    Status
                  </h5>
                  <ul
                    className="space-y-3 text-sm"
                    aria-labelledby="dropdownDefault"
                  >
                    <li className="flex items-center">
                      <input
                        id="Unpaid"
                        type="checkbox"
                        value="Unpaid"
                        name="status"
                        defaultChecked={status.includes("Unpaid")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label
                        htmlFor="Unpaid"
                        className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        Unpaid
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="Partial Paid"
                        type="checkbox"
                        value="Partial Paid"
                        name="status"
                        defaultChecked={status.includes("Partial Paid")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label
                        htmlFor="Partial Paid"
                        className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        Partial Paid
                      </label>
                    </li>
                    <li className="flex items-center">
                      <input
                        id="Fully Paid"
                        type="checkbox"
                        value="Fully Paid"
                        name="status"
                        defaultChecked={status.includes("Fully Paid")}
                        onChange={() => submit(formRef.current)}
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label
                        htmlFor="Fully Paid"
                        className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
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
                        className="w-5 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label
                        htmlFor="Archived"
                        className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        Archived
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
            </Form>
            <div className="flex items-center ml-auto space-x-2 sm:space-x-3">
              <Link
                to="new"
                className="inline-flex items-center justify-center w-full  px-3 py-2.5 text-sm font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
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
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Invoice Number
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Customer Name
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Customer Phone
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Total Amount
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Amount Due
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {invoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={100}
                        className="w-full text-gray-500 text-sm p-4 sm:p-6 text-center"
                      >
                        There are no invoices to show. Please add a new invoice
                        or change your search/filter criteria
                      </td>
                    </tr>
                  )}
                  {invoices.map((invoice) => (
                    <tr
                      className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        transition.state === "idle"
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                      key={invoice.id}
                    >
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        {new Date(invoice.createdAt!).toDateString()}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        {invoice.customer.customerName}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        {invoice.customer.customerPhone}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        Rs. {invoice.totalAmount}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        Rs. {invoice.amountDue}
                      </td>
                      <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                        {invoice.status}
                      </td>
                      <td className="p-4 space-x-2 whitespace-nowrap">
                        <Link to={`/invoices/${invoice.id}`}>
                          <button
                            type="button"
                            id="updateProductButton"
                            data-drawer-target="drawer-update-product-default"
                            data-drawer-show="drawer-update-product-default"
                            aria-controls="drawer-update-product-default"
                            data-drawer-placement="right"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-blue-700 border border-blue-700 hover:bg-blue-100 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
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
            <svg
              className="w-7 h-7"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
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
            <svg
              className="w-7 h-7"
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
          </button>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {`${Math.min((page - 1) * PAGE_SIZE + 1, total)}-${Math.min(
                page * PAGE_SIZE,
                total
              )}`}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {`${total}`}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
