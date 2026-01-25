
import { Card } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      {/* Background gradients for premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <Card className="w-full max-w-md p-8 relative z-10 border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-slate-400">
              Enter your credentials to access your account
            </p>
          </div>

          <form className="flex flex-col space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2.5 transition-all duration-300 shadow-lg shadow-blue-500/20">
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link 
              href="#" 
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
