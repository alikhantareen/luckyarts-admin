import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { Form, NavLink, useLoaderData } from "@remix-run/react";
import { invoices, transactions as transactionsSchema } from "db/schema";
import { between, gte, lte } from "drizzle-orm";
import { db } from "~/utils/db.server";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let result;
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // const invoice = await findInvoicesWithDate(from!, to!);
    result = await db.select().from(invoices).where(between(invoices.createdAt, fromDate, toDate));
  } else if (from) {
    const fromDate = new Date(from);
    result = await db.select().from(invoices).where(gte(invoices.createdAt, fromDate));
  } else if (to) {
    const toDate = new Date(to);
    result = await db.select().from(invoices).where(lte(invoices.createdAt, toDate));
  } else {
    result = await db.select().from(invoices);
  }
  const transactions = await db.select().from(transactionsSchema);
  return json({ invoice: result, transactions });
}

export default function Index() {
  const { invoice, transactions } = useLoaderData<typeof loader>();
  function invoicesCounter(condition: string, invoice: Array<any>): any {
    let accumulatedValue = invoice.reduce((accum, current) => {
      if (current.status?.toString().toLocaleLowerCase() === condition) {
        accum = accum + 1;
      }
      return accum;
    }, 0);
    return accumulatedValue;
  }
  function invoicesPaymentCalculator(condition: string, invoice: Array<any>): any {
    const accumulator = invoice.reduce((accum, current) => {
      if (current.status?.toString().toLocaleLowerCase() === condition) {
        accum = accum + Number(current.amountDue);
      }
      return accum;
    }, 0);
    return accumulator;
  }
  const fullyPaidAmount = invoice.reduce((accum, current) => {
    if (current.status?.toString().toLocaleLowerCase() === "fullypaid") {
      accum = accum + Number(current.totalAmount);
    }
    return accum;
  }, 0);
  function ordersStatusCounter(condition: string, invoice: Array<any>): any {
    const counter = invoice.reduce((accum, current) => {
      if (current.workStatus?.toString().toLocaleLowerCase() === condition) {
        accum = accum + 1;
      }
      return accum;
    }, 0);
    return counter;
  }
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
    <div className="p-2 md:p-4 bg-[#f9fafb] h-screen w-full">
      <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white font-lemon">Dashboard</h1>
      <div className="flex flex-col gap-5 justify-center items-center md:flex-row md:flex-wrap">
        <div className="bg-white rounded-lg border-2 border-slate-300 p-4 md:p-8 mt-5 flex flex-col gap-5 w-full flex-1">
          <Form className="w-full" method="get">
            <div className="w-full flex flex-col md:flex-row gap-5">
              <div className="flex flex-grow items-center gap-3">
                <p className="font-bold">From</p>
                <input
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  type="date"
                  name="from"
                  id="from"
                />
              </div>
              <div className="flex flex-grow items-center gap-8">
                <p className="font-bold">To</p>
                <input
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  type="date"
                  name="to"
                  id="to"
                />
              </div>
              <button className="w-full md:w-fit text-slate-900 bg-[#f3c41a] focus:ring-2 focus:ring-slate-900 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#f3c41a] focus:outline-none dark:focus:ring-slate-900">
                Search
              </button>
            </div>
          </Form>
          <div className="w-full">
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">Invoices</h1>
            <div className="flex flex-col gap-5 md:flex-row mt-5 w-full">
              <div className="flex-grow p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Unpaid: {invoicesCounter("unpaid", invoice)}
                </h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  Unpaid Amount: <b>{invoicesPaymentCalculator("unpaid", invoice)}</b>
                </p>
                <NavLink
                  to="invoices?status=Unpaid"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-500 rounded-lg"
                >
                  See more
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </NavLink>
              </div>
              <div className="flex-grow p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Partial Paid: {invoicesCounter("partialpaid", invoice)}
                </h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  Partial Amount: <b>{invoicesPaymentCalculator("partialpaid", invoice)}</b>
                </p>
                <NavLink
                  to="invoices?status=PartialPaid"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-slate-900 bg-yellow-300 rounded-lg"
                >
                  See more
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </NavLink>
              </div>
              <div className="flex-grow p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Full paid: {invoicesCounter("fullypaid", invoice)}
                </h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  Total Amount: <b>{fullyPaidAmount}</b>
                </p>
                <NavLink
                  to="invoices?status=FullyPaid"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-green-400 rounded-lg"
                >
                  See more
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </NavLink>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">Orders</h1>
            <div className="flex flex-col gap-5 md:flex-row mt-5">
              <div className="flex-grow p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pending</h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  <b>{ordersStatusCounter("pending", invoice)}</b>
                </p>
                <NavLink
                  to="invoices?workStatus=Pending"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-500 rounded-lg"
                >
                  See more
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </NavLink>
              </div>
              <div className="flex-grow p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">In Progress</h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  <b>{ordersStatusCounter("inprogress", invoice)}</b>
                </p>
                <NavLink
                  to="invoices?workStatus=InProgress"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-slate-900 bg-yellow-300 rounded-lg"
                >
                  See more
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </NavLink>
              </div>
              <div className="flex-grow p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Complete</h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  <b> {ordersStatusCounter("completed", invoice)}</b>
                </p>
                <NavLink
                  to="invoices?workStatus=Completed"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-green-400 rounded-lg"
                >
                  See more
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border-2 border-slate-300 p-8 mt-5 flex flex-col gap-5 md:w-96 self-start w-full">
          <p className="font-bold text-lg border-b-2 border-slate-900">Latest Transactions</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">No transaction has been made yet.</p>
          ) : (
            <div className="w-full flex justify-between">
              <p className="font-bold">Date</p>
              <p className="font-bold">Amount</p>
            </div>
          )}
          <div>
            {transactions.slice(0, 10).reverse().map((elem, key) => {
              return (
                <div key={key} className="w-full flex justify-between border-b-2 border-slate-900 mb-2">
                  <p>{formatDate(new Date(elem.createdAt).toDateString())}</p>
                  <p>Rs. {elem.amount}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
