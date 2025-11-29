import ChatInput from "@/components/common/ChatInput/ChatInput";
import { Icon } from "@/components/svg/Icon";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="">
        <Icon className=" h-auto w-64" />
      </div>
      <ChatInput />
    </div>
  );
}
