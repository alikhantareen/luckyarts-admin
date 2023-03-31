import { NavLink } from "react-router-dom";
import maintenanceImage from "../../../assets/maintenance.svg";

export default function Index() {
  return (
    <div className="flex flex-col justify-center items-center px-6 mx-auto h-[calc(100vh-74px)] xl:px-0 dark:bg-gray-900">
      <div className="block mb-5 md:max-w-md">
        <img src={maintenanceImage} alt="Maintenance" />
      </div>
      <div className="text-center xl:max-w-4xl">
        <h1 className="mb-3 text-2xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
          Work In Progress
        </h1>
        <p className="mb-5 text-base font-normal text-gray-500 md:text-lg dark:text-gray-400">
          Hang out with us a bit more as we're still building this one out.
          Please check out the invoices page meanwhile
        </p>
        <NavLink
          to="/invoices"
          className="w-full sm:w-fit text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Go to Invoices
        </NavLink>
      </div>
    </div>
  );
}
