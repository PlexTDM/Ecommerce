import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-3 text-gray-500">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
