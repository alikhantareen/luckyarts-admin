import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form, Link } from "@remix-run/react";
import { z } from "zod";
import ReactToPrint from "react-to-print";
import { FaWhatsapp, FaLocationDot, FaGlobe, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa6";
import { SiGmail } from "react-icons/si";
import second_logo from "../assets/second_logo.png";
import bill_logo from "../assets/final_logo.png";

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

  const [formData, setFormData] = useState<any | null>(null);
  const componentRef = useRef<HTMLDivElement | null>(null);

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

      // Reset form data
      setFormData(null);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission

    // Update the input element identifiers
    const customerName = (event.currentTarget.elements.namedItem("customerNameQuotation") as HTMLInputElement).value;
    const customerPhone = (event.currentTarget.elements.namedItem("customerPhoneQuotation") as HTMLInputElement).value;

    // Prepare items information
    const formattedItems = items.map((item, index) => ({
      name: item.itemName,
      price: item.itemPrice,
      quantity: item.itemQuantity,
      description: item.itemDescription,
      discount: item.itemDiscount,
      subtotal: item.itemPrice * item.itemQuantity - item.itemDiscount,
    }));

    // Prepare the complete form data
    const quotationData = {
      customer: {
        name: customerName,
        phone: customerPhone,
      },
      items: formattedItems,
      total: total + items.map((i) => i.itemDiscount).reduce((p, n) => p + n, 0),
    };

    // Set form data to trigger print
    setFormData(quotationData);

    // Trigger print dialog after a short delay to ensure the component is rendered
    setTimeout(() => {
      if (componentRef.current) {
        const printTrigger = document.querySelector(".react-to-print-trigger") as HTMLButtonElement;
        if (printTrigger) {
          printTrigger.click();
        }
      }
    }, 100);
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

      <Form method="post" onSubmit={handleSubmit}>
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

      {formData && (
        <div className="hidden">
          <ReactToPrint
            trigger={() => (
              <button type="button" className="react-to-print-trigger">
                Print
              </button>
            )}
            content={() => componentRef.current}
          />
          <QuotationPrintComponent ref={componentRef} quotationData={formData} />
        </div>
      )}
    </div>
  );
}

// New component for printing quotation
type QuotationPrintComponentProps = {
  quotationData: {
    customer: { name: string; phone: string };
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      description?: string;
      discount?: number;
      subtotal: number;
    }>;
    total: number;
  };
};

const QuotationPrintComponent = React.forwardRef<HTMLDivElement | null, QuotationPrintComponentProps>((props, ref) => {
  const { quotationData } = props;
  const totalDiscount = quotationData.items.map((i) => i.discount ?? 0).reduce((p, n) => p + n, 0);
  const currentDate = new Date();
  function formatDate(inputDate: Date) {
    return inputDate.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  }

  function extractTime(date: Date) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
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
            <FaLocationDot /> Abdali road near chowk fawara, Multan
          </p>
        </div>
        <p className="hidden font-lemon md:block print:block text-xs font-semibold md:absolute print:absolute top-[112px] left-[145px] print:left-[144px] print:text-white">
          THE NAME OF QUALITY
        </p>
      </div>
      <div className="flex justify-between px-4 mt-2">
        <div className="flex flex-col self-center">
          <p className="text-lg font-bold">Customer Details:</p>
          <p className="text-md italic">{quotationData.customer.name}</p>
          <p className="text-md italic">{quotationData.customer.phone}</p>
        </div>
        <div className="">
          <p className="text-lg font-bold">QUOTATION</p>
          <p className="text-lg font-bold">
            Date: <span className="font-normal">{formatDate(currentDate)}</span>
          </p>
          <p className="text-lg font-bold">
            Time: <span className="font-normal">{extractTime(currentDate)}</span>
          </p>
          <p className="text-lg font-bold">
            NTN#: <span className="font-normal">0103866-4</span>
          </p>
        </div>
      </div>
      <div className="p-4">
        <table className="w-full mt-3 md:mt-2 border-collapse">
          <thead>
            <tr className="grid grid-cols-5 md:grid-cols-9 print:grid-cols-9 text-right p-2 bg-stone-950 text-white">
              <th className="col-span-1 text-center text-sm">Sr.No#</th>
              <th className="col-span-2 md:col-span-4 print:col-span-4 text-center text-sm">Item Description</th>
              <th className="col-span-1 text-center text-sm">Size</th>
              <th className="hidden md:block print:block text-center text-sm">Price </th>
              <th className="hidden md:block print:block text-center text-sm">Qty</th>
              <th className="col-span-1 text-right text-sm">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {quotationData.items.map((elem, key) => (
              <tr key={key} className={`grid grid-cols-5 md:grid-cols-9 print:grid-cols-9`}>
                <td className="col-span-1 text-center border-b-2 border-l-2 border-t-2 border-stone-950 font-bold">
                  <p className="">{key + 1}</p>
                </td>
                <td className="col-span-2 md:col-span-4 print:col-span-4 text-left px-2 border-b-2 border-l-2 border-t-2 border-stone-950 font-bold">
                  <p className="">{elem.name}</p>
                </td>
                <td className="col-span-1 font-bold text-center border-b-2 border-l-2 border-t-2 border-stone-950">
                  {elem.description || ""}
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
            ))}
          </tbody>
          <div className="w-full flex justify-end">
            <div className="border-b-2 border-l-2 border-r-2 border-stone-950 w-[18rem] flex flex-col">
              <div className="mt-2 mb-2">
                <span className="flex justify-between font-bold mb-2 text-stone-950 ">
                  <div className="flex justify-end w-2/3">
                    <p>Sub Total:</p>
                  </div>
                  <div className="flex justify-end w-1/3 px-2">
                    <p className="">{quotationData.total}</p>
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
                <span className="flex p-2 -mb-2 justify-between font-bold bg-[#fdca01] print:bg-stone-950 print:text-white">
                  <div className="flex justify-end w-2/3">
                    <p>Total Payment:</p>
                  </div>
                  <div className="flex justify-end w-1/3">
                    <p className="">{quotationData.total - totalDiscount}</p>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </table>
      </div>
      <div className="px-4 mb-4">
        <p className="font-bold text-xl">Thank you for your interest 😊</p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row print:flex-row justify-between px-4 mb-4">
        <div>
          <p className="font-bold text-md">TERMS & CONDITIONS</p>
          <ol className="list-decimal list-inside text-sm">
            <li>Quotation is valid for 7 days from the date of issue</li>
            <li>Prices are subject to change without prior notice</li>
            <li>Final pricing will be confirmed upon order placement</li>
          </ol>
        </div>
      </div>
      <div className="px-4 mb-4">
        <p className="font-bold text-lg flex flex-col">
          For online shopping, please visit our store at
          <span className="text-md font-normal">www.luckyarts.org</span>
        </p>
      </div>
      <div className="flex flex-col md:flex-row print:flex-row justify-between items-center px-4 mb-4">
        <div className="flex gap-1 text-sm">
          <span className="flex items-center gap-1">
            <FaGlobe /> www.luckyarts.org
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
