import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { and, asc, between, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { useMemo, useState } from "react";
import { expense, expenseItems } from "db/schema";
import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

const PAGE_SIZE = 10;

type ExpenseLineItem = {
  id?: number;
  amount: number | string;
  description: string;
};

async function getNextExpenseDisplayNumber(shopId: number): Promise<number> {
  const result = await db
    .select({ maxDisplayNumber: expense.displayNumber })
    .from(expense)
    .where(and(eq(expense.shopId, shopId), sql`${expense.displayNumber} IS NOT NULL`))
    .orderBy(desc(expense.displayNumber))
    .limit(1);

  if (result.length === 0 || result[0].maxDisplayNumber === null) {
    return 1;
  }

  return result[0].maxDisplayNumber + 1;
}

function getExpenseDisplayNumber(item: { id: number; displayNumber?: number | null }) {
  return item.displayNumber ?? item.id;
}

function getRedirectTo(form: FormData) {
  const redirectTo = form.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/dashboard/expenses")) {
    return redirectTo;
  }
  return "/dashboard/expenses";
}

function parseExpenseItems(form: FormData) {
  const amounts = form.getAll("amount");
  const descriptions = form.getAll("description");
  const items = amounts.map((amountValue, index) => {
    const amount = Number(amountValue);
    const description = String(descriptions[index] || "").trim();

    return {
      amount,
      description,
      rowOrder: index,
    };
  });

  if (
    items.length === 0 ||
    items.some((item) => !Number.isInteger(item.amount) || item.amount <= 0 || !item.description)
  ) {
    return null;
  }

  return items;
}

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const filters = [eq(expense.shopId, user.shopId!)];

  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filters.push(between(expense.createdAt, fromDate, toDate));
  } else if (from) {
    filters.push(gte(expense.createdAt, new Date(from)));
  } else if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filters.push(lte(expense.createdAt, toDate));
  }

  const where = and(...filters);

  const data = await db
    .select()
    .from(expense)
    .where(where)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)
    .orderBy(desc(expense.createdAt));

  const expenseIds = data.map((item) => item.id);
  const itemRows = expenseIds.length
    ? await db
        .select()
        .from(expenseItems)
        .where(inArray(expenseItems.expenseId, expenseIds))
        .orderBy(asc(expenseItems.rowOrder), asc(expenseItems.id))
    : [];

  const itemsByExpenseId = itemRows.reduce<Record<number, typeof itemRows>>((itemsById, item) => {
    if (!itemsById[item.expenseId]) {
      itemsById[item.expenseId] = [];
    }
    itemsById[item.expenseId].push(item);
    return itemsById;
  }, {});

  const expenses = data.map((item) => ({
    ...item,
    items: itemsByExpenseId[item.id] || [
      {
        id: item.id,
        expenseId: item.id,
        amount: item.amount,
        description: item.description,
        rowOrder: 0,
      },
    ],
  }));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(expense)
    .where(where);

  const [{ totalExpense }] = await db
    .select({ totalExpense: sql<number>`coalesce(sum(${expense.amount}), 0)` })
    .from(expense)
    .where(where);

  return json({ expenses, total, totalExpense });
}

export async function action({ request }: ActionArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");

  const form = await request.formData();
  const action = form.get("action") as string;
  const redirectTo = getRedirectTo(form);

  if (action === "create") {
    const lineItems = parseExpenseItems(form);

    if (!lineItems) {
      return redirect("/dashboard/expenses");
    }

    const totalAmount = lineItems.reduce((total, item) => total + item.amount, 0);
    const previewDescription = lineItems[0].description;
    const displayNumber = await getNextExpenseDisplayNumber(user.shopId!);

    db.transaction((tx) => {
      const newExpense = tx
        .insert(expense)
        .values({
          amount: totalAmount,
          description: previewDescription,
          userId: user.id,
          shopId: user.shopId!,
          displayNumber,
        })
        .returning({ id: expense.id })
        .get();

      tx.insert(expenseItems).values(
        lineItems.map((item) => ({
          expenseId: newExpense.id,
          amount: item.amount,
          description: item.description,
          rowOrder: item.rowOrder,
        }))
      ).run();
    });

    return redirect("/dashboard/expenses");
  }

  if (action === "edit") {
    const id = Number(form.get("id"));
    const lineItems = parseExpenseItems(form);

    if (!Number.isInteger(id) || !lineItems) {
      return redirect(redirectTo);
    }

    const existingExpense = await db
      .select({ id: expense.id })
      .from(expense)
      .where(and(eq(expense.id, id), eq(expense.shopId, user.shopId!)))
      .limit(1);

    if (existingExpense.length === 0) {
      return redirect(redirectTo);
    }

    const totalAmount = lineItems.reduce((total, item) => total + item.amount, 0);
    const previewDescription = lineItems[0].description;

    db.transaction((tx) => {
      tx
        .update(expense)
        .set({ amount: totalAmount, description: previewDescription })
        .where(and(eq(expense.id, id), eq(expense.shopId, user.shopId!)))
        .run();

      tx.delete(expenseItems).where(eq(expenseItems.expenseId, id)).run();
      tx.insert(expenseItems).values(
        lineItems.map((item) => ({
          expenseId: id,
          amount: item.amount,
          description: item.description,
          rowOrder: item.rowOrder,
        }))
      ).run();
    });

    return redirect(redirectTo);
  }

  if (action === "delete") {
    const id = Number(form.get("id"));

    if (Number.isInteger(id)) {
      const existingExpense = await db
        .select({ id: expense.id })
        .from(expense)
        .where(and(eq(expense.id, id), eq(expense.shopId, user.shopId!)))
        .limit(1);

      if (existingExpense.length === 0) {
        return redirect(redirectTo);
      }

      db.transaction((tx) => {
        tx
          .delete(expenseItems)
          .where(eq(expenseItems.expenseId, id))
          .run();
        tx
          .delete(expense)
          .where(and(eq(expense.id, id), eq(expense.shopId, user.shopId!)))
          .run();
      });
    }

    return redirect(redirectTo);
  }

  return redirect(redirectTo);
}

export default function ExpensesIndex() {
  const { expenses, total, totalExpense } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const transition = useNavigation();
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit">("create");
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [expenseRows, setExpenseRows] = useState<ExpenseLineItem[]>([
    { amount: "", description: "" },
  ]);
  const expenseRowsTotal = useMemo(
    () => expenseRows.reduce((total, row) => total + (Number(row.amount) || 0), 0),
    [expenseRows]
  );

  const page = Number(searchParams.get("page") || "1");
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const showingFrom = total === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, total);
  const showingTo = Math.min(page * PAGE_SIZE, total);
  const currentPath = searchParams.toString()
    ? `/dashboard/expenses?${searchParams.toString()}`
    : "/dashboard/expenses";

  function formatDate(inputDate: any) {
    const date = new Date(inputDate);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB");
  }

  function openModal(mode: "create" | "view" | "edit", item: any | null = null) {
    setModalMode(mode);
    setSelectedExpense(item);
    if (mode === "edit" && item?.items?.length) {
      setExpenseRows(
        item.items.map((lineItem: any) => ({
          id: lineItem.id,
          amount: lineItem.amount,
          description: lineItem.description,
        }))
      );
    } else {
      setExpenseRows([{ amount: "", description: "" }]);
    }
    const modal = document.getElementById("expenseModal");
    if (modal) modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = document.getElementById("expenseModal");
    if (modal) modal.classList.add("hidden");
    setSelectedExpense(null);
    setModalMode("create");
    setExpenseRows([{ amount: "", description: "" }]);
  }

  function addExpenseRow() {
    setExpenseRows((rows) => [...rows, { amount: "", description: "" }]);
  }

  function removeExpenseRow(index: number) {
    setExpenseRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  }

  function updateExpenseRow(index: number, field: keyof ExpenseLineItem, value: number | string) {
    setExpenseRows((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
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
                          to="/dashboard/expenses"
                          className="ml-1 text-gray-700 hover:text-[#f3c41a] md:ml-2 dark:text-gray-300 dark:hover:text-white"
                        >
                          Expenses
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
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All expenses</h1>
              </div>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Form method="get" action="/dashboard/expenses" className="w-full lg:w-auto">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <label className="font-semibold text-gray-700 dark:text-gray-300 min-w-[48px]" htmlFor="from">
                        From
                      </label>
                      <input
                        className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-2xl focus:ring-2 focus:ring-[#f3c41a]/50 focus:border-[#f3c41a] block p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        type="date"
                        name="from"
                        id="from"
                        defaultValue={from}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="font-semibold text-gray-700 dark:text-gray-300 min-w-[48px]" htmlFor="to">
                        To
                      </label>
                      <input
                        className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-2xl focus:ring-2 focus:ring-[#f3c41a]/50 focus:border-[#f3c41a] block p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        type="date"
                        name="to"
                        id="to"
                        defaultValue={to}
                      />
                    </div>
                    <button className="w-full sm:w-auto bg-[#f3c41a] hover:bg-[#e6b800] text-gray-900 font-semibold rounded-2xl text-sm px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f3c41a]/50">
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </span>
                    </button>
                  </div>
                </Form>
                <div className="flex items-center lg:ml-auto">
                  <button
                    type="button"
                    onClick={() => openModal("create")}
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
                    Add expense
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
                        <th scope="col" className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400">
                          ID
                        </th>
                        <th scope="col" className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400">
                          Amount
                        </th>
                        <th scope="col" className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400">
                          Description
                        </th>
                        <th scope="col" className="p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400">
                          Date
                        </th>
                        <th scope="col" className="w-72 p-4 text-xs font-medium text-left text-white uppercase dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={100} className="w-full text-gray-500 text-sm p-4 sm:p-6 text-center">
                            There are no expenses to show. Please add a new expense or change your date filter
                          </td>
                        </tr>
                      )}
                      {expenses.map((item) => (
                        <tr
                          className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            transition.state === "idle" ? "text-gray-900" : "text-gray-500"
                          }`}
                          key={item.id}
                        >
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">#{getExpenseDisplayNumber(item)}</td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            Rs. {item.amount}
                          </td>
                          <td className="p-4 text-base font-medium dark:text-white">
                            <span className="block max-w-[56rem] truncate" title={item.description}>
                              {item.description}
                            </span>
                          </td>
                          <td className="p-4 text-base font-medium whitespace-nowrap dark:text-white">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="w-72 p-4 space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openModal("view", item)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-gray-900 border border-gray-900 hover:bg-[#f3c41a] focus:ring-2 focus:ring-[#f3c41a]"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("edit", item)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg text-gray-900 border border-gray-900 hover:bg-[#f3c41a] focus:ring-2 focus:ring-[#f3c41a]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const shouldDelete = confirm("Do you want to delete this expense?");
                                if (shouldDelete) {
                                  submit(
                                    { id: item.id, action: "delete", redirectTo: currentPath },
                                    { method: "POST" }
                                  );
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
                disabled={page <= 1}
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
                disabled={page >= totalPages}
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
                  {`${showingFrom}-${showingTo}`}
                </span>{" "}
                of <span className="font-semibold text-gray-900 dark:text-white">{`${total}`}</span>
              </span>
            </div>
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Total expense:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                Rs. {totalExpense}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div id="expenseModal" className="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {modalMode === "view" ? "View Expense" : modalMode === "edit" ? "Edit Expense" : "Add Expense"}
            </h3>
            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {modalMode === "view" && selectedExpense ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-4 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <p className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">#{getExpenseDisplayNumber(selectedExpense)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                      {formatDate(selectedExpense.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <p className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                      Rs. {selectedExpense.amount}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-13 gap-2 min-w-[475px] border-b border-gray-200 pb-2 text-sm font-medium text-gray-700">
                    <span>Sr</span>
                    <span className="col-span-7">Description</span>
                    <span className="col-span-5 text-right">Amount (Rs.)</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {(selectedExpense.items || []).map((lineItem: any, index: number) => (
                      <div key={lineItem.id || index} className="grid grid-cols-13 gap-2 min-w-[475px] border-b border-gray-100 py-3">
                        <p className="font-medium block px-1 w-full text-sm text-gray-900">
                          {index + 1}
                        </p>
                        <p className="col-span-7 text-sm text-gray-900">{lineItem.description}</p>
                        <p className="col-span-5 text-right text-sm font-medium text-gray-900">Rs. {lineItem.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <Form
              method="post"
              className="flex min-h-0 flex-1 flex-col"
              key={`${modalMode}-${selectedExpense?.id || "new"}`}
              onSubmit={closeModal}
            >
              <input type="hidden" name="action" value={modalMode === "edit" ? "edit" : "create"} />
              <input type="hidden" name="redirectTo" value={currentPath} />
              {modalMode === "edit" && selectedExpense && <input type="hidden" name="id" value={selectedExpense.id} />}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-13 gap-2 min-w-[475px] text-sm font-medium text-gray-900">
                    <label>Sr</label>
                    <label className="col-span-7">Description</label>
                    <label className="col-span-4 text-right">Amount (Rs.)</label>
                    <span aria-hidden="true"></span>
                  </div>
                  <div className="space-y-3">
                    {expenseRows.map((row, index) => (
                      <div key={`${modalMode}-${selectedExpense?.id || "new"}-${index}`} className="grid grid-cols-13 gap-x-2 gap-y-1 min-w-[475px] mt-3 pb-1">
                        <p className="font-medium block py-2.5 px-1 w-full text-sm text-gray-900 bg-transparent border-0 border-gray-300 appearance-none focus:outline-none focus:ring-0 peer">
                          {index + 1}
                        </p>
                        <input
                          name="description"
                          type="text"
                          placeholder="Expense detail"
                          required
                          value={row.description}
                          onChange={(event) => updateExpenseRow(index, "description", event.target.value)}
                          className="col-span-7 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f3c41a]/50 focus:border-[#f3c41a] block w-full p-2.5"
                        />
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Amount"
                          required
                          value={row.amount}
                          onChange={(event) => updateExpenseRow(index, "amount", event.target.value)}
                          className="text-right col-span-4 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f3c41a]/50 focus:border-[#f3c41a] block w-full p-2.5"
                        />
                        <button
                          type="button"
                          onClick={() => removeExpenseRow(index)}
                          disabled={expenseRows.length === 1}
                          className="text-gray-400 bg-transparent disabled:text-gray-400 hover:text-gray-900 rounded-lg text-sm items-center"
                        >
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4"
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
                          <span className="sr-only">Remove expense row</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-13 gap-2 min-w-[475px] mt-3 pt-3 border-t border-gray-200 items-center">
                    <span className="col-span-8 text-right text-sm pr-1 font-bold block w-full text-gray-900">
                      Total (Rs.)
                    </span>
                    <p className="col-span-4 text-right font-bold block py-2.5 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300">
                      {expenseRowsTotal}
                    </p>
                    <span aria-hidden="true"></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addExpenseRow}
                  className="font-medium rounded-lg text-xs px-3 py-2 text-slate-900 border border-slate-900 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900"
                >
                  Add new row
                </button>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#f3c41a] border border-[#f3c41a] rounded-md hover:bg-[#f3c41a] focus:outline-none focus:ring-2 focus:ring-[#f3c41a]"
                >
                  {modalMode === "edit" ? "Update" : "Add"}
                </button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
