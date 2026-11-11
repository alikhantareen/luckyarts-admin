import { useState } from "react";

type DeliveryDateFieldProps = {
  name: string;
  defaultValue?: string | null;
};

/** Optional delivery date & time picker with a Clear button. Submits "" when cleared. */
export function DeliveryDateField({ name, defaultValue }: DeliveryDateFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <p className="w-full px-4 sm:pl-0">
      <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Delivery Date &amp; Time (Optional)
      </label>
      <span className="flex gap-2">
        <input
          id={name}
          name={name}
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="shrink-0 font-medium rounded-lg text-sm px-3 text-slate-900 border border-slate-900 hover:bg-[#f7e5a4] focus:ring-2 focus:ring-slate-900"
          >
            Clear
          </button>
        )}
      </span>
    </p>
  );
}
