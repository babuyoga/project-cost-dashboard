"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  username: string;
  email?: string;
  isAdmin: boolean;
}

interface UseAuthGuardOptions {
  requireAdmin?: boolean;
}

interface UseAuthGuardResult {
  loading: boolean;
  authorized: boolean;
  user: User | null;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (response.ok) {
          const data = await response.json();
          
          // Check admin requirement
          if (options.requireAdmin && !data.isAdmin) {
            router.replace("/dashboard");
            return;
          }

          setUser({
            userId: data.userId,
            username: data.username,
            email: data.email,
            isAdmin: data.isAdmin
          });
          setAuthorized(true);

        } else if (response.status === 401) {
          router.replace("/");
        } else if (response.status === 403) {
          router.replace("/dashboard");
        } else {
          // Unexpected status - treat as unauthorized
          router.replace("/");
        }

      } catch (error) {
        console.error("Auth validation error:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [router, options.requireAdmin]);

  return { loading, authorized, user };
}
