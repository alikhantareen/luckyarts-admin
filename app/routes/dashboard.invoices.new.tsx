import { ActionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useNavigation } from "@remix-run/react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { db } from "~/utils/db.server";
import { customers, invoices, items as itemsSchema, transactions } from "db/schema";
import { requireUserId } from "~/utils/session.server";

export const InvoiceFormSchema = z.object({
  customer: z.object({
    name: z.string().min(1, { message: "Customer name is required" }),
    phone: z.string().min(1, { message: "Customer phone is required" }),
  }),
  items: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Item name is required" }),
        price: z.number().min(0, { message: "Item price is required" }),
        quantity: z.number().min(1, { message: "Item quantity is required" }),
        description: z.string().optional(),
        discount: z.number().optional(),
      })
    )
    .nonempty(),
  amountPaid: z.number().min(0),
});

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const itemNames = formData.getAll("itemName");
  const itemPrices = formData.getAll("itemPrice");
  const itemDiscounts = formData.getAll("itemDiscount");
  const itemQuantities = formData.getAll("itemQuantity");
  const itemDescriptions = formData.getAll("itemDescription");
  const amountPaid = Number(formData.get("amountPaid"));
  const customer = {
    name: formData.get("customerName") as string,
    phone: formData.get("customerPhone") as string,
  };
  const items: { name: string; price: number; discount: number; quantity: number; description: string }[] = [];
  for (let i = 0; i < itemNames.length; i++) {
    const itemName = itemNames[i] as string;
    const itemPrice = Number(itemPrices[i]);
    const itemDiscount = Number(itemDiscounts[i]);
    const itemQuantity = Number(itemQuantities[i]);
    const itemDescription = itemDescriptions[i] as string;
    items.push({
      name: itemName,
      price: itemPrice,
      discount: itemDiscount,
      quantity: itemQuantity,
      description: itemDescription,
    });
  }
  const parseResult = InvoiceFormSchema.safeParse({ customer, items, amountPaid });
  if (!parseResult.success) {
    console.log({ parseError: parseResult.error });
    return json(parseResult.error);
  }

  const totalAmount = items
    .map((i) => i.price * i.quantity - i.discount * i.quantity)
    .reduce((prev, curr) => prev + curr, 0);
  if (amountPaid > totalAmount) {
    return json({
      issues: [{ message: "Amount paid cannot be greater than total amount" }],
    });
  }
  const amountDue = totalAmount - amountPaid;

  const invoiceId: number = await db.transaction(async (tx) => {
    let res = await tx.insert(customers).values(customer);
    const customerId = Number(res.lastInsertRowid);
    const status = amountDue === 0 ? "FullyPaid" : amountDue < totalAmount ? "PartialPaid" : undefined;
    res = await tx.insert(invoices).values({ userId, customerId, totalAmount, amountDue, status });
    const invoiceId = Number(res.lastInsertRowid);
    for (const item of items) {
      await tx.insert(itemsSchema).values({ ...item, invoiceId });
    }
    if (amountPaid > 0) {
      await tx.insert(transactions).values({ userId, invoiceId, amount: amountPaid });
    }
    return invoiceId;
  });

  return redirect(`/dashboard/invoices/${invoiceId}`);
};

export default function NewInvoiceRoute() {
  const transition = useNavigation();

  const [items, setItems] = useState([{ itemName: "", itemPrice: 0, itemDiscount: 0, itemQuantity: 1 }]);
  const [paid, setPaid] = useState(0);

  const subtotals = useMemo(
    () =>
      items.map((i) => {
        return i.itemPrice * i.itemQuantity - i.itemDiscount * i.itemQuantity;
      }),
    [items]
  );
  const total = useMemo(() => {
    return subtotals.reduce((p, c) => p + c, 0);
  }, [subtotals]);
  const amountDue = useMemo(() => {
    return total - paid;
  }, [total, paid]);

  return (
    <div className="mx-auto max-w-3xl lg:mt-1.5 p-4">
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
                New
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <h2 className="mb-4 text-3xl font-bold text-gray-900">Add a new invoice</h2>
      <Form method="post" action="/dashboard/invoices/new">
        <fieldset disabled={transition.state === "submitting"} className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-lg font-medium text-white px-4 py-2 bg-gray-800 sm:col-span-2 rounded-sm">
            Customer Information
          </h3>
          <p className="w-full px-4 sm:pr-0">
            <label htmlFor="customerName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Name
            </label>
            <input
              name="customerName"
              type="text"
              placeholder="Type customer name"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            />
          </p>
          <p className="w-full px-4 sm:pl-0">
            <label htmlFor="customerPhone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Phone
            </label>
            <input
              name="customerPhone"
              type="text"
              maxLength={11}
              minLength={11}
              placeholder="Type customer phone"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            />
          </p>
          <h3 className="mx-[-4] mt-6 text-lg font-medium px-4 py-2 text-white bg-gray-800 sm:col-span-2 rounded-sm">
            Items Information
          </h3>
          <div className="overflow-x-auto sm:col-span-2 px-4">
            <div className="grid grid-cols-13 sm:grid-cols-26 gap-2 min-w-[475px]">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Sr</label>
              <label className="col-span-6 sm:col-span-12 block text-sm font-medium text-gray-900 dark:text-white">
                Item
              </label>
              <label className="block text-right col-span-2 sm:col-span-3 text-sm font-medium pr-1 text-gray-900 dark:text-white">
                Qty
              </label>
              <label className="block text-right col-span-2 sm:col-span-5 text-sm font-medium pr-1 text-gray-900 dark:text-white">
                Price (Rs.)
              </label>
              <label className="block col-span-2 sm:col-span-5 text-right text-sm font-medium  text-gray-900 dark:text-white">
                Total (Rs.)
              </label>
            </div>
            {items.map((item, idx) => (
              <p className="grid grid-cols-13 sm:grid-cols-26 gap-x-2 gap-y-1 min-w-[475px] mt-3 pb-1" key={idx}>
                <p className="font-medium block py-2.5 px-1 w-full text-sm text-gray-900 bg-transparent border-0  border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer">
                  {idx + 1}
                </p>
                <input
                  name="itemName"
                  placeholder="Item detail"
                  value={item.itemName}
                  required
                  onChange={(e) =>
                    setItems(
                      items.map((item, index) => {
                        if (index === idx) {
                          return { ...item, itemName: e.target.value };
                        } else {
                          return item;
                        }
                      })
                    )
                  }
                  className="col-span-6 sm:col-span-12 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
                <input
                  name="itemQuantity"
                  placeholder="Item quantity"
                  type="number"
                  value={item.itemQuantity}
                  onChange={(e) =>
                    setItems(
                      items.map((item, index) => {
                        if (index === idx) {
                          return {
                            ...item,
                            itemQuantity: Number(e.target.value),
                          };
                        } else {
                          return item;
                        }
                      })
                    )
                  }
                  className="text-right col-span-2 sm:col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  min="1"
                  required
                />
                <input
                  name="itemPrice"
                  placeholder="Item price"
                  type="number"
                  required
                  value={item.itemPrice}
                  onChange={(e) =>
                    setItems(
                      items.map((item, index) => {
                        if (index === idx) {
                          return { ...item, itemPrice: Number(e.target.value) };
                        } else {
                          return item;
                        }
                      })
                    )
                  }
                  className="text-right col-span-2 sm:col-span-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  min="0"
                />
                <input
                  disabled
                  value={subtotals[idx] + item.itemDiscount * item.itemQuantity}
                  type="number"
                  className="col-span-2 sm:col-span-5 text-right font-medium block py-2.5 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                />
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                  className="text-gray-400 bg-transparent disabled:text-gray-400 hover:text-gray-900 rounded-lg  text-sm items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
                  <span className="sr-only">Remove item</span>
                </button>
                <textarea
                  rows={1}
                  name="itemDescription"
                  placeholder="Item size"
                  className="col-span-8 sm:col-[2/17] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                ></textarea>
                <input
                  name="itemDiscount"
                  placeholder="Discount"
                  type="number"
                  min={0}
                  max={item.itemPrice}
                  onChange={(e) =>
                    setItems(
                      items.map((item, index) => {
                        if (index === idx) {
                          return {
                            ...item,
                            itemDiscount: Number(e.target.value),
                          };
                        } else {
                          return item;
                        }
                      })
                    )
                  }
                  className="text-right col-span-2 sm:col-span-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </p>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-26 gap-2 sm:col-span-2 px-4 items-center">
            <button
              type="button"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    itemName: "",
                    itemPrice: 0,
                    itemDiscount: 0,
                    itemQuantity: 1,
                  },
                ])
              }
              className="col-span-full sm:col-span-4 sm:col-start-2 font-medium rounded-lg text-xs px-3 py-2 text-slate-900 border border-slate-900 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900 dark:focus:ring-[#f3c41a] dark:hover:bg-[#f3c41a]"
            >
              Add item
            </button>
            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block w-full text-gray-900">
              Net Total (Rs.)
            </span>
            <input
              disabled
              value={total + items.map((i) => i.itemDiscount * i.itemQuantity).reduce((p, n) => p + n, 0)}
              type="number"
              className="sm:col-span-5 text-right font-bold block w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block w-full text-gray-900">
              Discount Total (Rs.)
            </span>
            <input
              disabled
              value={items.map((i) => i.itemDiscount * i.itemQuantity).reduce((p, n) => p + n, 0)}
              type="number"
              className="sm:col-span-5 text-right font-bold block w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block w-full text-gray-900">
              After Discount (Rs.)
            </span>
            <input
              disabled
              value={total}
              type="number"
              className="sm:col-span-5 text-right font-bold block w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block py-2.5 w-full text-gray-900">
              Advance Payment (Rs.)
            </span>
            <input
              name="amountPaid"
              placeholder="Paid"
              type="number"
              min="0"
              max={total}
              value={paid}
              onChange={(e) => setPaid(Number(e.target.value))}
              className="sm:col-span-5 text-right bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            />
            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block py-2.5 w-full text-gray-900">
              Remaining Payment (Rs.)
            </span>
            <input
              disabled
              value={amountDue}
              type="number"
              className="sm:col-span-5 text-right font-bold block p-2.5 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
          </div>
          <p className="sm:col-start-2 sm:ml-auto mt-6">
            <button
              type="submit"
              className="w-full sm:w-fit text-slate-900 bg-[#f3c41a] focus:ring-2 focus:ring-slate-900 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-[#f3c41a] focus:outline-none dark:focus:ring-slate-900"
            >
              {transition.state === "submitting" ? "Creating..." : "Create invoice"}
            </button>
          </p>
        </fieldset>
      </Form>
    </div>
  );
}
