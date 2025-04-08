'use client'

import MainLayout from '@/components/MainLayout'
import { 
  LineChart, 
  RefreshCw, 
  Image, 
  Building2,
  Trophy,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export default function Home() {
  const features: FeatureCard[] = [
    {
      title: "Markets & Insights",
      description: "Real-time market data, trends analysis, and expert insights to inform your trading decisions",
      icon: LineChart,
      href: "/markets"
    },
    {
      title: "Trading Hub",
      description: "Advanced trading tools, newly listed tokens, and seamless DEX integration for optimal trades",
      icon: RefreshCw,
      href: "/trading"
    },
    {
      title: "NFT Collection",
      description: "Explore and manage your digital collectibles with our premium NFT features",
      icon: Image,
      href: "/nft"
    },
    {
      title: "Banking & DeFi",
      description: "Secure banking services and DeFi solutions for your crypto assets",
      icon: Building2,
      href: "/banking"
    },
    {
      title: "Achievements & Rewards",
      description: "Earn rewards and track your progress with our comprehensive achievement system",
      icon: Trophy,
      href: "/achievements"
    },
    {
      title: "Community & Social",
      description: "Connect with fellow traders and join our thriving community",
      icon: Users,
      href: "/community"
    }
  ];

  const FeatureCard = ({ feature }: { feature: FeatureCard }) => (
    <Link href={feature.href} className="group block">
      <div className="relative h-full rounded-lg p-6 border border-green-500/20 overflow-hidden bg-zinc-800/30">
        {/* Mesh Background */}
        <div className="absolute inset-0">
          {/* Primary mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(#22c55e30_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          {/* Secondary mesh - rotated and offset */}
          <div className="absolute inset-0 bg-[radial-gradient(#22c55e25_2px,transparent_2px)] [background-size:32px_32px] rotate-45" />
          {/* Tertiary mesh - smaller dots */}
          <div className="absolute inset-0 bg-[radial-gradient(#22c55e20_1px,transparent_1px)] [background-size:16px_16px] rotate-30" />
          {/* Light overlay */}
          <div className="absolute inset-0 bg-white/[0.02]" />
        </div>
        
        {/* Feathered Edge */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/10" />

        {/* Content */}
        <div className="relative flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <feature.icon className="w-6 h-6 text-green-400" />
            <h2 className="font-garamond text-2xl font-bold italic text-green-400">{feature.title}</h2>
          </div>
          <p className="text-sm text-zinc-400 flex-grow">
            {feature.description}
          </p>
          <div className="mt-4 text-xs font-mono text-green-400/50 group-hover:text-green-400 transition-colors">
            Learn more →
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <MainLayout>
      <div className="h-full flex flex-col justify-center gap-8">
        {/* Top Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {features.slice(0, 3).map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-4">
          <h1 className="font-garamond text-5xl font-bold italic text-green-400">Welcome to PrintGreen™</h1>
          <p className="font-mono text-zinc-400">
            SUSTAINABLY SOURCED FREERANGE<br />
            COMPUTE POWERING ORGANIC HALAL<br />
            CRYPTO TRADING
          </p>
        </div>

        {/* Bottom Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {features.slice(3, 6).map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
