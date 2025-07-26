import { LoaderArgs, json, redirect } from "@remix-run/node";
import { Form, NavLink, useLoaderData } from "@remix-run/react";
import { invoices, transactions as transactionsSchema, shops } from "db/schema";
import { between, gte, lte, desc, eq, and } from "drizzle-orm";
import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let result;
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.shopId, user.shopId!), eq(invoices.type, "Invoice"), between(invoices.createdAt, fromDate, toDate)));
  } else if (from) {
    const fromDate = new Date(from);
    result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.shopId, user.shopId!), eq(invoices.type, "Invoice"), gte(invoices.createdAt, fromDate)));
  } else if (to) {
    const toDate = new Date(to);
    result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.shopId, user.shopId!), eq(invoices.type, "Invoice"), lte(invoices.createdAt, toDate)));
  } else {
    result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.shopId, user.shopId!), eq(invoices.type, "Invoice")));
  }
  const transactions = await db
    .select()
    .from(transactionsSchema)
    .where(eq(transactionsSchema.shopId, user.shopId!))
    .limit(10)
    .orderBy(desc(transactionsSchema.id));

  // Fetch shop information
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, user.shopId!));

  return json({ invoice: result, transactions, shop });
}

export default function Index() {
  const { invoice, transactions, shop } = useLoaderData<typeof loader>();
  
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
    <div className="min-h-screen p-6 bg-white dark:bg-gray-900">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white font-lemon mb-2">
          Welcome to {shop?.name || 'Your Shop'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Monitor your business performance and track important metrics
        </p>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-lg">
        <Form className="w-full" method="get">
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex flex-grow items-center gap-4">
              <label className="font-semibold text-gray-700 dark:text-gray-300 min-w-[60px]">From</label>
              <input
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-2xl focus:ring-2 focus:ring-[#f3c41a]/50 focus:border-[#f3c41a] block p-3.5 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                type="date"
                name="from"
                id="from"
              />
            </div>
            <div className="flex flex-grow items-center gap-4">
              <label className="font-semibold text-gray-700 dark:text-gray-300 min-w-[60px]">To</label>
              <input
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-2xl focus:ring-2 focus:ring-[#f3c41a]/50 focus:border-[#f3c41a] block p-3.5 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                type="date"
                name="to"
                id="to"
              />
            </div>
            <button className="lg:w-fit w-full bg-[#f3c41a] hover:bg-[#e6b800] text-gray-900 font-semibold rounded-2xl text-sm px-8 py-3.5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#f3c41a]/50">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </span>
            </button>
          </div>
        </Form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Invoices Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-[#f3c41a] text-gray-900 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Overview</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unpaid Card */}
              <div className="group relative overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-red-500 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Unpaid</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {invoicesCounter("unpaid", invoice)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Amount: <span className="font-semibold text-red-600 dark:text-red-400">Rs. {invoicesPaymentCalculator("unpaid", invoice)}</span>
                  </p>
                  <NavLink
                    to="invoices?status=Unpaid"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                </div>
              </div>

              {/* Partial Paid Card */}
              <div className="group relative overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#f3c41a]/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#7e691e]">Partial</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {invoicesCounter("partialpaid", invoice)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Amount: <span className="font-semibold text-[#7e691e]">Rs. {invoicesPaymentCalculator("partialpaid", invoice)}</span>
                  </p>
                  <NavLink
                    to="invoices?status=PartialPaid"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-[#f3c41a] hover:bg-[#e6b800] rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                </div>
              </div>

              {/* Fully Paid Card */}
              <div className="group relative overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-green-500 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Paid</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {invoicesCounter("fullypaid", invoice)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Amount: <span className="font-semibold text-green-600 dark:text-green-400">Rs. {fullyPaidAmount}</span>
                  </p>
                  <NavLink
                    to="invoices?status=FullyPaid"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-[#f3c41a] text-gray-900 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Status</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Orders */}
              <div className="group relative overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-red-500 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Pending</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {ordersStatusCounter("pending", invoice)}
                  </h3>
                  <NavLink
                    to="invoices?workStatus=Pending"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Orders
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                </div>
              </div>

              {/* In Progress Orders */}
              <div className="group relative overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#f3c41a]/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#7e691e]">In Progress</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {ordersStatusCounter("inprogress", invoice)}
                  </h3>
                  <NavLink
                    to="invoices?workStatus=InProgress"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-[#f3c41a] hover:bg-[#e6b800] rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Orders
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                </div>
              </div>

              {/* Completed Orders */}
              <div className="group relative overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-green-500 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Completed</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {ordersStatusCounter("completed", invoice)}
                  </h3>
                  <NavLink
                    to="invoices?workStatus=Completed"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View Orders
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Latest Transactions */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Latest Transactions</h3>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((elem, key) => (
                  <div key={key} className="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f3c41a] flex items-center justify-center text-gray-900 text-sm font-semibold shadow-lg">
                          {formatDate(new Date(elem.createdAt).toDateString()).split('/')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(new Date(elem.createdAt).toDateString())}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Transaction</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          Rs. {elem.amount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
