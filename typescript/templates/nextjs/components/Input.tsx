import { ComponentProps, useId } from "react";

export function Input({
  label,
  ...props
}: ComponentProps<"input"> & { label: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2">
        <input
          {...props}
          id={id}
          className="block w-full rounded-xl border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
        />
      </div>
    </div>
  );
}
