"use client";

import { useActionState, useEffect } from "react";
import { loginSalesman } from "@/app/actions/salesman-auth";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";

const initialState = { error: "", success: false };

export default function SalesmanLoginPage() {
  const router = useRouter();
  // @ts-ignore
  const [state, formAction, isPending] = useActionState(loginSalesman, initialState);

  // Redirect on Success
  useEffect(() => {
    if (state?.success) {
      router.push("/salesman/dashboard");
    }
  }, [state?.success, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-6">
      
      {/* Brand / Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <MapPin className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Field Force</h1>
        <p className="text-gray-400 text-sm mt-1">Secure Salesman Login</p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <form action={formAction} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input 
              name="phone" 
              type="tel" 
              placeholder="9876543210"
              required
              className="w-full bg-gray-900 text-white border border-gray-600 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Access Code
            </label>
            <input 
              name="code" 
              type="password" 
              placeholder="••••"
              required
              inputMode="numeric" 
              className="w-full bg-gray-900 text-white border border-gray-600 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 font-medium tracking-widest"
            />
          </div>

          {/* Error Message */}
          {state?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-pulse">
              {state.error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Verifying...
              </>
            ) : (
              "Login to Dashboard"
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-gray-500 text-xs text-center max-w-[200px]">
        Contact your vendor manager if you forgot your access code.
      </p>

    </div>
  );
}