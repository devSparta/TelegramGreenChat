import {useState} from "react"

import {ConnectScreen} from "@/components/connection/connect-screen"
import {MessengerPage} from "@/components/messenger/messenger-page"
import {Toaster} from "@/components/ui/sonner"
import type {GreenApiCredentials} from "@/lib/green-api"

export default function App() {
  const [credentials, setCredentials] = useState<GreenApiCredentials | null>(null)

  return (
    <>
      {credentials ? (
        <MessengerPage
          credentials={credentials}
          onDisconnect={() => setCredentials(null)}
        />
      ) : (
        <ConnectScreen onConnected={setCredentials}/>
      )}
      <Toaster richColors position="top-center"/>
    </>
  )
}
