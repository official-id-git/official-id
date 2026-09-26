import TreeICQRStudio from "@/components/qr/TreeICQRStudio";

export const metadata = {
  title: "official.id — 3D Voxel Magic Tree QR Code Generator",
  description:
    "Turn any link into a stunning 3D Voxel Magic Tree that doubles as a scannable QR Code with wind foliage animation. Inspired by tree.icqr.com.",
};

export default function Home() {
  return <TreeICQRStudio />;
}
