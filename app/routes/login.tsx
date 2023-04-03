import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { useActionData, useSearchParams } from "@remix-run/react";
import {
  createUserSession,
  getUserId,
  login,
  LoginFormSchema,
} from "lib/session.server";
import logo from "../assets/luckyartsLogo.png";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/");
  }
  return null;
}

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const username = form.get("username") as string;
  const password = form.get("password") as string;
  const redirectTo = (form.get("redirectTo") as string) || "/";

  const result = LoginFormSchema.safeParse({ username, password });
  if (!result.success)
    return json({
      fields: { username, password },
      fieldErrors: result.error.flatten().fieldErrors,
      formError: null,
    });

  const user = await login({ username, password });
  if (!user) {
    return json({
      fields: { username, password },
      fieldErrors: null,
      formError: "Username/Password combination is incorrect",
    });
  }

  return createUserSession(user.userId!, redirectTo);
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a
          href="#"
          className="flex items-center mb-6 text-3xl font-semibold text-gray-900 dark:text-white"
        >
          <img
            className="w-8 h-8 mr-2 rounded-full"
            src={logo}
            alt="logo"
          />
          LUCKY ARTS
        </a>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Sign in to your account
            </h1>
            <form method="post" className="space-y-4 md:space-y-6">
              <input
                type="hidden"
                name="redirectTo"
                value={searchParams.get("redirectTo") ?? undefined}
              />
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  defaultValue={actionData?.fields.username}
                  placeholder="Enter your username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {actionData?.fieldErrors?.username && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                    {actionData?.fieldErrors.username}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  defaultValue={actionData?.fields.password}
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {actionData?.fieldErrors?.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                    {actionData?.fieldErrors.password}
                  </p>
                )}
              </div>
              {actionData?.formError && (
                <p className="text-sm text-red-600 dark:text-red-500">
                  {actionData?.formError}
                </p>
              )}
              <button
                type="submit"
                className="w-full text-white bg-[#f3c41a] hover:bg-[#f3c41a] focus:ring-2 focus:outline-none focus:ring-slate-900 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-[#f3c41a] dark:focus:ring-slate-900"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
