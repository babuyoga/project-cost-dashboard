"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ConfirmationModal } from "@/app/components/ui/ConfirmationModal";
import { Trash, LogOut } from "lucide-react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

interface Session {
  id: string;
  userId: string;
  username: string;
  expiresAt: string;
  createdAt: string;
  lastSeenAt: string;
}

export default function SessionsPage() {
  const { loading, authorized } = useAuthGuard({ requireAdmin: true });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [userToInvalidate, setUserToInvalidate] = useState<{userId: string, username: string} | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchSessions();
    }
  }, [authorized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  // Format Date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Delete Single Session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
        setSessionToDelete(null);
      } else {
        alert("Failed to delete session");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting session");
    } finally {
      setIsProcessing(false);
    }
  };

  // Invalidate All User Sessions
  const handleInvalidateUser = async () => {
    if (!userToInvalidate) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/users/${userToInvalidate.userId}/invalidate-sessions`, {
        method: "POST",
      });
      if (res.ok) {
        // Refresh list to see changes
        await fetchSessions();
        setUserToInvalidate(null);
      } else {
        alert("Failed to invalidate sessions");
      }
    } catch (err) {
        console.error(err);
        alert("Error invalidating sessions");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-slate-400 mt-2">View and manage active user sessions.</p>
        </header>

        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No active sessions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm bg-slate-900/50">
                    <th className="p-4 font-medium">Username</th>
                    <th className="p-4 font-medium">Session ID</th>
                    <th className="p-4 font-medium">Created At</th>
                    <th className="p-4 font-medium">Last Seen</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sessions.map((session) => (
                    <tr key={session.id} className="group hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="font-medium text-white">{session.username}</div>
                            {/* Invalidate User Button (Small) */}
                            <button 
                                onClick={() => setUserToInvalidate({userId: session.userId, username: session.username})}
                                className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-900/50 transition-colors"
                                title="Invalidate ALL sessions for this user"
                            >
                                Invalidate All
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{session.userId}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500 truncate max-w-[150px]" title={session.id}>
                        {session.id.substring(0, 12)}...
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {formatDate(session.lastSeenAt)}
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                            onClick={() => setSessionToDelete(session)}
                            className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 px-3 py-1 text-xs"
                        >
                            <Trash size={14} className="mr-2" />
                            Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

       {/* Confirm Revoke Single Session */}
       <ConfirmationModal
        isOpen={!!sessionToDelete}
        title="Revoke Session"
        message="Are you sure you want to revoke this session? The user will be logged out on that device."
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionToDelete(null)}
        isLoading={isProcessing}
      />

      {/* Confirm Invalidate User */}
      <ConfirmationModal
        isOpen={!!userToInvalidate}
        title={`Invalidate All Sessions for ${userToInvalidate?.username}`}
        message="This will sign out the user from ALL devices immediately. Are you sure?"
        onConfirm={handleInvalidateUser}
        onCancel={() => setUserToInvalidate(null)}
        isLoading={isProcessing}
      />
    </div>
  );
}
