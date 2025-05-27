import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"

interface NFTItem {
    rindexerId: string
    seller: string
    nftAddress: string
    tokenId: string
    price: string
    contractAddress: string
    blockNumber: number
    txHash: string
}

interface BoughtCancelled {
    nftAddress: string
    tokenId: string
}

interface NFTQueryResponse {
    data: {
        allItemListeds: {
            nodes: NFTItem[]
        }
        allItemBoughts: {
            nodes: BoughtCancelled[]
        }
        allItemCanceleds: {
            nodes: BoughtCancelled[]
        }
    }
}

const GET_RECENT_NFTS = `
  query GetRecentlyListedNFTs {
    allItemListeds(
      first: 20,
      orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC, LOG_INDEX_DESC]
    ) {
      nodes {
        rindexerId
        seller
        nftAddress
        tokenId
        price
        contractAddress
        blockNumber
        txHash
      }
    }
    
    allItemBoughts {
      nodes {
        nftAddress
        tokenId
      }
    }
    
    allItemCanceleds {
      nodes {
        nftAddress
        tokenId
      }
    }
  }
`

async function fetchNFTs(): Promise<NFTQueryResponse> {
    const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: GET_RECENT_NFTS,
        }),
    })

    if (!response.ok) {
        throw new Error("Failed to fetch NFTs")
    }

    return response.json()
}

function useRecentlyListedNFTs() {
    const { data, error, isLoading } = useQuery<NFTQueryResponse>({
        queryKey: ["recentNFTs"],
        queryFn: fetchNFTs,
    })

    const nftDataList = useMemo(() => {
        if (!data) return []
        const boughtNFTs = new Set<String>()
        const cancelledNFTs = new Set<String>()

        data.data.allItemBoughts.nodes.forEach(item => {
            boughtNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })

        data.data.allItemCanceleds.nodes.forEach(item => {
            cancelledNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })

        const availNfts = data.data.allItemListeds.nodes.filter(item => {
            if (!item.nftAddress || !item.tokenId) return false
            const nftKey = `${item.nftAddress}-${item.tokenId}`
            return !boughtNFTs.has(nftKey) && !cancelledNFTs.has(nftKey)
        })

        const recentNfts = availNfts.slice(0, 100)

        return recentNfts.map(nft => ({
            rindexerId: nft.rindexerId,
            seller: nft.seller,
            nftAddress: nft.nftAddress.trim(),
            tokenId: nft.tokenId,
            price: nft.price,
            contractAddress: nft.contractAddress.trim(),
            blockNumber: nft.blockNumber,
            txHash: nft.txHash,
        }))
    }, [data])

    return {
        nftDataList,
        isLoading,
        error,
    }
}

// Main component that uses the custom hook
export default function RecentlyListedNFTs() {
    const { nftDataList, isLoading, error } = useRecentlyListedNFTs()

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mt-8 text-center">
                <Link
                    href="/list-nft"
                    className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    List Your NFT
                </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6">Recently Listed NFTs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {nftDataList.map(nft => (
                    <Link
                        href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`}
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                    >
                        <NFTBox
                            key={`${nft.contractAddress}-${nft.tokenId}`}
                            tokenId={nft.tokenId}
                            price={nft.price}
                            contractAddress={nft.contractAddress}
                        />
                    </Link>
                ))}
            </div>
        </div>
    )
}
