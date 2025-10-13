import { redirect } from "next/navigation"

// GenZ hackathon demo: start with contacts page using default seeded profile
export default function HomePage() {
  redirect("/contacts")
}
