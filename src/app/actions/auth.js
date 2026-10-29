"use server";

import { getAuth } from "../../lib/auth/server";

export async function getAccountSession() {
  const { data, error } = await getAuth().getSession();
  if (error) {
    console.error("Could not retrieve the account session:", error);
    return { error: "Could not verify your account session." };
  }
  return { user: data?.user || null };
}

export async function registerAccount(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || name.length > 100) return { error: "Enter a name of 1 to 100 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "Use a password between 8 and 128 characters." };
  }

  const { error } = await getAuth().signUp.email({ name, email, password });
  return error ? { error: error.message || "Could not create your account." } : { success: true };
}

export async function signInAccount(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }
  if (!password || password.length > 128) return { error: "Enter your password." };

  const { error } = await getAuth().signIn.email({ email, password });
  return error ? { error: error.message || "Could not sign in." } : { success: true };
}

export async function signOutAccount() {
  const { error } = await getAuth().signOut();
  return error ? { error: error.message || "Could not sign out." } : { success: true };
}
