"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const HomePage = () => {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Tellmi</h1>
          <p className="text-muted-foreground">
            Share your thoughts, post comments, and join the conversation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Browse and create posts on any topic.
              </p>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/posts" />}>
                View Posts
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore content organized by category.
              </p>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/categories" />}>
                View Categories
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};
