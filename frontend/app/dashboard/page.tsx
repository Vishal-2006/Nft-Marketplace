"use client";
import { useEffect, useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { NFTMarketplaceAddress, NFTMarketplaceABI_Export } from '@/constants/index';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 1. MAIN PAGE COMPONENT (The Default Export)
export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);

  // Fetch My NFTs
  const { data: myNfts } = useReadContract({
    address: NFTMarketplaceAddress,
    abi: NFTMarketplaceABI_Export,
    functionName: 'fetchMyNFTs',
    account: address, 
  });

  useEffect(() => {
    if(myNfts || !isConnected) setLoading(false);
  }, [myNfts, isConnected]);

  if (!isConnected) return (
    <div className="h-[50vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-400">🔒 Wallet Not Connected</h2>
        <p className="text-gray-500 mt-2">Please connect your wallet to view your assets.</p>
    </div>
  );

  if (loading && !myNfts) return <div className="p-10 text-center text-xl animate-pulse">📡 Loading Your Assets...</div>;
  
  if (myNfts && (myNfts as any[]).length === 0) return (
    <div className="p-10 text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-600 mb-4">📭 No NFTs Found</h2>
        <p className="text-gray-500 mb-6">You haven't purchased any digital assets yet.</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition">
            Explore Marketplace
        </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 border-l-4 border-green-500 pl-4">
        My Collection 🏆
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(myNfts as any[])?.map((nft: any, i: number) => (
          <DashboardCard key={i} nftData={nft} />
        ))}
      </div>
    </div>
  );
}

// 2. CARD COMPONENT (Handles Display & Selling)
function DashboardCard({ nftData }: { nftData: any }) {
  const [meta, setMeta] = useState<any>(null);
  const [price, setPrice] = useState(""); 
  const [isSelling, setIsSelling] = useState(false);
  const router = useRouter();

  // Contract Write Hook (For Selling)
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Fetch Metadata (Image/Name)
  const { data: tokenUri } = useReadContract({
    address: NFTMarketplaceAddress,
    abi: NFTMarketplaceABI_Export,
    functionName: 'tokenURI',
    args: [nftData.tokenId],
  });

  useEffect(() => {
    if (tokenUri) {
      const url = String(tokenUri).replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
      fetch(url).then(res => res.json()).then(data => setMeta(data));
    }
  }, [tokenUri]);

  // Handle Sell
  function handleResell() {
    if (!price) return;
    const priceInWei = parseEther(price);
    const listingFee = parseEther("0.1"); // Keeping it 0 as per your new contract

    writeContract({
        address: NFTMarketplaceAddress,
        abi: NFTMarketplaceABI_Export,
        functionName: 'resellToken',
        args: [nftData.tokenId, priceInWei],
        value: listingFee,
    });
  }

  // Reload page after sell
  useEffect(() => {
     if(isConfirmed) {
         window.location.reload(); 
     }
  }, [isConfirmed]);

  if (!meta) return <div className="h-80 bg-gray-800 rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-2xl transition flex flex-col">
      <div className="h-48 overflow-hidden relative">
        <Image 
          src={meta.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} 
          alt={meta.name} 
          width={400} 
          height={400} 
          className="object-cover w-full h-full" 
        />
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            OWNED
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <h3 className="text-lg font-bold truncate">{meta.name}</h3>
        <p className="text-gray-400 text-sm truncate mb-4">{meta.description}</p>
        
        <div className="text-sm text-gray-500">Bought for: <span className="text-green-400 font-bold">{formatEther(nftData.price)} ETH</span></div>

        {/* SELL SECTION */}
        <div className="mt-4 pt-4 border-t border-gray-700">
            {!isSelling ? (
                <button 
                    onClick={() => setIsSelling(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold transition"
                >
                    List for Sale
                </button>
            ) : (
                <div className="space-y-2">
                    <input 
                        type="number" 
                        placeholder="New Price (ETH)" 
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-blue-500 outline-none"
                        onChange={e => setPrice(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleResell}
                            disabled={isPending || isConfirming}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm transition disabled:opacity-50"
                        >
                            {isPending ? "Sign..." : isConfirming ? "Selling..." : "Confirm Sell"}
                        </button>
                        <button 
                            onClick={() => setIsSelling(false)}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-sm transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}