import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      <ChatClient />
    </div>
  );
}
