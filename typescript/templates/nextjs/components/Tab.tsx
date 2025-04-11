"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, PropsWithChildren } from "react";

export function Tab({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof Link>>) {
  const pathname = usePathname();
  const isActive = pathname === props.href;

  return (
    <Link
      {...props}
      className={`${
        isActive
          ? "bg-gray-200 text-gray-800"
          : "text-gray-600 hover:text-gray-800"
      } rounded-md px-3 py-2 text-sm font-medium`}
    >
      {children}
    </Link>
  );
}
