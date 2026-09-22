import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuUser, LuLock, LuEye, LuEyeOff } from "react-icons/lu";
import LogoMark from "../components/LogoMark";
import { useOrganization } from "../context/OrganizationContext";
import { Alert, Button, Field, Input } from "../components/ui";
import { FOCUS_RING_TIGHT, SURFACE, TRANSITION } from "../components/ui/tokens";
import { setToken } from "../lib/auth";
import api, { apiErrorMessage, restoreSession } from "../lib/api";
import { loginDefaults, loginSchema } from "../lib/schemas";

const Login = () => {
  const { organizationName } = useOrganization();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Redirect if already logged in. An expired access token does not count on
  // its own, but the refresh cookie outlives it — so this asks the server
  // rather than reading storage, and an admin returning to an open tab is put
  // back into the panel instead of being made to type the password again.
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((signedIn) => {
      if (signedIn && !cancelled) navigate("/", { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onSubmit = async ({ username, password }) => {
    setError("");

    try {
      const res = await api.post("/auth/login", { username, password });

      // Store the token; lib/api.js attaches it to every request from here on.
      setToken(res.data.token);

      // Redirect to dashboard
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid credentials"));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className={`space-y-6 ${SURFACE} p-6 sm:p-8`}
        >
          <div className="flex flex-col items-center border-b border-gray-200 pb-6 text-center">
            <LogoMark
              className="mb-3 h-20 w-20"
              rounded="rounded-xl"
              textClassName="text-2xl"
            />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {organizationName || "Admin Panel"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to manage projects, galleries and donations.
            </p>
          </div>

          {sessionExpired && !error && (
            <Alert tone="warning">
              Your session has expired. Please log in again to continue.
            </Alert>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          <div className="space-y-5">
            <Field
              label="Username"
              htmlFor="username"
              error={errors.username?.message}
            >
              <div className="relative">
                <LuUser
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Your username"
                  error={errors.username}
                  className="pl-11"
                  {...register("username")}
                />
              </div>
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
            >
              <div className="relative">
                <LuLock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  error={errors.password}
                  className="pl-11 pr-11"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 ${TRANSITION} hover:bg-gray-100 hover:text-gray-600 active:scale-95 active:bg-gray-200 ${FOCUS_RING_TIGHT} focus-visible:ring-gray-400`}
                >
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </Field>
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} fullWidth>
            {isSubmitting ? "Logging in…" : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          {organizationName ? `${organizationName} · ` : ""}Admin Panel
        </p>
      </div>
    </div>
  );
};

export default Login;
