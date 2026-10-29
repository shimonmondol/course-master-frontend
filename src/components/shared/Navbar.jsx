import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { getToken, clearToken } from "../../utils/auth";
import { getMe } from "../../services/auth.api";

export default function Navbar() {
  const navigate = useNavigate();
  const token = getToken();

  // localStorage থেকে প্রাথমিক ইউজার ডেটা নেওয়ার ব্যবস্থা (ইনস্ট্যান্ট নাম দেখানোর জন্য)
  const [me, setMe] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // ফিক্সড অ্যাক্টিভ ক্লাস হ্যান্ডলার
  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-primary font-bold border-b-2 border-primary pb-1"
      : "text-base-content/80 hover:text-primary transition-colors";

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("user");
    setMe(null);
    navigate("/login");
  };

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setMe(null);
        return;
      }

      try {
        const res = await getMe();
        if (res.data) {
          setMe(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        // শুধুমাত্র টোকেন ইনভ্যালিড (401) হলে লগআউট করাবে
        if (err.response?.status === 401) {
          clearToken();
          localStorage.removeItem("user");
          setMe(null);
        }
      }
    };

    loadMe();
  }, [token]);

  const initials = me?.name
    ? me.name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const dashboardRoute = me?.role === "admin" ? "/admin" : "/student";

  return (
    <header className="sticky top-0 z-50 bg-base-100/90 backdrop-blur border-b border-base-300">
      <div className="navbar max-w-6xl mx-auto px-4">
        {/* LEFT: Logo */}
        <div className="navbar-start">
          <Logo />
        </div>

        {/* CENTER: Desktop menu */}
        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal gap-4 items-center">
            <li>
              <NavLink className={navLinkClass} to="/">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink className={navLinkClass} to="/courses">
                Courses
              </NavLink>
            </li>

            {/* শুধুমাত্র লগইন থাকলে ড্যাশবোর্ড দেখাবে */}
            {token && me && (
              <li>
                <NavLink className={navLinkClass} to={dashboardRoute}>
                  Dashboard
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* RIGHT */}
        <div className="navbar-end gap-3">
          <ThemeToggle />

          {/* লগইন না থাকলে Login ও Register বাটন */}
          {!token && (
            <div className="hidden md:flex gap-2">
              <Link to="/login" className="btn btn-sm btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Sign Up
              </Link>
            </div>
          )}
          {token && me && (
            <div className="hidden md:block dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold shadow">
                  {initials}
                </div>
              </label>

              <ul
                tabIndex={0}
                className="dropdown-content mt-3 p-3 shadow-xl bg-base-100 rounded-box w-64 border border-base-300 z-50"
              >
                <div className="px-3 py-2 border-b border-base-200">
                  <p className="font-bold text-base-content text-sm truncate">
                    {me.name}
                  </p>
                  <p className="text-xs text-base-content/70 truncate">
                    {me.email}
                  </p>
                  <span className="badge badge-primary badge-outline text-[11px] font-semibold mt-1 uppercase">
                    {me.role}
                  </span>
                </div>

                <li className="mt-2">
                  <Link to={dashboardRoute}>Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                <li className="border-t border-base-200 mt-1">
                  <button
                    onClick={handleLogout}
                    className="text-error font-medium hover:bg-error/10"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <div className="dropdown dropdown-end md:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>

            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 p-4 shadow-xl bg-base-100 rounded-box w-60 border border-base-300 z-50"
            >
              <li>
                <NavLink className={navLinkClass} to="/">
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink className={navLinkClass} to="/courses">
                  Courses
                </NavLink>
              </li>

              {token && me && (
                <li>
                  <NavLink className={navLinkClass} to={dashboardRoute}>
                    Dashboard
                  </NavLink>
                </li>
              )}

              <div className="my-2 border-t border-base-300" />

              {!token ? (
                <>
                  <li>
                    <Link to="/login" className="btn btn-ghost btn-sm w-full mb-1">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="btn btn-primary btn-sm w-full">
                      Sign Up
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <div className="px-2 py-1 text-center">
                    <p className="font-bold text-sm truncate">{me.name}</p>
                    <p className="text-xs text-base-content/70 truncate">{me.email}</p>
                  </div>
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="text-error font-medium">
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}