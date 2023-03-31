import { NavLink } from "react-router-dom";
import maintenanceImage from "../../../assets/maintenance.svg";

export default function Index() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">
        Dashboard
      </h1>
      <div className="bg-white rounded-lg border-2 border-slate-300 p-8 mt-5 flex flex-col gap-5 w-fit">
        <div className="flex flex-col md:flex-row gap-5 p-2">
          <div className="flex items-center gap-3">
            <p className="font-bold">From</p>
            <input
              className="w-full"
              type="date"
              name="initialdate"
              id="initialdate"
            />
          </div>
          <div className="flex items-center gap-8">
            <p className="font-bold">To</p>
            <input
              className="w-full"
              type="date"
              name="initialdate"
              id="initialdate"
            />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">
            Invoices
          </h1>
          <div className="flex flex-col gap-5 md:flex-row mt-5">
            <a
              href="#"
              className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-48 md:h-32 p-6 bg-[#dd2822] rounded-lg shadow hover:bg-[#f40901] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
            >
              <p className="text-lg font-semibold">Unpaid</p>
              <p className="text-2xl font-semibold">23</p>
              <p className="text-xs font-semibold">Total Amount Due</p>
              <p className="text-xl font-semibold">Rs. 17000</p>
            </a>
            <a
              href="#"
              className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-48 md:h-32 p-6 bg-[#f3c41a] rounded-lg shadow hover:bg-[#FFCB06] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
            >
              <p className="text-lg font-semibold">Partial Paid</p>
              <p className="text-2xl font-semibold">23</p>
              <p className="text-xs font-semibold">Total Amount Due</p>
              <p className="text-xl font-semibold">Rs. 17000</p>
            </a>
            <a
              href="#"
              className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-48 md:h-32 p-6 bg-[#379d37] rounded-lg shadow hover:bg-[#2ab52a] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
            >
              <p className="text-lg font-semibold">Full Paid</p>
              <p className="text-2xl font-semibold">23</p>
              <p className="text-xs font-semibold">Total Amount Due</p>
              <p className="text-xl font-semibold">Rs. 17000</p>
            </a>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-white">
            Orders
          </h1>
          <div className="flex flex-col gap-5 md:flex-row mt-5">
            <a
              href="#"
              className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-48 md:h-32 p-6 bg-[#dd2822] rounded-lg shadow hover:bg-[#f40901] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
            >
              <p className="text-lg font-semibold">Pending</p>
              <p className="text-2xl font-semibold">15</p>
            </a>
            <a
              href="#"
              className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-48 md:h-32 p-6 bg-[#f3c41a] rounded-lg shadow hover:bg-[#FFCB06] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
            >
              <p className="text-lg font-semibold">In Progress</p>
              <p className="text-2xl font-semibold">9</p>
            </a>
            <a
              href="#"
              className="flex flex-col justify-center items-center text-slate-50 w-full h-40 md:w-48 md:h-32 p-6 bg-[#379d37] rounded-lg shadow hover:bg-[#2ab52a] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:-translate-y-1 duration-200 drop-shadow-xl"
            >
              <p className="text-lg font-semibold">Complete</p>
              <p className="text-2xl font-semibold">10</p>
            </a>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}
