"use client"

import { useAccount } from "wagmi"
import RecentlyListedNFTs from "@/components/RecentlyListed"
import { useEffect, useState } from "react"

export default function Home() {
    const { isConnected, address } = useAccount()
    const [isCompliant, setIsCompliant] = useState(true)

    useEffect(() => {
        if (address) checkCompilance()
    }, [address])

    async function checkCompilance() {
        if (!address) return

        const response = await fetch("/api/compliance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ address }),
        })

        const result = await response.json()

        setIsCompliant(result.success && result.isApproved)
    }

    return (
        <main>
            {!isConnected ? (
                <div className="flex items-center justify-center p-4 md:p-6 xl:p-8">
                    Please connect a wallet
                </div>
            ) : (
                <div className="flex items-center justify-center p-4 md:p-6 xl:p-8">
                    {isCompliant ? <RecentlyListedNFTs /> : <div>You are denied</div>}
                </div>
            )}
        </main>
    )
}
