import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { addressSchema, type AddressFormData } from "@/lib/profile-schema";
import type { Address } from "@/types";

interface AddEditAddressProps {
  address: Address | null;
  saving: boolean;
  error?: string;
  onSave: (data: AddressFormData) => void | Promise<void>;
  onCancel: () => void;
}

const inputClasses = (hasError: boolean): string =>
  `mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
  }`;

const labelClasses = "block text-sm font-medium text-gray-700";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const AddEditAddress = ({ address, saving, error, onSave, onCancel }: AddEditAddressProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: address?.street ?? "",
      apt: address?.apt ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      zip: address?.zip ?? "",
      country: address?.country ?? "",
    },
  });

  useEffect(() => {
    reset({
      street: address?.street ?? "",
      apt: address?.apt ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      zip: address?.zip ?? "",
      country: address?.country ?? "",
    });
  }, [address, reset]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  // Lock background scrolling, focus the first field, trap focus, and support
  // Escape while the dialog is open. Focus returns to the trigger on close.
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>(
          "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
        ) ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

      target?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  const title = address ? "Edit Address" : "Add New Address";

  return createPortal(
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.button
        type="button"
        aria-label="Close address editor"
        className="absolute inset-0 h-full w-full cursor-default"
        initial={{ backgroundColor: "rgba(0, 0, 0, 0)", backdropFilter: "blur(0px)" }}
        animate={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
        exit={{ backgroundColor: "rgba(0, 0, 0, 0)", backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onCancel}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-editor-title"
        aria-busy={saving}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="address-editor-title" className="text-xl font-bold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {address
                ? "Update the address used at checkout."
                : "Add a shipping address for faster checkout."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="mt-6 space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="address-street" className={labelClasses}>
              Street address
            </label>
            <input
              id="address-street"
              type="text"
              autoComplete="street-address"
              className={inputClasses(Boolean(errors.street))}
              {...register("street")}
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>}
          </div>

          <div>
            <label htmlFor="address-apt" className={labelClasses}>
              Apt, suite, etc. (optional)
            </label>
            <input
              id="address-apt"
              type="text"
              autoComplete="address-line2"
              className={inputClasses(false)}
              {...register("apt")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="address-city" className={labelClasses}>
                City
              </label>
              <input
                id="address-city"
                type="text"
                autoComplete="address-level2"
                className={inputClasses(Boolean(errors.city))}
                {...register("city")}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>

            <div>
              <label htmlFor="address-state" className={labelClasses}>
                State / Region
              </label>
              <input
                id="address-state"
                type="text"
                autoComplete="address-level1"
                className={inputClasses(Boolean(errors.state))}
                {...register("state")}
              />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="address-zip" className={labelClasses}>
                ZIP / Postal code
              </label>
              <input
                id="address-zip"
                type="text"
                autoComplete="postal-code"
                className={inputClasses(Boolean(errors.zip))}
                {...register("zip")}
              />
              {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip.message}</p>}
            </div>

            <div>
              <label htmlFor="address-country" className={labelClasses}>
                Country
              </label>
              <input
                id="address-country"
                type="text"
                autoComplete="country-name"
                className={inputClasses(Boolean(errors.country))}
                {...register("country")}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : address ? "Save changes" : "Add address"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default AddEditAddress;
