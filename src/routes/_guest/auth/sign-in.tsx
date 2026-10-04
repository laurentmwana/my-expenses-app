import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader } from "#/components/ui/loader";
import { SignInForm } from "#/features/auth/sign-in-form";
import { authClient } from "#/lib/auth-client";
import type { LoginValues } from "#/schemas/auth.schema";
import { queriesSchema } from "#/schemas/default.schema";
import { AuthLayout } from "#/layouts/auth-layout";

export const Route = createFileRoute("/_guest/auth/sign-in")({
  validateSearch: queriesSchema,
  component: Login,
  head: () => ({
    meta: [
      { title: "Connexion - Accédez à votre compte" },
      {
        name: "description",
        content:
          "Connectez-vous à votre compte avec votre email et mot de passe.",
      },
      { property: "og:title", content: "Connexion" },
      {
        property: "og:description",
        content: "Connectez-vous à votre compte.",
      },
    ],
  }),
});

const REDIRECT_TO = "/dashboard";

function Login() {
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const redirectTo = redirect ?? REDIRECT_TO;

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw new Error(error.message ?? "Email ou mot de passe incorrect");
      }

      return data;
    },
    onSuccess: async () => {
      await navigate({ to: redirectTo, replace: true });
      toast.success("Vous êtes connecté");
    },
  });

  if (isSessionPending || session) {
    return <Loader label="Redirection..." />;
  }

  return (
    <AuthLayout>
      <SignInForm
        error={loginMutation.error?.message}
        onSubmit={(values) => loginMutation.mutate(values)}
        isPending={loginMutation.isPending}
      />
    </AuthLayout>
  );
}
