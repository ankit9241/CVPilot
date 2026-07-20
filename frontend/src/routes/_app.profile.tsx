import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "../components/profile/profile-page";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — CVPilot" }] }),
  component: ProfilePage,
});
