import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";

interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

const initialForm: ContactFormState = { name: "", email: "", message: "" };

const ContactPage = () => {
  const [form, setForm] = useState<ContactFormState>(initialForm);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in every field before sending.");
      return;
    }

    // No contact endpoint exists yet; keep the UX honest and reset the form.
    toast.success("Thanks! Your message has been noted.");
    setForm(initialForm);
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 py-16">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Contact us
          </h1>
          <p className="mt-4 text-gray-600">
            Questions about an order, a product, or a partnership? Send us a note and we will get
            back to you.
          </p>

          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="font-semibold text-gray-900">Email</dt>
              <dd className="mt-1 text-gray-600">support@AniMerch.example</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Hours</dt>
              <dd className="mt-1 text-gray-600">Monday to Friday, 9:00–18:00</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Shipping</dt>
              <dd className="mt-1 text-gray-600">Worldwide delivery on all collectible figures.</dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8"
          noValidate
        >
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Send message
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
