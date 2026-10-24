import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, updateAccountProfile, updatePassword } from "@/api";
import {
  passwordSchema,
  settingsSchema,
  type PasswordFormData,
  type SettingsFormData,
} from "@/lib/profile-schema";
import type { PublicUser } from "@/types";

interface SettingsFormProps {
  user: PublicUser | null;
  onUserUpdate: (user: PublicUser) => void;
}

const inputClasses = (hasError: boolean): string =>
  `block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
  }`;

const labelClasses = "block text-sm font-medium text-gray-700";

const SettingsForm = ({ user, onUserUpdate }: SettingsFormProps) => {
  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    reset: resetAccount,
    formState: { errors: accountErrors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    resetAccount({
      username: user?.username ?? "",
      email: user?.email ?? "",
    });
  }, [user, resetAccount]);

  const onSubmitAccount = async (data: SettingsFormData) => {
    setAccountError("");
    setSavingAccount(true);

    try {
      const result = await updateAccountProfile({
        username: data.username,
        email: data.email,
      });

      onUserUpdate(result.user);

      try {
        localStorage.setItem("user", JSON.stringify(result.user));
      } catch {
        // Non-fatal: the in-memory user is still updated.
      }

      toast.success(result.message || "Profile updated");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not update your profile.");
      setAccountError(message);
      toast.error(message);
    } finally {
      setSavingAccount(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setPasswordError("");
    setSavingPassword(true);

    try {
      const result = await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success(result.message || "Password updated");
      resetPassword();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not update your password.");
      setPasswordError(message);
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update the username and email associated with your account.
        </p>

        <form onSubmit={handleAccountSubmit(onSubmitAccount)} className="mt-5 space-y-4" noValidate>
          {accountError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {accountError}
            </div>
          )}

          <div>
            <label htmlFor="settings-username" className={labelClasses}>
              Username
            </label>
            <input
              id="settings-username"
              type="text"
              autoComplete="username"
              className={`mt-1 ${inputClasses(Boolean(accountErrors.username))}`}
              {...registerAccount("username")}
            />
            {accountErrors.username && (
              <p className="mt-1 text-sm text-red-600">{accountErrors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="settings-email" className={labelClasses}>
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              autoComplete="email"
              className={`mt-1 ${inputClasses(Boolean(accountErrors.email))}`}
              {...registerAccount("email")}
            />
            {accountErrors.email && (
              <p className="mt-1 text-sm text-red-600">{accountErrors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingAccount}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingAccount ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-xl font-semibold text-gray-900">Password</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose a strong password with at least 6 characters.
        </p>

        <form
          onSubmit={handlePasswordSubmit(onSubmitPassword)}
          className="mt-5 space-y-4"
          noValidate
        >
          {passwordError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}

          <div>
            <label htmlFor="current-password" className={labelClasses}>
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              className={`mt-1 ${inputClasses(Boolean(passwordErrors.currentPassword))}`}
              {...registerPassword("currentPassword")}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-password" className={labelClasses}>
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className={`mt-1 ${inputClasses(Boolean(passwordErrors.newPassword))}`}
                {...registerPassword("newPassword")}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-new-password" className={labelClasses}>
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                className={`mt-1 ${inputClasses(Boolean(passwordErrors.confirmPassword))}`}
                {...registerPassword("confirmPassword")}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SettingsForm;
