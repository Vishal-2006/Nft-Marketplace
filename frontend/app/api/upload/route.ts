import { NextResponse, NextRequest } from "next/server";
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "gateway.pinata.cloud",
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const jsonBody = data.get("jsonBody");
    let upload;

    if (file) {
      upload = await pinata.upload.file(file);
    } else if (jsonBody) {
      const json = JSON.parse(jsonBody as string);
      const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
      const metaFile = new File([blob], "metadata.json", { type: "application/json" });
      upload = await pinata.upload.file(metaFile);
    } else {
      return NextResponse.json({ error: "No data found" }, { status: 400 });
    }

    return NextResponse.json({ ipfsHash: upload.IpfsHash }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}