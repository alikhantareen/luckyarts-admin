import { json, LoaderArgs, ActionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form, useNavigation, useActionData } from "@remix-run/react";
import second_logo from "../assets/second_logo.png";
import bill_logo from "../assets/final_logo.png";
import ReactToPrint from "react-to-print";
import React, { useEffect, useRef, useState } from "react";
import { initModals, initDismisses } from "flowbite";
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
import { FaFacebook, FaGlobe, FaInstagram, FaYoutube, FaWhatsapp, FaLocationDot } from "react-icons/fa6";
import { SiGmail } from "react-icons/si";

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
            <button className="inline-flex justify-end items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center border-stone-950 bg-[#f3c41a] rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] hover:bg-[#f3c41a]">
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
                      className="w-fit self-end inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg border border-stone-950 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] dark:hover:bg-[#f3c41a]"
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
                  <>
                    <div key={key} className="w-full flex justify-between">
                      <p>{formatDate(new Date(elem.createdAt).toDateString())}</p>
                      <p>{elem.amount}</p>
                    </div>
                    <p className="text-sm border-b-2 border-slate-900 mb-2"><span className="font-semibold">Note: </span>{elem.note}</p>
                  </>
                );
              })}
            </div>
            <div className="flex justify-end">
              {invoice?.amountDue! > 0 ? (
                <button
                  data-modal-target="staticModal"
                  data-modal-toggle="staticModal"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg border-stone-950 border hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] dark:hover:bg-[#f3c41a]"
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
                  className="border-stone-950 bg-[#f3c41a] focus:ring-2 focus:outline-none focus:ring-slate-900 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-bg-[#f3c41a] dark:focus:ring-slate-900"
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
    <div ref={ref} className="mt-4 print:mt-8">
      <div className="md:relative print:relative md:border-b-[16px] print:border-b-[16px] border-[#fdca01] print:border-stone-950 flex justify-between flex-col gap-2 md:gap-0 print:gap-0 md:flex-row print:flex-row p-2 md:p-0 print:p-0">
        <div className="flex items-end gap-2 print:items-end">
          <img
            width={80}
            src={second_logo}
            alt="logo"
            className="ml-0 md:ml-4 print:ml-4 print:hidden p-2 bg-[#fdca01]"
          />
          <img width={70} src={bill_logo} alt="logo" className="ml-0 md:ml-4 print:ml-4 hidden print:block" />
          <div className="font-lemon flex flex-col items-center">
            <p className="text-2xl md:text-4xl print:text-4xl font-bold">LUCKY ARTS</p>
            <p className="text-xs font-semibold">SINCE 1985</p>
            <p className="text-xs font-semibold md:hidden print:hidden">THE NAME OF QUALITY</p>
          </div>
        </div>
        <div className="mb-2 flex flex-col justify-center md:justify-end print:justify-end md:items-end print:items-end items-start mr-4">
          <p className="text-xs font-semibold">Ashfaq Ahmad Khan Khakwani</p>
          <p className="text-xs font-semibold mb-1 flex items-center gap-1">
            <FaWhatsapp /> 0307-6667200
          </p>
          <p className="text-xs font-semibold">Mudassir Khan Khakwani</p>
          <p className="text-xs font-semibold mb-1 flex items-center gap-1">
            <FaWhatsapp /> 0306-6667200
          </p>
          <p className="text-xs font-semibold flex items-center gap-1">
            <SiGmail />
            lucky_arts72@gmail.com
          </p>
          <p className="text-xs font-semibold flex items-center gap-1">
            <FaLocationDot /> Chowk Fawara, Abdali Road, Near Ghanta Ghar, Multan
          </p>
        </div>
        <p className="hidden font-lemon md:block print:block text-xs font-semibold md:absolute print:absolute top-[112px] left-[145px] print:left-[144px] print:text-white">
          THE NAME OF QUALITY
        </p>
      </div>
      <div className="flex justify-between px-4 mt-2">
        <div className="flex flex-col self-center">
          <p className="text-lg font-bold">Customer Details:</p>
          <p className="text-md italic">{customer.name}</p>
          <p className="text-md italic">{customer.phone}</p>
        </div>
        <div className="">
          <p className="text-lg font-bold">
            Invoice#: <span className="font-normal">{invoice.id}</span>
          </p>
          <p className="text-lg font-bold">
            Date: <span className="font-normal">{formatDate(new Date(invoice.createdAt!).toDateString())}</span>
          </p>
          <p className="text-lg font-bold">
            NTN#: <span className="font-normal">0103866-4</span>
          </p>
        </div>
      </div>
      <div className="p-4">
        <table className="w-full mt-3 md:mt-2 border-collapse">
          <tr className="grid grid-cols-5 md:grid-cols-9 print:grid-cols-9 text-right p-2 bg-stone-950 text-white">
            <th className="col-span-1 text-center text-sm">Sr.No#</th>
            <th className="col-span-2 md:col-span-4 print:col-span-4 text-center text-sm">Item Description</th>
            <th className="col-span-1 text-center text-sm">Size</th>
            <th className="hidden md:block print:block text-center text-sm">Price </th>
            <th className="hidden md:block print:block text-center text-sm">Qty</th>
            <th className="col-span-1 text-right text-sm">Total Price</th>
          </tr>
          {items.map((elem, key) => {
            return (
              <tr key={key} className={`grid grid-cols-5 md:grid-cols-9 print:grid-cols-9`}>
                <td className="col-span-1 text-center border-b-2 border-l-2 border-t-2 border-stone-950 font-bold">
                  <p className="">{key + 1}</p>
                </td>
                <td className="col-span-2 md:col-span-4 print:col-span-4 text-left px-2 border-b-2 border-l-2 border-t-2 border-stone-950 font-bold">
                  <p className="">{elem.name}</p>
                  {/* <p className="flex md:hidden print:hidden">
                    {elem.quantity} x {elem.price}
                  </p> */}
                </td>
                <td className="col-span-1 font-bold text-center border-b-2 border-l-2 border-t-2 border-stone-950">
                  {elem.description}
                </td>
                <td className="hidden md:block print:block font-bold text-center border-b-2 border-l-2 border-t-2 border-stone-950">
                  {elem.price}
                </td>
                <td className="hidden md:block print:block font-bold text-center border-b-2 border-l-2 border-t-2 border-stone-950">
                  {elem.quantity}
                </td>
                <td className="border-stone-950 font-bold text-right px-2 border-b-2 border-l-2 border-t-2 border-r-2">{`${
                  elem.quantity * elem.price
                }`}</td>
              </tr>
            );
          })}
          <div className="w-full flex justify-end">
            <div className="border-b-2 border-l-2 border-r-2 border-stone-950 w-[18rem] flex flex-col">
              <div className="mt-2 mb-2">
                <span className="flex justify-between font-bold mb-2 text-stone-950 ">
                  <div className="flex justify-end w-2/3">
                    <p>Sub Total:</p>
                  </div>
                  <div className="flex justify-end w-1/3 px-2">
                    <p className="">{invoice.totalAmount + totalDiscount}</p>
                  </div>
                </span>
                {totalDiscount > 0 ? (
                  <span className="flex justify-between font-bold mb-2">
                    <div className="flex justify-end w-2/3">
                      <p>Discount:</p>
                    </div>
                    <div className="flex justify-end w-1/3 px-2">
                      <p className="">{totalDiscount}</p>
                    </div>
                  </span>
                ) : (
                  ""
                )}
                <span className="flex p-2 justify-between font-bold mb-2 bg-[#fdca01] print:bg-stone-950 print:text-white">
                  <div className="flex justify-end w-2/3">
                    <p>Total Payment:</p>
                  </div>
                  <div className="flex justify-end w-1/3">
                    <p className="">{invoice.totalAmount}</p>
                  </div>
                </span>
                <span className="flex justify-between font-bold mb-2">
                  <div className="flex justify-end w-2/3">
                    <p>Advance Payment:</p>
                  </div>
                  <div className="flex justify-end w-1/3 px-2">
                    <p className="">
                      {transactions.reduce((acc, obj) => {
                        return acc + obj.amount;
                      }, 0)}
                    </p>
                  </div>
                </span>
                <span
                  className={`flex justify-between text-left font-semibold md:text-lg print:text-lg border-stone-950 text-stone-950`}
                >
                  <div className="flex justify-end w-2/3 text-base font-bold mb-2">
                    <p>{invoice.amountDue! > 0 ? "Remaining Payment:" : "FULLY PAID ✅"}</p>
                  </div>
                  <div className="flex justify-end w-1/3 px-2">
                    <p className={`font-semibold text-base border-stone-950`}>
                      {invoice.amountDue! > 0 ? invoice.amountDue! : ""}
                    </p>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </table>
      </div>
      <div className="px-4 mb-4">
        <p className="font-bold text-xl">Thank you for being our valuable customer 😊</p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row print:flex-row justify-between px-4 mb-4">
        <div>
          <p className="font-bold text-md">TERMS & CONDITIONS</p>
          <ol className="list-decimal list-inside text-sm">
            <li>Any technical glitches may delay the work</li>
            <li>Advance will not be refunded in case of order cancellation</li>
          </ol>
        </div>
      </div>
      <div className="px-4 mb-4">
        <p className="font-bold text-lg flex flex-col">
          Follow us on Daraz for online shopping
          <span className="text-sm font-semibold">www.daraz.pk/shop/lucky-arts-1681900840</span>
        </p>
      </div>
      <div className="flex flex-col md:flex-row print:flex-row justify-between items-center px-4 mb-4">
        <div className="flex gap-1 text-sm">
          <span className="flex items-center gap-1">
            <FaGlobe /> www.luckyarts.co
          </span>
          <span className="flex items-center gap-1">
            <FaFacebook /> @luckyarts.pk
          </span>
          <span className="flex items-center gap-1">
            <FaInstagram /> @luckyarts.pk
          </span>
          <span className="flex items-center gap-1">
            <FaYoutube />
            @luckyarts.pk
          </span>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <span className="font-bold">_________________________________</span>
          <span>Authorized Signature</span>
        </div>
      </div>
    </div>
  );
});
