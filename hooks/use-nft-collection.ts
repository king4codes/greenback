'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { fetchDigitalAsset, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata'
import { publicKey } from '@metaplex-foundation/umi'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/lib/auth'
import { useAchievements } from '@/hooks/use-achievements'

interface NFTMetadata {
  image?: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

interface NFT {
  mint: string
  name: string
  symbol: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

export function useNFTCollection() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { publicKey: walletPublicKey } = useWallet()
  const { user } = useAuth()
  const { updateProgress } = useAchievements()

  const fetchNFTs = async () => {
    if (!walletPublicKey || !user) {
      setNfts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Initialize UMI
      const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      const umi = createUmi(endpoint).use(mplTokenMetadata())

      // Fetch token accounts for the wallet
      const connection = new Connection(endpoint)
      const response = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      })

      // Fetch NFT metadata for each token
      const nftPromises = response.value
        .filter(account => account.account.data.parsed.info.tokenAmount.uiAmount === 1)
        .map(async account => {
          try {
            const mintAddress = account.account.data.parsed.info.mint
            const mint = publicKey(mintAddress)
            const metadata = await fetchDigitalAsset(umi, mint)
            
            // Fetch off-chain metadata if URI exists
            let offChainMetadata: NFTMetadata = {}
            if (metadata.metadata.uri) {
              try {
                const response = await fetch(metadata.metadata.uri)
                offChainMetadata = await response.json()
              } catch (err) {
                console.error('Error fetching NFT metadata:', err)
              }
            }

            return {
              mint: mintAddress,
              name: metadata.metadata.name,
              symbol: metadata.metadata.symbol || '',
              image: offChainMetadata.image || '',
              attributes: offChainMetadata.attributes || []
            } as NFT
          } catch (err) {
            console.error('Error processing NFT:', err)
            return null
          }
        })

      const nftResults = (await Promise.all(nftPromises)).filter((nft): nft is NFT => nft !== null)

      // Update Supabase with the user's NFTs
      if (user.id && nftResults.length > 0) {
        const { error: nftError } = await supabase
          .from('user_nfts')
          .upsert(nftResults.map(nft => ({
            user_id: user.id,
            mint_address: nft.mint,
            name: nft.name,
            image_url: nft.image,
            collection: nft.symbol
          })))

        if (nftError) {
          console.error('Error saving NFTs:', nftError)
        }

        // Update NFT-related achievements
        const nftCount = nftResults.length;
        console.log('Updating NFT achievements with count:', nftCount);

        // Growing Portfolio (5 NFTs)
        await updateProgress('growing-portfolio', nftCount);

        // NFT Collector (5 NFTs)
        await updateProgress('nft-collector', nftCount);

        // NFT Cultivator (15 NFTs)
        await updateProgress('nft-cultivator', nftCount);

        // Crypto Forest (30 NFTs)
        await updateProgress('crypto-forest', nftCount);

        // Genesis Tree (50 NFTs)
        await updateProgress('genesis-tree', nftCount);
      }

      setNfts(nftResults)
    } catch (err) {
      console.error('Error fetching NFTs:', err)
      setError('Failed to fetch NFTs')
    } finally {
      setLoading(false)
    }
  }

  const filterNFTsByTraits = (traits: Record<string, string[]>) => {
    if (Object.keys(traits).length === 0) return nfts

    return nfts.filter(nft => {
      return Object.entries(traits).every(([traitType, selectedValues]) => {
        if (selectedValues.length === 0) return true

        const nftTrait = nft.attributes.find(attr => attr.trait_type === traitType)
        return nftTrait && selectedValues.includes(nftTrait.value)
      })
    })
  }

  useEffect(() => {
    fetchNFTs()
  }, [walletPublicKey, user])

  return {
    nfts,
    loading,
    error,
    fetchNFTs,
    filterNFTsByTraits
  }
} 