"use client";

import Link from "next/link";
import { Tags, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin panel</h1>
        <p className="text-sm text-zinc-400">
          Manage the Tellmi community.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Users
            </CardTitle>
            <CardDescription>
              View and manage community members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/users" />}
            >
              Manage users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="size-4 text-muted-foreground" />
              Categories
            </CardTitle>
            <CardDescription>
              Create, rename and organize post categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/categories" />}
            >
              Manage categories
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}