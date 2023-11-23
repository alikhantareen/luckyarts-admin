import { json, LoaderArgs, ActionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form, useNavigation, useActionData } from "@remix-run/react";
import logo from "../assets/luckyartsLogo.png";
import ReactToPrint from "react-to-print";
import React, { useEffect, useRef, useState } from "react";
import { initModals, initDismisses } from "flowbite";
import { z } from "zod";
import { db } from "~/utils/db.server";
import { eq } from "drizzle-orm";
import {
  Customer,
  Invoice,
  InvoiceWorkStatus,
  Item,
  Transaction,
  customers,
  invoices,
  items as itemsSchema,
  transactions as transactionsSchema,
} from "db/schema";
import { requireUserId } from "~/utils/session.server";

export const action = async ({ request, params }: ActionArgs) => {
  console.log("ACTION INVOICE DETAILS");
  const formData = await request.formData();
  const workStatus = formData.get("workStatus") as InvoiceWorkStatus;
  const statusId = formData.get("statusID") as string;
  const userId = await requireUserId(request);
  const transactionamount = Number(formData.get("transactionAmount"))!;
  const transactiondate = formData.get("transactionDate") as string;
  const transactionnote = formData.get("transactionNote") as string;
  const { _action } = Object.fromEntries(formData);
  const { id } = params;
  const invoiceId = Number(id);

  if (_action === "update") {
    const x = await db.update(invoices).set({ workStatus }).where(eq(invoices.id, invoiceId));
    return json({ success: "workstatusupdate" });
  }

  if (_action === "create") {
    if (transactionamount > 0) {
      const date = transactiondate ? new Date(transactiondate) : undefined;
      await db.transaction(async (tx) => {
        const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId));
        if (transactionamount > invoice.amountDue) {
          throw new Error("Transaction amount cannot be greated than amount due");
        }
        await tx.insert(transactionsSchema).values({
          userId,
          invoiceId,
          amount: transactionamount,
          createdAt: date,
          note: transactionnote,
        });
        const amountDue = invoice.amountDue - transactionamount;
        const status = amountDue === 0 ? "FullyPaid" : "PartialPaid";
        await tx.update(invoices).set({ status, amountDue }).where(eq(invoices.id, invoiceId));
      });
      return json({ success: true });
    }
  }
};

export async function loader({ params }: LoaderArgs) {
  const { id } = params;
  const invoiceId = Number(id);
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId));
  const items = await db.select().from(itemsSchema).where(eq(itemsSchema.invoiceId, invoiceId));
  const transactions = await db.select().from(transactionsSchema).where(eq(transactionsSchema.invoiceId, invoiceId));
  return json({ invoice, customer, items, transactions });
}

export default function InvoiceRoute() {
  // TODO: typesafe actioData
  const actionData = useActionData();
  const transition = useNavigation();
  const [isDisabled, setDisable] = useState(false);
  const disable = () => {
    setDisable(!isDisabled);
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      initModals();
      initDismisses();
      let date = document.querySelector<HTMLInputElement>("#date-input");
      if (date !== null) date.valueAsDate = new Date();
      if (isDisabled) {
        let input = document.querySelector<HTMLInputElement>("#amount-input");
        input!.valueAsNumber = invoice!.amountDue!;
      } else {
        let input = document.querySelector<HTMLInputElement>("#amount-input");
        input!.value = "";
      }
    }
  }, [isDisabled]);

  const { invoice, customer, items, transactions } = useLoaderData<typeof loader>();
  console.log({ invoice, customer, items, transactions });
  const componentRef = useRef<HTMLDivElement | null>(null);
  const modalHideBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (modalHideBtnRef) {
      modalHideBtnRef.current?.click();
    }
  }, [transactions]);

  return (
    <div className="w-full md:p-5 mt-16 md:mt-2 bg-[#f9fafb]">
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
                Deatils
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <div className="w-full text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white flex justify-start">
        Invoice Details
      </div>
      {/* <div>Status: {invoice?.status}</div> */}
      <div className="w-full flex justify-end mb-5">
        <ReactToPrint
          trigger={() => (
            <button className="inline-flex justify-end items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-slate-900 bg-[#f3c41a] rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] hover:bg-[#f3c41a]">
              Print
            </button>
          )}
          content={() => componentRef.current}
        />
      </div>
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="bg-white rounded-lg border-2 border-slate-300 flex-1">
          <InvoiceComponent
            ref={componentRef}
            invoice={invoice}
            customer={customer}
            items={items}
            transactions={transactions}
          />
        </div>
        <div className="flex flex-col gap-5 md:w-2/6 h-fit">
          <div className="p-5 flex w-full flex-col gap-5 h-fit bg-white rounded-lg border-2 border-slate-300">
            <p className="border-b-2 border-black font-bold p-2 text-lg">Work Status</p>
            {invoice?.workStatus?.toLocaleLowerCase() === "completed" ? (
              <p>
                Current Status:{" "}
                <span
                  className={`${
                    invoice?.workStatus?.toLocaleLowerCase() === "completed"
                      ? "text-green-500"
                      : invoice?.workStatus?.toLocaleLowerCase() === "pending"
                      ? "text-red-500"
                      : "text-slate-500"
                  } font-bold text-md`}
                >
                  {invoice?.workStatus?.toLocaleUpperCase()}
                </span>
              </p>
            ) : (
              <div>
                <p>
                  Current Status:{" "}
                  <span
                    className={`${
                      invoice?.workStatus?.toLocaleLowerCase() === "completed"
                        ? "text-green-500"
                        : invoice?.workStatus?.toLocaleLowerCase() === "pending"
                        ? "text-red-500"
                        : "text-slate-500"
                    } font-bold text-md`}
                  >
                    {invoice?.workStatus?.toLocaleUpperCase()}
                  </span>
                </p>
                <div>
                  <Form method="post" action={`/dashboard/invoices/${invoice?.id}`} className="flex flex-col gap-5">
                    <label
                      htmlFor="countries"
                      className="block -mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Change Status
                    </label>
                    <select
                      id="workstatuses"
                      name="workStatus"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option selected value={"Pending"}>
                        Pending
                      </option>
                      <option value={"InProgress"}>In progress</option>
                      <option value={"Completed"}>Completed</option>
                    </select>
                    <input type="text" hidden name="statusID" defaultValue={invoice?.id} />
                    <button
                      name="_action"
                      value="update"
                      type="submit"
                      className="w-fit self-end inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-slate-900 border border-slate-900 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] dark:hover:bg-[#f3c41a]"
                    >
                      {transition.state === "submitting" ? "Changing..." : "Change Status"}
                    </button>
                  </Form>
                </div>
              </div>
            )}
          </div>
          <div className="p-5 flex w-full flex-col gap-5 h-fit bg-white rounded-lg border-2 border-slate-300">
            <p className="border-b-2 border-black font-bold p-2 text-lg">Transaction History</p>
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500">No transaction has been made yet.</p>
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
                    <p>{new Date(elem.createdAt).toDateString()}</p>
                    <p>{elem.amount}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              {invoice?.amountDue! > 0 ? (
                <button
                  data-modal-target="staticModal"
                  data-modal-toggle="staticModal"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-slate-900 border border-slate-900 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] dark:hover:bg-[#f3c41a]"
                >
                  Add transaction
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>
      {/* transaction modal */}
      <div
        id="staticModal"
        data-modal-backdrop="staticModal"
        tabIndex={-1}
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] md:h-full bg-gray-900 bg-opacity-75"
      >
        <div className="relative w-full h-full max-w-2xl md:h-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add transaction</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-hide="staticModal"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <Form method="post" action={`/dashboard/invoices/${invoice?.id}`}>
              <div className="p-6 space-y-6">
                <div className="flex mb-4 flex-col">
                  <div className="flex gap-4 items-center mb-4">
                    <input type="text" name="invoiceId" hidden value={invoice?.id} />
                    <input
                      id="paid-checkbox"
                      type="checkbox"
                      onClick={disable}
                      name="paid-checkbox"
                      value=""
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="paid-checkbox" className="ml-2 text-lg font-lg text-gray-900 dark:text-gray-300">
                      Fully paid
                    </label>
                  </div>
                  <div className="mb-6">
                    <label
                      htmlFor="amount-input"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount-input"
                      readOnly={isDisabled}
                      name="transactionAmount"
                      className={`${
                        isDisabled
                          ? `cursor-not-allowed bg-zinc-300 border border-gray-300 text-gray-900`
                          : "cursor-default"
                      } bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                      required
                      min={0}
                      max={invoice?.amountDue}
                    />
                  </div>
                  <div className="mb-6">
                    <label
                      htmlFor="date-input"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="date-input"
                      name="transactionDate"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    />
                  </div>

                  <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Note
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    name="transactionNote"
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Write your note here..."
                  ></textarea>
                </div>
              </div>
              <div className="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button
                  name="_action"
                  value="create"
                  type="submit"
                  className="text-slate-900 bg-[#f3c41a] focus:ring-2 focus:outline-none focus:ring-slate-900 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-bg-[#f3c41a] dark:focus:ring-slate-900"
                >
                  {transition.state === "submitting" ? "Submitting..." : "Submit"}
                </button>
                <button hidden type="button" data-modal-hide="staticModal" ref={modalHideBtnRef}></button>
              </div>
            </Form>
          </div>
        </div>
      </div>
      {actionData?.issues! ? (
        <div
          id="toast-danger"
          className="fixed top-20 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
          role="alert"
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">Error icon</span>
          </div>
          <div className="ml-3 text-sm font-normal">Something went wrong. Please try again.</div>
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
            data-dismiss-target="#toast-danger"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      ) : (
        <div
          id="toast-success"
          className={`${
            actionData?.success! ? "fixed flex" : "hidden"
          } top-20 right-5  items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800`}
          role="alert"
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">Check icon</span>
          </div>
          <div className="ml-3 text-sm font-normal">Operation has been successfully completed.</div>
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
            data-dismiss-target="#toast-success"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

type InvoiceComponentProps = {
  invoice: Omit<Invoice, "createdAt"> & {
    createdAt?: string;
  };
  customer: Customer;
  items: Item[];
  transactions: Array<Omit<Transaction, "createdAt"> & { createdAt?: string }>;
};
const InvoiceComponent = React.forwardRef<HTMLDivElement | null, InvoiceComponentProps>((props, ref) => {
  const { invoice, customer, items, transactions } = props;
  const totalDiscount = items.map((i) => (i.discount ?? 0) * i.quantity).reduce((p, n) => p + n, 0);

  return (
    <div ref={ref} className="p-5 print:p-8">
      <div className="flex justify-start flex-col gap-3 md:flex-row md:justify-between print:flex-row print:justify-between">
        <div>
          <p className="text-2xl md:text-2xl print:text-2xl font-bold">Invoice no. {invoice.id}</p>
          <p className="text-md md:text-md print:text-md text-slate-500">
            {new Date(invoice.createdAt!).toDateString()}
          </p>
        </div>
        <div className="flex flex-col justify-center md:justify-end print:justify-end md:items-end print:items-end items-start gap-2">
          <img src={logo} alt="logo" width={150} className="rounded-full" />
          <p className="text-lg font-bold">Lucky Arts Graphic Design</p>
          <p className="text-sm">Chowk Fawara, Abdali Road, Multan, Pakistan</p>
          <p className="text-sm">Phone No. +92306-6667200</p>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-5 print:flex-row md:flex-row justify-between">
        <div>
          <p className="font-bold text-md md:text-md print:text-md md:mb-1">BILLED TO</p>
          <p className="text-md md:text-md print:text-md text-slate-500 italic">{customer.name}</p>
          <p className="text-md md:text-md print:text-md text-slate-500 italic">{customer.phone}</p>
        </div>
      </div>
      <table className="w-full mt-3 md:mt-6">
        <tr className="grid grid-cols-4 md:grid-cols-6 print:grid-cols-6 text-right p-2 bg-slate-200 text-slate-900 border-b-2 border-slate-300">
          <th className="col-span-3 text-left">Item</th>
          <th className="hidden md:block print:block">Qty</th>
          <th className="hidden md:block print:block">Price (Rs.)</th>
          <th>Amount (Rs.)</th>
        </tr>
        {items.map((elem, key) => {
          return (
            <tr
              key={key}
              className={`grid grid-cols-4 p-2 md:grid-cols-6 print:grid-cols-6 text-right md:mb-2 ${
                key === items.length - 1 ? `border-b-2 border-slate-200` : ""
              }`}
            >
              <td className="col-span-3 text-left">
                <p className="text-lg">{elem.name}</p>
                <p className="text-slate-500 text-sm">{elem.description}</p>
                <p className="flex md:hidden print:hidden">
                  {elem.quantity} x {elem.price}
                </p>
              </td>
              <td className="hidden md:block print:block">{elem.quantity}</td>
              <td className="hidden md:block print:block">{elem.price}</td>
              <td>{`${elem.quantity * elem.price}`}</td>
            </tr>
          );
        })}
        <tr className={`grid grid-cols-4 p-2 md:grid-cols-6 print:grid-cols-6 text-right md:mb-2 print:mb-2`}>
          <td className="col-span-2 text-left">
            <p className="text-lg"></p>
            <p className="flex md:hidden print:hidden"></p>
          </td>
          <td className=""></td>
          <td className="text-left md:text-right print:text-right text-md col-span-2 font-semibold text-slate-600">
            Net Total (Rs.)
          </td>
          <td className="col-span-2 md:col-span-1 print:col-span-1">{invoice.totalAmount + totalDiscount}</td>
        </tr>
        <tr className={`grid grid-cols-4 p-2 md:grid-cols-6 print:grid-cols-6 text-right md:mb-2 print:mb-2`}>
          <td className="col-span-2 text-left">
            <p className="text-lg"></p>
            <p className="flex md:hidden print:hidden"></p>
          </td>
          <td className=""></td>
          <td className="text-left md:text-right print:text-right text-md col-span-2 font-semibold text-slate-600">
            Discount Total (Rs.)
          </td>
          <td className="col-span-2 md:col-span-1 print:col-span-1">{totalDiscount}</td>
        </tr>
        <tr className={`grid grid-cols-4 p-2 md:grid-cols-6 print:grid-cols-6 text-right md:mb-2 print:mb-2`}>
          <td className="col-span-2 text-left">
            <p className="text-lg"></p>
            <p className="flex md:hidden print:hidden"></p>
          </td>
          <td className=""></td>
          <td className="text-left md:text-right print:text-right text-md col-span-2 font-semibold text-slate-600">
            After Discount (Rs.)
          </td>
          <td className="col-span-2 md:col-span-1 print:col-span-1">{invoice.totalAmount}</td>
        </tr>
        <tr className={`grid grid-cols-4 p-2 md:grid-cols-6 print:grid-cols-6 text-right md:mb-2 print:mb-2`}>
          <td className="hidden md:block print:block col-span-2 text-left">
            <p className="text-lg"></p>
            <p className="flex md:hidden print:hidden"></p>
          </td>
          <td className="hidden md:block print:block"></td>
          <td className="text-left md:text-right print:text-right col-span-2 font-semibold text-slate-600">
            Advance Payment (Rs.)
          </td>
          <td className="col-span-2 md:col-span-1 print:col-span-1">
            {transactions.reduce((acc, obj) => {
              return acc + obj.amount;
            }, 0)}
          </td>
        </tr>
        <tr className={`grid grid-cols-4 p-2 md:grid-cols-6 print:grid-cols-6 text-right md:mb-2`}>
          <td className="col-span-2 text-left">
            <p className="text-lg"></p>
            <p className="flex md:hidden print:hidden"></p>
          </td>
          <td className=""></td>
          <td className={`col-span-2 text-left md:text-right print:text-right font-semibold md:text-lg print:text-lg`}>
            {invoice.amountDue! > 0 ? "Remaining Payment (Rs.)" : "FULLY PAID ✅"}
          </td>
          <td className="col-span-2 md:col-span-1 print:col-span-1 md:text-lg print:text-lg font-semibold">
            {invoice.amountDue! > 0 ? invoice.amountDue! : ""}
          </td>
        </tr>
      </table>
      <div className="flex flex-col gap-8 md:flex-row print:flex-row justify-between mt-16">
        <div>
          <p className="font-bold">NOTE</p>
          <ol className="list-decimal list-inside">
            <li>Any technical glitches may delay the work.</li>
            <li>Advance will not be refunded in case of order cancellation.</li>
          </ol>
        </div>
      </div>
    </div>
  );
});
