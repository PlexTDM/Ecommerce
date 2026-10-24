import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Paypal from "@/components/Paypal";
import type { RootState } from "@/redux/store";
import type { CartItem, ShippingInput } from "@/types";

const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
  address: z.string().trim().min(1, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State/region is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const getDiscountPercent = (item: CartItem): number => Number(item.discount) || 0;

const getUnitPrice = (item: CartItem): number =>
  roundCurrency(item.price * (1 - getDiscountPercent(item) / 100));

const getLineTotal = (item: CartItem): number => roundCurrency(getUnitPrice(item) * item.qty);

const inputClasses = (hasError: boolean): string =>
  `mt-1 block w-full rounded-md border bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
  }`;

const errorClasses = "mt-1 text-sm text-red-600";

const Checkout = () => {
  const cart = useSelector((state: RootState) => state.handleCart);
  const [shipping, setShipping] = useState<ShippingInput | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const total = useMemo(
    () => roundCurrency(cart.reduce((sum, item) => sum + getLineTotal(item), 0)),
    [cart],
  );

  const onContinue = (data: CheckoutFormData) => {
    setShipping({
      name: `${data.firstName} ${data.lastName}`.trim(),
      line1: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-3 text-gray-500">Add a few products before heading to checkout.</p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Shipping Information</h2>

              <form onSubmit={handleSubmit(onContinue)} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      className={inputClasses(Boolean(errors.firstName))}
                      {...register("firstName")}
                    />
                    {errors.firstName && <p className={errorClasses}>{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      className={inputClasses(Boolean(errors.lastName))}
                      {...register("lastName")}
                    />
                    {errors.lastName && <p className={errorClasses}>{errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={inputClasses(Boolean(errors.email))}
                    {...register("email")}
                  />
                  {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    className={inputClasses(Boolean(errors.address))}
                    {...register("address")}
                  />
                  {errors.address && <p className={errorClasses}>{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      className={inputClasses(Boolean(errors.city))}
                      {...register("city")}
                    />
                    {errors.city && <p className={errorClasses}>{errors.city.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State / Region
                    </label>
                    <input
                      id="state"
                      type="text"
                      autoComplete="address-level1"
                      className={inputClasses(Boolean(errors.state))}
                      {...register("state")}
                    />
                    {errors.state && <p className={errorClasses}>{errors.state.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      autoComplete="postal-code"
                      className={inputClasses(Boolean(errors.postalCode))}
                      {...register("postalCode")}
                    />
                    {errors.postalCode && (
                      <p className={errorClasses}>{errors.postalCode.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      autoComplete="country-name"
                      className={inputClasses(Boolean(errors.country))}
                      {...register("country")}
                    />
                    {errors.country && <p className={errorClasses}>{errors.country.message}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800"
                >
                  {shipping ? "Update shipping details" : "Continue to payment"}
                </button>

                {shipping && (
                  <p className="text-sm text-green-700" role="status">
                    Shipping details saved. Complete your payment below.
                  </p>
                )}
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Payment</h2>
              {shipping ? (
                <Paypal cart={cart} shipping={shipping} />
              ) : (
                <p className="text-sm text-gray-500">
                  Fill in your shipping information and continue to enable PayPal checkout.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Order Summary</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded object-cover"
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        Qty: {item.qty}
                        {getDiscountPercent(item) > 0 && ` · ${getDiscountPercent(item)}% off`}
                      </p>
                    </div>
                    <span className="text-sm font-medium">${getLineTotal(item).toFixed(2)}</span>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
