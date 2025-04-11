"use server";

import { signIn } from "@/auth";

export async function signInOnServer(formData: FormData) {
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });

  let redirectTo = formData.get("redirectTo");
  if (typeof redirectTo !== "string") {
    redirectTo = "/";
  }

  await signIn("axh-sso", { redirectTo });
}
