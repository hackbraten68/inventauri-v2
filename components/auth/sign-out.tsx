'use client';

import { useRouter } from "next/navigation";
import { Slot } from "@radix-ui/react-slot";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useSupabase } from "../auth-provider";

type SignOutProps = Pick<ButtonProps, "className" | "variant" | "size"> & {
  asChild?: boolean;
};

export default function SignOut({ className, variant = "ghost", size, asChild }: SignOutProps) {
  const router = useRouter();
  const supabase = useSupabase();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (asChild) {
    return (
      <Slot onClick={handleSignOut} className={className}>
        Sign out
      </Slot>
    );
  }

  return (
    <Button onClick={handleSignOut} className={className} variant={variant} size={size}>
      Sign out
    </Button>
  );
}
