import Link from "next/link";
import Image from "next/image";
const Footer = () => {
    return (
        <div className="mt-16 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between gap-0 bg-gray-800 p-8 rounded-lg">

            <div className="flex flex-col items-center gap-4 md:items-start">
                <Link href="/" className="flex items-center">
                    <Image src="/logo.png" alt="Trendlama" width={36} height={36} />
                    <p className="hidden md:block text-md font-medium tracking-wider text-white">TRENDLAMA.</p>
                </Link>
                <p className="text-sm text-gray-400">@ 2026 Trendlama</p>
                <p className="text-sm text-gray-400">All rights reserved.</p>
            </div>

            <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
                <p className="text-sm font-medium text-amber-50">Links</p>
                <Link href="/home">Home</Link>
                <Link href="/home">About us</Link>
                <Link href="/home">Contact</Link>
                <Link href="/home">Privacy Policy</Link>
            </div>

            <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
                <p className="text-sm font-medium text-amber-50">Products</p>
                <Link href="/home">All Products</Link>
                <Link href="/home">Best seller</Link>
                <Link href="/home">New Arrivals</Link>
                <Link href="/home">Sale</Link>
            </div>

            <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
                <p className="text-sm font-medium text-amber-50">Company</p>
                <Link href="/home">About</Link>
                <Link href="/home">Contact</Link>
                <Link href="/home">Blog</Link>
                <Link href="/home">Affiliate Program</Link>
            </div>

        </div>
    )
}


export default Footer;