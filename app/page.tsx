import { redirect } from "next/navigation"

// GenZ flow: start with adding friends, then send signals to them
export default function HomePage() {
  redirect("/contacts")
}
