import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2" aria-label="Home">
          <h1 className="text-2xl font-bold">ActWho</h1>
        </Link>
        <nav className="flex gap-6" aria-label="Main navigation">
          <Link
            href="/"
            className="hover:text-indigo-100 transition duration-200 font-semibold focus:outline focus:outline-2 focus:outline-white"
            aria-current="page"
          >
            Play
          </Link>
          <Link
            href="/stats"
            className="hover:text-indigo-100 transition duration-200 font-semibold focus:outline focus:outline-2 focus:outline-white"
          >
            Stats
          </Link>
        </nav>
      </div>
    </header>
  );
}
