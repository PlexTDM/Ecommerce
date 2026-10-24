import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema, type RegisterFormData } from "@/lib/auth-schema";
import { setAuthSession } from "@/lib/auth-storage";
import { getApiErrorMessage, registerUser } from "@/api";
import toast from "react-hot-toast";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError("");
    setIsLoading(true);
    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setAuthSession({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      toast.success(response.message || "Account created successfully");
      void navigate("/");
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err, "Registration failed. Please try again later."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
        <p className="mt-2 text-gray-600">Start your shopping journey today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.name
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-indigo-500"
            } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200`}
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.email
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-indigo-500"
            } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200`}
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.password
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-indigo-500"
            } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200`}
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.confirmPassword
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-indigo-500"
            } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200`}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;
