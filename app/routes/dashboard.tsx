import { json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { initDrawers, initDropdowns } from "flowbite";
import { useEffect, useState } from "react";
import { getUser } from "~/utils/session.server";
import logo from "../assets/luckyartsLogo.png";
import user_logo from "../assets/user.png";

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return json({ user });
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      initDrawers();
      initDropdowns();
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Modern Top Navigation */}
      <nav className="fixed top-0 z-50 w-full backdrop-blur-xl bg-white/90 border-b border-gray-200/50 dark:bg-gray-900/90 dark:border-gray-700/50 shadow-lg">
        <div className="px-4 py-3 lg:px-6 lg:pl-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                data-drawer-target="logo-sidebar"
                data-drawer-toggle="logo-sidebar"
                aria-controls="logo-sidebar"
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center p-2 text-sm text-gray-600 rounded-xl md:hidden hover:bg-gray-100/50 focus:outline-none focus:ring-2 focus:ring-[#f3c41a]/20 transition-all duration-200 dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>
              <Link to="/" className="flex ml-2 md:mr-24 group">
                <div className="relative">
                  <img src={logo} className="h-10 mr-3 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-200" alt="Lucky Arts Logo" />
                  <div className="absolute inset-0 rounded-xl bg-[#f3c41a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <span className="self-center font-lemon text-xl font-semibold md:text-2xl whitespace-nowrap text-gray-900 dark:text-white group-hover:text-[#f3c41a] transition-all duration-200">
                  Lucky Arts
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ml-3">
                <div>
                  <button
                    type="button"
                    className="flex text-sm bg-[#f3c41a] rounded-full focus:ring-4 focus:ring-[#f3c41a]/20 dark:focus:ring-[#f3c41a]/30 p-1 shadow-lg hover:shadow-xl transition-all duration-200"
                    aria-expanded="false"
                    data-dropdown-toggle="dropdown-user"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img className="w-8 h-8 rounded-full border-2 border-white/20" src={user_logo} alt="user" />
                  </button>
                </div>
                <div
                  className="z-50 hidden my-4 text-base list-none backdrop-blur-xl bg-white/90 divide-y divide-gray-100/50 rounded-2xl shadow-2xl dark:bg-gray-800/90 dark:divide-gray-600/50 border border-white/20 dark:border-gray-700/50"
                  id="dropdown-user"
                >
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-gray-900 dark:text-white font-medium" role="none">
                      {user.email}
                    </p>
                  </div>
                  <ul className="py-1" role="none">
                    <li>
                      <form action="/logout" method="post">
                        <button
                          type="submit"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-gray-600/50 dark:hover:text-white rounded-lg mx-2 mb-1 transition-all duration-200"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </form>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Sidebar */}
      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform backdrop-blur-xl bg-white/90 border-r border-gray-200/50 md:translate-x-0 dark:bg-gray-900/90 dark:border-gray-700/50 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-4 pb-4 overflow-y-auto">
          <ul className="space-y-3 pt-4">
            <li>
              <Link
                to="/"
                className="flex items-center p-3 text-base font-medium text-gray-900 rounded-2xl dark:text-white hover:bg-[#f3c41a]/10 dark:hover:bg-[#f3c41a]/20 transition-all duration-200 group border border-transparent hover:border-[#f3c41a]/20"
              >
                <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                  </svg>
                </div>
                <span className="ml-4 font-semibold">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/invoices/"
                className="flex items-center p-3 text-base font-medium text-gray-900 rounded-2xl dark:text-white hover:bg-[#f3c41a]/10 dark:hover:bg-[#f3c41a]/20 transition-all duration-200 group border border-transparent hover:border-[#f3c41a]/20"
              >
                <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg
                    aria-hidden="true"
                    className="flex-shrink-0 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </div>
                <span className="flex-1 ml-4 font-semibold">Invoices</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/quotations"
                className="flex items-center p-3 text-base font-medium text-gray-900 rounded-2xl dark:text-white hover:bg-[#f3c41a]/10 dark:hover:bg-[#f3c41a]/20 transition-all duration-200 group border border-transparent hover:border-[#f3c41a]/20"
              >
                <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <svg
                    width="20px"
                    height="20px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M8 3.5C8 2.67157 8.67157 2 9.5 2H14.5C15.3284 2 16 2.67157 16 3.5V4.5C16 5.32843 15.3284 6 14.5 6H9.5C8.67157 6 8 5.32843 8 4.5V3.5Z"
                        fill="currentColor"
                      ></path>{" "}
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M6.5 4.03662C5.24209 4.10719 4.44798 4.30764 3.87868 4.87694C3 5.75562 3 7.16983 3 9.99826V15.9983C3 18.8267 3 20.2409 3.87868 21.1196C4.75736 21.9983 6.17157 21.9983 9 21.9983H15C17.8284 21.9983 19.2426 21.9983 20.1213 21.1196C21 20.2409 21 18.8267 21 15.9983V9.99826C21 7.16983 21 5.75562 20.1213 4.87694C19.552 4.30764 18.7579 4.10719 17.5 4.03662V4.5C17.5 6.15685 16.1569 7.5 14.5 7.5H9.5C7.84315 7.5 6.5 6.15685 6.5 4.5V4.03662ZM6.25 10.5C6.25 10.0858 6.58579 9.75 7 9.75H17C17.4142 9.75 17.75 10.0858 17.75 10.5C17.75 10.9142 17.4142 11.25 17 11.25H7C6.58579 11.25 6.25 10.9142 6.25 10.5ZM7.25 14C7.25 13.5858 7.58579 13.25 8 13.25H16C16.4142 13.25 16.75 13.5858 16.75 14C16.75 14.4142 16.4142 14.75 16 14.75H8C7.58579 14.75 7.25 14.4142 7.25 14ZM8.25 17.5C8.25 17.0858 8.58579 16.75 9 16.75H15C15.4142 16.75 15.75 17.0858 15.75 17.5C15.75 17.9142 15.4142 18.25 15 18.25H9C8.58579 18.25 8.25 17.9142 8.25 17.5Z"
                        fill="currentColor"
                      ></path>{" "}
                    </g>
                  </svg>
                </div>
                <span className="flex-1 ml-4 font-semibold">Quotations</span>
              </Link>
            </li>
            {user.role === "SuperAdmin" && (
              <>
                <li>
                  <Link
                    to="/dashboard/users"
                    className="flex items-center p-3 text-base font-medium text-gray-900 rounded-2xl dark:text-white hover:bg-[#f3c41a]/10 dark:hover:bg-[#f3c41a]/20 transition-all duration-200 group border border-transparent hover:border-[#f3c41a]/20"
                  >
                    <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900 shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10 3a3 3 0 100 6 3 3 0 000-6zM4 13a4 4 0 018 0v1H4v-1z" />
                      </svg>
                    </div>
                    <span className="flex-1 ml-4 font-semibold">Users</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/shops"
                    className="flex items-center p-3 text-base font-medium text-gray-900 rounded-2xl dark:text-white hover:bg-[#f3c41a]/10 dark:hover:bg-[#f3c41a]/20 transition-all duration-200 group border border-transparent hover:border-[#f3c41a]/20"
                  >
                    <div className="p-2 rounded-xl bg-[#f3c41a] text-gray-900 shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 3h12l1 5H3l1-5zm-1 7h14v7H3v-7z" />
                      </svg>
                    </div>
                    <span className="flex-1 ml-4 font-semibold">Shops</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:ml-64 mt-16">
        <Outlet />
      </div>
    </div>
  );
}
