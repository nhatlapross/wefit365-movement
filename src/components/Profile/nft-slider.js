"use client"
import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"

export default function NFTSlider({ onNFTUse }) {
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);

  // State to hold NFTs with default empty array
  const [nfts, setNFTs] = useState([])
  const [selectedNFT, setSelectedNFT] = useState(null)
  const { account, signAndSubmitTransaction } = useWallet();
  const [hash, setHash] = useState(null);
  const [nftDetails, setNftDetails] = useState([]); // Fixed useState declaration
  const [isLoading, setIsLoading] = useState(false); // Fixed useState declaration
  const [error, setError] = useState(null); // Fixed useState declaration

  useEffect(() => {
    const getNFTbyAddress = async() => {
      try {
        const nfts = await aptos.view({
          payload: {
            function: `${process.env.NEXT_PUBLIC_APTOS_CONTRACT}::challenge_nft::get_nft_details_by_address`,
            functionArguments: [account?.address],
          }
         })

        if(nfts.length > 0) {
          setNftDetails(nfts[0]); // Using the correct setter function
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if(account != null) {
      getNFTbyAddress(account?.address);
    }
  }, [account])

  const [isMinting, setIsMinting] = useState(false);

  // Transform contract NFT data to component's NFT interface
  useEffect(() => {
    if (nftDetails && Array.isArray(nftDetails)) {
      const transformedNFTs = nftDetails.map((nft) => ({
        token_id: nft.token_id,
        last_update_day: nft.last_update_day,
        level: nft.level,
        name: nft.name,
        points: nft.points,
        rarity: nft.rarity,
        token_uri: nft.token_uri,
        isUsing: false,
        isSelling: false
      }))
      
      setNFTs(transformedNFTs)
    }
  }, [nftDetails])

  const handleNFTClick = (nft) => {
    if (!nft.isSelling) {
      setSelectedNFT(nft)
    }
  }

  const handleCloseModal = () => {
    setSelectedNFT(null)
  }

  const redeemPoint = async () => {
    setIsMinting(true);
    const response = await signAndSubmitTransaction({
      sender: account.address,
      data: {
        function: `${process.env.NEXT_PUBLIC_APTOS_CONTRACT}::challenge_nft::redeem_points`,
        functionArguments: [selectedNFT.token_id, selectedNFT.points],
      },
    }).then((res) =>{
      setHash(res.hash);
      setIsMinting(false);
    }).finally(() =>{

    });
  }

  const handleUseNFT = () => {
    if (!selectedNFT) return

    const updatedNFTs = nfts.map(nft => {
      if (nft.token_id === selectedNFT.token_id) {
        return { 
          ...nft, 
          isUsing: !nft.isUsing,
          isSelling: false
        }
      }
      return { 
        ...nft, 
        isUsing: false,
        isSelling: false
      }
    })
    
    const usedNFT = updatedNFTs.find(nft => nft.token_id === selectedNFT.token_id && nft.isUsing)
    
    setNFTs(updatedNFTs)
    onNFTUse && onNFTUse(usedNFT || null)
    handleCloseModal()
  }

  useEffect(()=>{
    if(hash != null){
      alert("redeem success!");
    }
  },[hash])

  // Render loading or error states
  if (isLoading) return <div>Loading NFTs...</div>
  if (error) return <div>Error loading NFTs: {error.message}</div>

  return (
    <>
      <Carousel className="w-full max-w-xs mx-auto">
        <CarouselContent>
          {nfts.map((nft) => (
            <CarouselItem key={nft.token_id}>
              <Card>
                <CardContent 
                  className={`
                    flex aspect-square items-center justify-center p-6 relative 
                    hover:bg-gray-800 cursor-pointer
                    transition-colors duration-200
                    ${nft.isUsing ? "border-2 border-green-500" : ""}
                    ${nft.isSelling ? "opacity-50" : ""}
                  `}
                  onClick={() => handleNFTClick(nft)}
                >
                  <div className="text-center">
                    <div className="relative">
                      <Image
                        src={nft.token_uri}
                        alt={nft.name}
                        width={150}
                        height={150}
                        className="mx-auto mb-2 rounded-lg"
                      />
                      {nft.isUsing && (
                        <Badge 
                          variant="default" 
                          className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4"
                        >
                          Using
                        </Badge>
                      )}
                      {nft.isSelling && (
                        <Badge 
                          variant="destructive" 
                          className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4"
                        >
                          Selling
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold">{nft.name}</h4>
                    {nft.isSelling && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Implement cancel sell logic
                        }}
                      >
                        Cancel Sell
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {selectedNFT && !selectedNFT.isSelling && (
        <Dialog open={!!selectedNFT} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{selectedNFT.name}</DialogTitle>
              <DialogDescription>NFT Details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Image
                  src={selectedNFT.token_uri}
                  alt={selectedNFT.name}
                  width={100}
                  height={100}
                  className="col-span-2 mx-auto rounded-lg"
                />
                <div className="col-span-2 space-y-2">
                  <p><strong>Token ID:</strong>{selectedNFT.token_id}</p>
                  <p><strong>Level:</strong> {selectedNFT.level.toString()}</p>
                  <p><strong>Last Update:</strong> {selectedNFT.last_update_day.toString()}</p>
                  <p><strong>Points:</strong> {selectedNFT.points.toString()}</p>
                  <p><strong>Rarity:</strong> {selectedNFT.rarity}</p>
                </div>
              </div>
              <div className="flex justify-between space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleUseNFT}
                  className="w-full hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                >
                  {selectedNFT.isUsing ? "Unuse NFT" : "Use NFT"}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => redeemPoint()}
                  disabled={isMinting}
                  className="w-full hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                >
                  {isMinting ? "Redeeming..." : "Redeem"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}