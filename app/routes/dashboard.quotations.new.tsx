import React, { useState, useMemo, useEffect } from "react";
import { Form, Link } from "@remix-run/react";
import { z } from "zod";
import { ActionArgs, json, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { customers, invoices, items as itemsSchema } from "db/schema";
import { getUser } from "~/utils/session.server";

// Zod schema for quotation form validation
export const QuotationFormSchema = z.object({
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
});


export const action = async ({ request }: ActionArgs) => {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  const userId = user.id;
  const formData = await request.formData();
  const itemNames = formData.getAll("itemNameQuotation");
  const itemPrices = formData.getAll("itemPriceQuotation");
  const itemDiscounts = formData.getAll("itemDiscountQuotation");
  const itemQuantities = formData.getAll("itemQuantityQuotation");
  const itemDescriptions = formData.getAll("itemDescriptionQuotation");
  const customer = {
    name: formData.get("customerNameQuotation") as string,
    phone: formData.get("customerPhoneQuotation") as string,
  };
  const items: { name: string; price: number; discount: number; quantity: number; description: string }[] = [];
  for (let i = 0; i < itemNames.length; i++) {
    items.push({
      name: itemNames[i] as string,
      price: Number(itemPrices[i]),
      discount: Number(itemDiscounts[i]),
      quantity: Number(itemQuantities[i]),
      description: itemDescriptions[i] as string,
    });
  }
  const parseResult = QuotationFormSchema.safeParse({ customer, items });
  if (!parseResult.success) {
    return json(parseResult.error);
  }
  const totalAmount = items
    .map((i) => i.price * i.quantity - i.discount)
    .reduce((p, c) => p + c, 0);
  const invoiceId: number = await db.transaction(async (tx) => {
    let res = await tx.insert(customers).values({ ...customer, shopId: user.shopId! });
    const customerId = Number(res.lastInsertRowid);
    res = await tx.insert(invoices).values({
      userId,
      customerId,
      totalAmount,
      amountDue: totalAmount,
      type: "Quotation",
      shopId: user.shopId!,
    });
    const invoiceId = Number(res.lastInsertRowid);
    for (const item of items) {
      await tx.insert(itemsSchema).values({ ...item, invoiceId, shopId: user.shopId! });
    }
    return invoiceId;
  });

  return redirect(`/dashboard/quotations/${invoiceId}`);
};

export default function NewQuotationRoute() {
  const [items, setItems] = useState([
    {
      itemName: "",
      itemPrice: 0,
      itemDiscount: 0,
      itemQuantity: 1,
      itemDescription: "",
    },
  ]);


  // Reset form state when component unmounts
  useEffect(() => {
    return () => {
      // Reset items to initial state
      setItems([
        {
          itemName: "",
          itemPrice: 0,
          itemDiscount: 0,
          itemQuantity: 1,
          itemDescription: "",
        },
      ]);

    };
  }, []); // Empty dependency array ensures this runs only on unmount

  const subtotals = useMemo(
    () =>
      items.map((i) => {
        return i.itemPrice * i.itemQuantity - i.itemDiscount;
      }),
    [items]
  );

  const total = useMemo(() => {
    return subtotals.reduce((p, c) => p + c, 0);
  }, [subtotals]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        itemPrice: 0,
        itemDiscount: 0,
        itemQuantity: 1,
        itemDescription: "",
      },
    ]);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, index) => index !== indexToRemove));
    }
  };

  const updateItem = (index: number, updates: Partial<typeof items[0]>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };


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
                to="/dashboard/quotations"
                className="ml-1 text-gray-700 hover:text-primary-600 md:ml-2 dark:text-gray-300 dark:hover:text-white"
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
                New
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <h2 className="mb-4 text-3xl font-bold text-gray-900">Create a new quotation</h2>

      <Form method="post" >
        <fieldset className="grid gap-4 sm:grid-cols-2">
          {/* Customer Information Section */}
          <h3 className="text-lg font-medium text-white px-4 py-2 bg-gray-800 sm:col-span-2 rounded-sm">
            Customer Information
          </h3>
          <p className="w-full px-4 sm:pr-0">
            <label className="block mb-2 text-sm font-medium text-gray-900">Name</label>
            <input
              name="customerNameQuotation"
              type="text"
              placeholder="Customer name"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
            />
          </p>
          <p className="w-full px-4 sm:pl-0">
            <label className="block mb-2 text-sm font-medium text-gray-900">Phone</label>
            <input
              name="customerPhoneQuotation"
              type="text"
              placeholder="Customer phone"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
            />
          </p>

          {/* Items Section */}
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
              <div key={idx} className="grid grid-cols-13 sm:grid-cols-26 gap-x-2 gap-y-1 min-w-[475px] mt-3 pb-1">
                <p className="font-medium block py-2.5 px-1 w-full text-sm text-gray-900">{idx + 1}</p>
                <input
                  name="itemNameQuotation"
                  placeholder="Item detail"
                  value={item.itemName}
                  required
                  onChange={(e) => updateItem(idx, { itemName: e.target.value })}
                  className="col-span-6 sm:col-span-12 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                />
                <input
                  name="itemQuantityQuotation"
                  type="number"
                  value={item.itemQuantity}
                  onChange={(e) => updateItem(idx, { itemQuantity: Number(e.target.value) })}
                  className="text-right col-span-2 sm:col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  min="1"
                  required
                />
                <input
                  name="itemPriceQuotation"
                  type="number"
                  value={item.itemPrice}
                  onChange={(e) => updateItem(idx, { itemPrice: Number(e.target.value) })}
                  className="text-right col-span-2 sm:col-span-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  min="0"
                  required
                />
                <input
                  disabled
                  value={subtotals[idx] + item.itemDiscount}
                  type="number"
                  className="sm:col-span-5 text-right font-bold block w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={items.length === 1}
                  className="text-gray-400 bg-transparent disabled:text-gray-400 hover:text-gray-900"
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
                  name="itemDescriptionQuotation"
                  rows={1}
                  placeholder="Item description"
                  value={item.itemDescription}
                  onChange={(e) => updateItem(idx, { itemDescription: e.target.value })}
                  className="col-span-8 sm:col-[2/17] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                />
                <input
                  name="itemDiscountQuotation"
                  placeholder="Discount"
                  type="number"
                  min={0}
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
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <div className="grid grid-cols-2 sm:grid-cols-26 gap-2 sm:col-span-2 px-4 items-center">
            <button
              type="button"
              onClick={handleAddItem}
              className="col-span-full sm:col-span-4 sm:col-start-2 font-medium rounded-lg text-xs px-3 py-2 text-slate-900 border border-slate-900 hover:bg-[#f7e5a4]"
            >
              Add item
            </button>

            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block w-full text-gray-900">
              Net Total (Rs.)
            </span>
            <input
              disabled
              value={total + items.map((i) => i.itemDiscount).reduce((p, n) => p + n, 0)}
              type="number"
              className="sm:col-span-5 text-right font-bold block w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            />
            <span className="sm:col-span-8 sm:col-start-[14] sm:text-right text-sm pr-1 font-bold block w-full text-gray-900">
              Discount Total (Rs.)
            </span>
            <input
              disabled
              value={items.map((i) => i.itemDiscount).reduce((p, n) => p + n, 0)}
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
          </div>

          {/* Submit Button */}
          <p className="sm:col-start-2 sm:ml-auto mt-6 flex items-center gap-2">
            <button
              type="submit"
              className="w-full sm:w-fit text-slate-900 bg-[#f3c41a] focus:ring-2 focus:ring-slate-900 font-medium rounded-lg text-sm px-5 py-2.5"
            >
              Create Quotation
            </button>
          </p>
        </fieldset>
      </Form>

    </div>
  );
}

