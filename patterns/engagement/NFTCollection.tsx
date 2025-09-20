"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageIcon, Award, Calendar, AlertTriangle } from "lucide-react"
import { hederaClient, type HederaNFT } from "../../packages/hedera/HederaClient"

interface NFTCollectionProps {
  userId: string
}

export function NFTCollection({ userId }: NFTCollectionProps) {
  const [nfts, setNfts] = useState<HederaNFT[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNFTs()
  }, [userId])

  const loadNFTs = async () => {
    setLoading(true)
    try {
      if (!hederaClient.isReady()) {
        await hederaClient.initialize()
      }

      const userNFTs = hederaClient.getUserNFTs(userId)
      setNfts(userNFTs)
    } catch (error) {
      console.error("Failed to load NFTs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading NFT collection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            My Hashinals
          </div>
          <Badge variant="outline">{nfts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {nfts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hashinal NFTs yet</p>
              <p className="text-xs mt-1">Complete campaigns to earn rewards</p>
              <Button onClick={loadNFTs} size="sm" className="mt-2">
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {nfts.map((nft) => (
                <div
                  key={`${nft.tokenId}:${nft.serialNumber}`}
                  className="p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{nft.metadata.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{nft.metadata.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!nft.isTransferable && (
                        <Badge variant="secondary" className="text-xs">
                          Non-transferable
                        </Badge>
                      )}
                      {nft.isRevocable && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Revocable
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Token ID:</span>
                      <span className="font-mono">{nft.tokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Serial:</span>
                      <span className="font-mono">#{nft.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Campaign:</span>
                      <span>{nft.campaignId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Minted:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {nft.mintedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {nft.metadata.attributes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">Attributes:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(nft.metadata.attributes).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
