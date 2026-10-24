import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { getApiErrorMessage, updateProfile } from "../../api";
import type { AddressFormData } from "../../lib/profile-schema";
import type { Address, Profile } from "../../types";
import AddEditAddress from "./AddEditAddress";

interface AddressBookProps {
  profile: Profile | null;
  onProfileUpdate: (profile: Profile) => void;
}

const toAddress = (data: AddressFormData, id: string): Address => {
  const apt = data.apt?.trim();

  return {
    id,
    street: data.street,
    city: data.city,
    state: data.state,
    zip: data.zip,
    country: data.country,
    ...(apt ? { apt } : {}),
  };
};

const AddressBook = ({ profile, onProfileUpdate }: AddressBookProps) => {
  const addresses = profile?.addresses ?? [];
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const openNewAddress = () => {
    setEditingAddress(null);
    setError("");
    setEditorOpen(true);
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    setError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingAddress(null);
    setError("");
  };

  const handleSave = async (data: AddressFormData) => {
    setSaving(true);
    setError("");

    try {
      const nextAddresses = editingAddress
        ? addresses.map((address) =>
            address.id === editingAddress.id ? toAddress(data, editingAddress.id) : address,
          )
        : [...addresses, toAddress(data, crypto.randomUUID())];

      const updated = await updateProfile({ addresses: nextAddresses });
      onProfileUpdate(updated);
      toast.success(editingAddress ? "Address updated" : "Address added");
      closeEditor();
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not save this address.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;

    setDeletingId(id);
    setError("");

    try {
      const nextAddresses = addresses.filter((address) => address.id !== id);
      const updated = await updateProfile({ addresses: nextAddresses });
      onProfileUpdate(updated);
      toast.success("Address deleted");
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not delete this address.");
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
          <p className="mt-1 text-sm text-gray-500">Manage the addresses used at checkout.</p>
        </div>

        <button
          type="button"
          onClick={openNewAddress}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Add address
        </button>
      </div>

      {error && !editorOpen && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">You have not added any addresses yet.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <motion.li
              key={address.id}
              layout
              className="flex flex-col justify-between rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{address.street}</p>
                {address.apt && <p>{address.apt}</p>}
                <p>
                  {address.city}, {address.state} {address.zip}
                </p>
                <p>{address.country}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditAddress(address)}
                  className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === address.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {editorOpen && (
          <AddEditAddress
            key={editingAddress?.id ?? "new-address"}
            address={editingAddress}
            saving={saving}
            error={error}
            onSave={handleSave}
            onCancel={closeEditor}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressBook;
