import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { Form, NavLink, useLoaderData } from "@remix-run/react";
import { findInvoices, findInvoicesWithDate, invoicesCollection } from "lib/invoice.server";
import { findTransactions } from "lib/transaction.server";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  
  if (from && to) {
    const invoice = await findInvoicesWithDate(from!, to!);
    const transactions = await findTransactions();
    return json({ invoice, transactions });
  }
  const invoiceCursor = invoicesCollection.findMany()
  const invoice = await invoiceCursor.toArray();
  const transactions = await findTransactions();
  return json({ invoice, transactions });
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
  function invoicesPaymentCalculator(
    condition: string,
    invoice: Array<any>
  ): any {
    const accumulator = invoice.reduce((accum, current) => {
      if (current.status?.toString().toLocaleLowerCase() === condition) {
        accum = accum + Number(current.amountDue);
      }
      return accum;
    }, 0);
    return accumulator;
  }
  const fullyPaidAmount = invoice.reduce((accum, current) => {
    if (current.status?.toString().toLocaleLowerCase() === "fully paid") {
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
  return (
    <div className="p-2 md:p-4 bg-[#f9fafb] h-screen w-full">
      <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">
        Dashboard
      </h1>
      <div className="flex flex-col gap-5 justify-center items-center md:flex-row md:flex-wrap">
        <div className="bg-white rounded-lg border-2 border-slate-300 p-4 md:p-8 mt-5 flex flex-col gap-5 w-full flex-1">
          <Form className="" method="get">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex items-center gap-3">
                <p className="font-bold">From</p>
                <input
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  type="date"
                  name="from"
                  id="from"
                />
              </div>
              <div className="flex items-center gap-8">
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
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">
              Invoices
            </h1>
            <div className="flex flex-col gap-5 md:flex-row mt-5 w-full">
              <NavLink
                to="invoices?status=Unpaid"
                className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-60 md:h-32 p-6 bg-[#dd2822] rounded-lg shadow hover:bg-[#f40901] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
              >
                <p className="text-md font-semibold">Unpaid</p>
                <p className="text-2xl font-semibold">
                  {invoicesCounter("unpaid", invoice)}
                </p>
                <p className="text-xs font-semibold mt-2">
                  Total Unpaid Amount
                </p>
                <p className="text-xl font-semibold">
                  Rs. {invoicesPaymentCalculator("unpaid", invoice)}
                </p>
              </NavLink>
              <NavLink
                to="invoices?status=Partial+Paid"
                className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-60 md:h-32 p-6 bg-[#f3c41a] rounded-lg shadow hover:bg-[#FFCB06] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
              >
                <p className="text-md font-semibold">Partial Paid</p>
                <p className="text-2xl font-semibold">
                  {invoicesCounter("partial paid", invoice)}
                </p>
                <p className="text-xs font-semibold mt-2">
                  Total Partial Paid Amount
                </p>
                <p className="text-xl font-semibold">
                  Rs. {invoicesPaymentCalculator("partial paid", invoice)}
                </p>
              </NavLink>
              <NavLink
                to="invoices?status=Fully+Paid"
                className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-60 md:h-32 p-6 bg-[#379d37] rounded-lg shadow hover:bg-[#2ab52a] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
              >
                <p className="text-md font-semibold">Full Paid</p>
                <p className="text-2xl font-semibold">
                  {invoicesCounter("fully paid", invoice)}
                </p>
                <p className="text-xs font-semibold mt-2">
                  Total Amount Received
                </p>
                <p className="text-xl font-semibold">Rs. {fullyPaidAmount}</p>
              </NavLink>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">
              Orders
            </h1>
            <div className="flex flex-col gap-5 md:flex-row mt-5">
              <NavLink
                to="invoices?workStatus=Pending"
                className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-60 md:h-32 p-6 bg-[#dd2822] rounded-lg shadow hover:bg-[#f40901] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
              >
                <p className="text-md font-semibold">Pending</p>
                <p className="text-2xl font-semibold mt-3">
                  {ordersStatusCounter("pending", invoice)}
                </p>
              </NavLink>
              <NavLink
                to="invoices?workStatus=In+Progress"
                className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-60 md:h-32 p-6 bg-[#f3c41a] rounded-lg shadow hover:bg-[#FFCB06] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
              >
                <p className="text-md font-semibold">In Progress</p>
                <p className="text-2xl font-semibold mt-3">
                  {ordersStatusCounter("in progress", invoice)}
                </p>
              </NavLink>
              <NavLink
                to="invoices?workStatus=Complete"
                className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-60 md:h-32 p-6 bg-[#379d37] rounded-lg shadow hover:bg-[#2ab52a] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
              >
                <p className="text-md font-semibold">Complete</p>
                <p className="text-2xl font-semibold mt-3">
                  {ordersStatusCounter("complete", invoice)}
                </p>
              </NavLink>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border-2 border-slate-300 p-8 mt-5 flex flex-col gap-5 md:w-96 self-start w-full">
          <p className="font-bold text-lg">Latest Transactions</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">
              No transaction has been made yet.
            </p>
          ) : (
            <div className="w-full flex justify-between">
              <p className="font-bold">Date</p>
              <p className="font-bold">Amount</p>
            </div>
          )}
          <div>
            {transactions.map((elem, key) => {
              return (
                <div key={key} className="w-full flex justify-between">
                  <p>{new Date(elem.transactionDate).toDateString()}</p>
                  <p>Rs. {elem.transactionAmount}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
