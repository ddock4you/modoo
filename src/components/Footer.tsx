import { Link } from "react-router-dom";
import LogoDark from "./LogoDark";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="pb-25">
      <div className=" px-7 py-9 bg-[#1C1D1D] dark:bg-gray-900 flex flex-col text-neutral-400">
        <Link to="/" className="mb-4">
          <LogoDark />
        </Link>
        <div className="flex items-center mb-3">
          <Mail size={14} className="mr-1" />
          <span className="text-sm">Modoo@gmail.com</span>
        </div>
        <div className="flex items-center mb-5">
          <span className="text-sm leading-relaxed  break-keep">
            모두의숲은 여러분의 건의와 피드백을 기다립니다. 개선 사항이나 아이디어를 남겨주시면
            빠르게 반영하여 보다 좋은 서비스를 제공할 수 있도록 최선을 다하겠습니다.
          </span>
        </div>
        <nav className="flex items-center mb-3 text-sm">
          <Link
            to="/"
            className="after:content-['|'] after:mx-3 after:text-xs after:text-neutral-500"
          >
            <span>이용약관</span>
          </Link>
          <Link to="/">
            <span>개인정보처리방침</span>
          </Link>
        </nav>
        <p className="text-sm">Copyright (c) Modoo. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
