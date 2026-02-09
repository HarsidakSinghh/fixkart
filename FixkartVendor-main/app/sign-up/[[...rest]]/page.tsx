// app/sign-up/[[...rest]]/page.tsx

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp 
        // Optional: Define a path to redirect to after successful sign-up
        // e.g., afterSignUpUrl="/dashboard"
      />
    </div>
  );
}