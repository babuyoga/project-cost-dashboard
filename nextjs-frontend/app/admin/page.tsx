"use client";

import { useState, useEffect } from "react";
import { ConfirmationModal } from "@/app/components/ui/ConfirmationModal";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";


interface User {
  id: string;
  username: string;
  email?: string;
  enabled?: boolean;
  isAdmin?: boolean;
  passwordUpdatedAt?: string;
}

export default function AdminPage() {
  const { loading, authorized } = useAuthGuard({ requireAdmin: true });

  // State for Users List
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // State for Add User Form
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // State for Delete User Flow
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State for Password Reset Flow
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // State for User Details Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users on mount
  useEffect(() => {
    if (!authorized) return;
    
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [authorized]);

  // --- Add User Logic ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    // Client-side validation
    if (!username.trim()) {
      setAddError("Username must not be empty.");
      return;
    }
    if (!email.trim()) {
      setAddError("Email must not be empty.");
      return;
    }
    if (password.length < 8) {
      setAddError("Password must be at least 8 characters.");
      return;
    }

    setIsAddingUser(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add user");
      }

      const newUser: User = await response.json();

      setUsers((prev) => [...prev, newUser]);
      setAddSuccess(`User "${username}" added successfully.`);
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setAddError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsAddingUser(false);
    }
  };

  // --- Delete User Logic ---
  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteError(null);
  };

  const cancelDelete = () => {
    setUserToDelete(null);
    setDeleteError(null);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null); // Close modal on success
    } catch (err) {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // --- Password Reset Logic ---
  const openPasswordReset = (user: User) => {
    setPasswordResetUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetSuccess(null);
  };

  const closePasswordReset = () => {
    setPasswordResetUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetSuccess(null);
  };

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;

    setResetError(null);
    setResetSuccess(null);

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await fetch(`/api/admin/users/${passwordResetUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update password");
      }

      setResetSuccess("Password updated successfully");
      
      // Update local state to reflect password change timestamp
      setUsers(prev => prev.map(u => 
        u.id === passwordResetUser.id 
          ? { ...u, passwordUpdatedAt: new Date().toISOString() } 
          : u
      ));

      setTimeout(() => {
        closePasswordReset();
      }, 1500);

    } catch (err: any) {
      setResetError(err.message || "Failed to update password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Auth guards - after all hooks
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

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold border-b border-slate-800 pb-4">
          User Management
        </h1>

        {/* Add User Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-200">Add User</h2>
          <Card className="p-6 bg-slate-900 border-slate-800">
            <form onSubmit={handleAddUser} className="max-w-md space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={isAddingUser}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  disabled={isAddingUser}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isAddingUser}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Inline Messages */}
              {addError && (
                <p className="text-sm text-red-500" role="alert">
                  {addError}
                </p>
              )}
              {addSuccess && (
                <p className="text-sm text-green-500" role="alert">
                  {addSuccess}
                </p>
              )}

              <Button
                type="submit"
                disabled={isAddingUser}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isAddingUser ? "Adding..." : "Add User"}
              </Button>
            </form>
          </Card>
        </section>

        {/* User List Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-200">User List</h2>
          <Card className="overflow-hidden bg-slate-900 border-slate-800">
            {isLoadingUsers ? (
              <div className="p-8 text-center text-slate-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                      <th className="p-4 font-medium">User ID</th>
                      <th className="p-4 font-medium">Username</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Password Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedUser(user)}
                        className="group hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-mono text-sm text-slate-500">
                          {user.id}
                        </td>
                        <td className="p-4 text-slate-200 font-medium">
                          {user.username}
                        </td>
                        <td className="p-4 text-slate-300">
                          {user.email || "-"}
                        </td>
                        <td className="p-4 text-slate-200">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Admin
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">User</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-200">
                          {user.enabled ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-300 text-sm">
                          {user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt).toLocaleString() : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <Card 
            className="w-full max-w-md p-6 bg-slate-900 border-slate-800 shadow-xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">{selectedUser.username}</h3>
                  <p className="text-sm text-slate-400 font-mono">{selectedUser.email || "No email"}</p>
                </div>
                {selectedUser.isAdmin && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Admin
                  </span>
                )}
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">User ID</span>
                  <span className="font-mono text-slate-300">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Status</span>
                  <span className={selectedUser.enabled ? "text-green-400" : "text-slate-500"}>
                    {selectedUser.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Password Updated</span>
                  <span className="text-slate-300">
                    {selectedUser.passwordUpdatedAt ? new Date(selectedUser.passwordUpdatedAt).toLocaleString() : "Never"}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button 
                  onClick={() => {
                    openPasswordReset(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="w-full bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-600/20"
                >
                  Update Password
                </Button>
                <Button 
                  onClick={() => {
                    confirmDelete(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="w-full bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-600/20"
                >
                  Delete User
                </Button>
                <Button 
                  onClick={() => setSelectedUser(null)}
                  className="w-full bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closePasswordReset}
        >
          <Card 
            className="w-full max-w-md p-6 bg-slate-900 border-slate-800 shadow-xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-100">Update Password</h3>
              <p className="text-sm text-slate-400">
                Set a new password for <span className="text-slate-200 font-medium">{passwordResetUser.username}</span>
              </p>
            </div>

            <form onSubmit={handleUpdateUserPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>

              {resetError && (
                <div className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="text-sm text-green-400 bg-green-950/30 p-2 rounded border border-green-900/50">
                  {resetSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" onClick={closePasswordReset} disabled={isResettingPassword} className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isResettingPassword} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isResettingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        title="Delete User"
        message="This will permanently delete the user. This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={cancelDelete}
        isLoading={isDeletingUser}
      />
    </div>
  );
}
