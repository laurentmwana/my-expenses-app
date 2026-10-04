import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { ButtonLoader } from "#/components/ui/button-loader";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";
import { type LoginValues, loginSchema } from "#/schemas/auth.schema";

type Props = {
  className?: string;
  onSubmit: (values: LoginValues) => void;
  isPending?: boolean;
  error?: string | null;
};

export const SignInForm: React.FC<Props> = ({
  className,
  onSubmit,
  isPending = false,
  error: externalError,
}) => {
  const [formError, setFormError] = useState<string | null>(null);

  const displayError = externalError || formError;

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: ({ value }) => {
      setFormError(null);
      try {
        onSubmit({ email: value.email, password: value.password });
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer.",
        );
      }
    },
  });

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto border border-border/60 bg-card text-card-foreground rounded-2xl p-6 sm:p-8 ring-2 ring-border/5 transition-all duration-300  hover:border-primary/20",
        className,
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        noValidate
      >
        <FieldGroup className="gap-6">
          <div className="flex flex-col items-center gap-2 text-center pb-4 border-b border-border/50">
            <h2 className="text-2xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/95 to-primary bg-clip-text text-transparent">
              Se connecter
            </h2>
            <p className="text-xs text-muted-foreground font-light">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="gap-1.5">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder="email@exemple.com"
                    aria-invalid={isInvalid}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isPending}
                  />
                  {isInvalid && (
                    <FieldError
                      errors={field.state.meta.errors.slice(0, 1)}
                      className="text-xs mt-1"
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Mot de passe
                    </FieldLabel>
                  </div>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Mot de passe"
                    aria-invalid={isInvalid}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isPending}
                  />
                  {isInvalid && (
                    <FieldError
                      errors={field.state.meta.errors.slice(0, 1)}
                      className="text-xs mt-1"
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>

          {displayError && (
            <Alert
              variant="destructive"
              className="py-2.5 rounded-lg text-xs bg-destructive/5 border-destructive"
            >
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <Field className="pt-2">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <ButtonLoader
                  loader={isSubmitting || isPending}
                  type="submit"
                  disabled={!canSubmit || isPending}
                  className="h-10 font-medium tracking-wide shadow-sm hover:shadow transition-all w-full cursor-pointer"
                >
                  {isSubmitting || isPending
                    ? "Connexion en cours…"
                    : "Se connecter"}
                </ButtonLoader>
              )}
            </form.Subscribe>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
