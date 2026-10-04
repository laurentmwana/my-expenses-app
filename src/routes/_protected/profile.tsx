import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader } from "#/components/ui/loader";
import { ProfileEditForm } from "#/features/profile/profile-edit-form";
import { ProfilePasswordForm } from "#/features/profile/profile-password-form";
import { AdminLayout } from "#/layouts/admin-layout";
import { authClient } from "#/lib/auth-client";
import type {
  ChangePasswordValues,
  ProfileValues,
} from "#/schemas/profile.schema";

export const Route = createFileRoute("/_protected/profile")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Profil - Gérez votre compte" },
      {
        name: "description",
        content:
          "Modifiez vos informations personnelles et votre mot de passe.",
      },
    ],
  }),
});

function Page() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const { data, error } = await authClient.updateUser({
        name: values.name,
      });

      if (error) {
        throw new Error(
          error.message ?? "Impossible de mettre à jour le profil",
        );
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordValues) => {
      const { data, error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (error) {
        throw new Error(
          error.message ?? "Impossible de changer le mot de passe",
        );
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Mot de passe mis à jour");
    },
  });

  if (isSessionPending || !session?.user) {
    return <Loader size={20} label="Chargement..." />;
  }

  return (
    <AdminLayout
      breadcrumbs={[
        { href: "/dashboard", title: "Tableau de bord" },
        { href: "#", title: "Profil" },
      ]}
    >
      <div className="container-sm">
        <div className="flex flex-col mb-8">
          <h2 className="text-semibold text-2xl">Modifier le profil</h2>
        </div>
        <div className="flex flex-col gap-8">
          <ProfileEditForm
            defaultValues={{
              name: session.user.name,
              email: session.user.email,
            }}
            error={updateProfileMutation.error?.message}
            isPending={updateProfileMutation.isPending}
            onSubmit={(values) => updateProfileMutation.mutate(values)}
          />
          <ProfilePasswordForm
            error={changePasswordMutation.error?.message}
            isPending={changePasswordMutation.isPending}
            onSubmit={(values) => changePasswordMutation.mutate(values)}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
