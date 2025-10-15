import { redirect } from "next/navigation"

// Redirect to main contacts page
export default function HomePage() {
  redirect("/contacts")
}
