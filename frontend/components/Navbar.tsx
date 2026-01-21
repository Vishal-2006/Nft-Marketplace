"use client";
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition">
          MetaMarket 💎
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-gray-300">
          <Link href="/" className="hover:text-white transition">Explore</Link>
          <Link href="/create" className="hover:text-white transition">Create NFT</Link>
          <Link href="/dashboard" className="hover:text-white transition">My Dashboard</Link>
        </div>

        {/* Connect Wallet Button */}
        <div>
          <ConnectButton 
            accountStatus="address"
            chainStatus="icon"
            showBalance={false}
          />
        </div>
      </div>
    </nav>
  );
}