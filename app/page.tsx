import ChatInput from "@/components/common/ChatInput/ChatInput";
import { Icon } from "@/components/svg/Icon";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="flex flex-col items-center justify-center w-screen  gap-4">
        <Icon className=" h-auto w-64" />
        <ChatInput />
      </div>
    </div>
  );
}
