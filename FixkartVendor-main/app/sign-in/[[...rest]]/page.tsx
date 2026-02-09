// app/sign-up/[[...rest]]/page.tsx

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn 
        // Optional: Define a path to redirect to after successful sign-up
        // e.g., afterSignUpUrl="/dashboard"
      />
    </div>
  );
}