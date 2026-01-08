import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { Shield, Lock, Key } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-semibold">Authentication App</h1>
            <div className="flex items-center gap-4">
              {!isAuthenticated ? (
                <>
                  <Button asChild>
                    <Link to={ROUTES.REGISTER}>Get Started</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to={ROUTES.LOGIN}>Sign In</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link to={ROUTES.APPLICATION}>Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Secure Authentication
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A modern, production-ready authentication system with secure token
            management.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {!isAuthenticated ? (
              <>
                <Button size="lg" asChild>
                  <Link to={ROUTES.REGISTER}>Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to={ROUTES.LOGIN}>Sign In</Link>
                </Button>
              </>
            ) : (
              <h2 className="text-2xl font-bald">
                Welcome <span>{user?.name}</span>
              </h2>
            )}
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Shield className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Secure by Default</CardTitle>
              <CardDescription>
                Built with security best practices including Argon2id password
                hashing and secure token management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>JWT Authentication</CardTitle>
              <CardDescription>
                Secure token-based authentication with JWT for enhanced security
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Key className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Type Safe</CardTitle>
              <CardDescription>
                Built with TypeScript for type safety and better developer
                experience
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
