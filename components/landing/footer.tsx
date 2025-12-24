import React from "react";
import Link from "next/link";
import { Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white pt-20 pb-8 overflow-hidden border-t border-zinc-800">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-10">
          {/* Links Section - Left Side */}
          <div className="md:col-span-6 grid grid-cols-2 gap-8">
            {/* Company Column */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Company</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>

            {/* Products Column */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Products</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Live Chat</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Jiogram</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Datasetico</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Underline</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Keyword</Link></li>
              </ul>
            </div>
            
             {/* Social Icons - Below columns */}
            <div className="col-span-2 mt-4 flex space-x-3">
              <Link href="#" className="bg-zinc-900 p-3 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800">
                <Facebook className="w-5 h-5 text-gray-400" />
              </Link>
              <Link href="#" className="bg-zinc-900 p-3 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800">
                <Instagram className="w-5 h-5 text-gray-400" />
              </Link>
              <Link href="#" className="bg-zinc-900 p-3 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800">
                <Twitter className="w-5 h-5 text-gray-400" />
              </Link>
              <Link href="#" className="bg-zinc-900 p-3 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800">
                <Linkedin className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Right Side - Brand Name */}
          <div className="md:col-span-6 flex items-center justify-center md:justify-end">
             <h1 className="text-[15vw] md:text-[8vw] leading-none font-black tracking-tighter text-white select-none uppercase">
                UCOBOT
                <span className="text-xl md:text-4xl align-top ml-2 font-normal">®</span>
            </h1>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 pt-4 border-t border-zinc-800">
          <div className="flex gap-8 mb-4 md:mb-0">
            <Link href="#" className="hover:text-white transition-colors">Term & Condition</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <div>
            © {new Date().getFullYear()} UcoBot. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
