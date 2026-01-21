"use client";
import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useRouter } from 'next/navigation';
import { NFTMarketplaceAddress, NFTMarketplaceABI_Export } from '@/constants/index';

export default function CreateNFT() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  async function handleCreate() {
    if (!file || !name || !price) return;
    setUploading(true);

    try {
      // 1. Upload Image
      const data = new FormData();
      data.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: data });
      const { ipfsHash: imageHash } = await uploadRes.json();

      // 2. Upload Metadata
      const metadata = { name, description: desc, image: `ipfs://${imageHash}` };
      const metaData = new FormData();
      metaData.append("jsonBody", JSON.stringify(metadata));
      const metaRes = await fetch("/api/upload", { method: "POST", body: metaData });
      const { ipfsHash: metaHash } = await metaRes.json();

      // 3. Create on Blockchain
      const priceInWei = parseEther(price);
      const listingFee = parseEther("0.0000005"); // Must match contract listing price 

      writeContract({
        address: NFTMarketplaceAddress,
        abi: NFTMarketplaceABI_Export,
        functionName: 'createToken',
        args: [`ipfs://${metaHash}`, priceInWei],
        value: listingFee,
      });

    } catch (e) {
      console.error(e);
      setUploading(false);
    }
  }

  // Redirect after success
  if (isConfirmed) {
     setTimeout(() => router.push('/'), 1000);
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Create New NFT
        </h1>
        
        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:bg-gray-700/50 transition">
            <input 
              type="file" 
              onChange={e => setFile(e.target.files?.[0] || null)} 
              className="hidden" 
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <span className="text-4xl">🖼️</span>
              <span className="text-gray-400 text-sm">{file ? file.name : "Click to Upload Image"}</span>
            </label>
          </div>

          <input 
            placeholder="Asset Name" 
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500 transition"
            onChange={e => setName(e.target.value)}
          />
          
          <textarea 
            placeholder="Description" 
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500 transition"
            rows={3}
            onChange={e => setDesc(e.target.value)}
          />

          <div className="relative">
            <input 
              type="number" 
              placeholder="Price (ETH)" 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500 transition pl-10"
              onChange={e => setPrice(e.target.value)}
            />
            <span className="absolute left-3 top-3.5 text-gray-400">Ξ</span>
          </div>

          <button 
            onClick={handleCreate} 
            disabled={uploading || isPending || isConfirming}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading to IPFS..." : 
             isPending ? "Confirm in Wallet..." : 
             isConfirming ? "Minting..." : 
             isConfirmed ? "Success! Redirecting..." : "Create & List NFT"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Listing Fee: 0.1 ETH
          </p>
        </div>
      </div>
    </div>
  );
}