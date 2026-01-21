"use client";
import { useEffect, useState } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { NFTMarketplaceAddress, NFTMarketplaceABI_Export } from '@/constants/index';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// --- TYPES ---
interface NFT {
  price: string;
  tokenId: string;
  seller: string;
  owner: string;
  image: string;
  name: string;
  description: string;
}

export default function Home() {
  const { isConnected } = useAccount(); // Check if wallet is connected

  // 1. IF NOT CONNECTED -> SHOW LANDING PAGE
  if (!isConnected) {
    return <LandingPage />;
  }

  // 2. IF CONNECTED -> SHOW MARKETPLACE
  return <Marketplace />;
}

// --- COMPONENT: LANDING PAGE ---
function LandingPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Background Glows (Visual Effect) */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent z-10">
                Discover & Collect <br /> Extraordinary NFTs
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl z-10">
                The world's most secure and decentralized marketplace. 
                Connect your wallet to start collecting digital assets today.
            </p>

            <div className="z-10 scale-125">
                <ConnectButton label="Connect Wallet to Enter" />
            </div>
        </div>
    );
}

// --- COMPONENT: MARKETPLACE EXPLORER ---
function Marketplace() {
  const [loading, setLoading] = useState(true);

  // Fetch Unsold Items from Blockchain
  const { data: rawNfts } = useReadContract({
    address: NFTMarketplaceAddress,
    abi: NFTMarketplaceABI_Export,
    functionName: 'fetchMarketItems',
  });

  useEffect(() => {
    if(rawNfts) setLoading(false);
  }, [rawNfts]);

  if (loading && !rawNfts) return <div className="p-10 text-center text-xl animate-pulse">📡 Loading Blockchain Data...</div>;
  
  if (rawNfts && (rawNfts as any[]).length === 0) return (
    <div className="p-10 text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-500">📭 Marketplace is Empty</h2>
        <p className="text-gray-600">Be the first to list an NFT!</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 border-l-4 border-blue-500 pl-4">
        Explore Collections
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(rawNfts as any[])?.map((nft: any, i: number) => (
          <NFTCard key={i} nftData={nft} />
        ))}
      </div>
    </div>
  );
}

// --- COMPONENT: NFT CARD ---
function NFTCard({ nftData }: { nftData: any }) {
  const [meta, setMeta] = useState<any>(null);
  const { writeContract } = useWriteContract();

  // Fetch Token URI to get Image & Name
  const { data: tokenUri } = useReadContract({
    address: NFTMarketplaceAddress,
    abi: NFTMarketplaceABI_Export,
    functionName: 'tokenURI',
    args: [nftData.tokenId],
  });

  useEffect(() => {
    if (tokenUri) {
      // Convert IPFS link to HTTP link
      const url = String(tokenUri).replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
      fetch(url)
        .then(res => res.json())
        .then(data => setMeta(data))
        .catch(err => console.error("Meta Error", err));
    }
  }, [tokenUri]);

  if (!meta) return <div className="h-80 bg-gray-800/50 rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20 transition group flex flex-col">
      <div className="h-64 overflow-hidden relative bg-gray-900">
        <Image 
          src={meta.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} 
          alt={meta.name} 
          width={400} 
          height={400} 
          className="object-cover w-full h-full group-hover:scale-110 transition duration-500" 
        />
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-bold truncate text-white">{meta.name}</h3>
            <p className="text-gray-400 text-sm truncate">{meta.description}</p>
        </div>
        
        <div className="mt-4 flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
          <div className="text-blue-400 font-bold">
            {formatEther(nftData.price)} ETH
          </div>
          <button 
            onClick={() => writeContract({
                address: NFTMarketplaceAddress,
                abi: NFTMarketplaceABI_Export,
                functionName: 'createMarketSale',
                args: [nftData.tokenId],
                value: nftData.price,
            })}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition uppercase tracking-wide"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}