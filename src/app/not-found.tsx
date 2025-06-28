export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
} 