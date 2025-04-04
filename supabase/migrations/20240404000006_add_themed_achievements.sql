-- Add new themed achievements
insert into public.achievements (id, name, description, icon, rank, points, requires_progress, total_required)
values
  -- Basic Achievements (Level 1)
  ('digital-seedling', 'Digital Seedling', 'Created your first account', '🌱', 'basic', 50, false, null),
  ('first-deposit', 'Root Access', 'Made your first deposit in the bank', '🌿', 'basic', 75, false, null),
  ('first-mint', 'Binary Bloom', 'Minted your first NFT', '🌸', 'basic', 100, false, null),
  ('first-trade', 'Quantum Exchange', 'Completed your first trade', '⚛️', 'basic', 100, false, null),
  ('chat-sapling', 'Chat Sapling', 'Sent your first message in community chat', '🌿', 'basic', 50, false, null),

  -- Uncommon Achievements (Level 2)
  ('growing-portfolio', 'Growing Portfolio', 'Hold 5 different NFTs', '🪴', 'uncommon', 200, true, 5),
  ('steady-staker', 'Steady Staker', 'Stake tokens for 7 days', '🌳', 'uncommon', 150, true, 7),
  ('network-node', 'Network Node', 'Connect with 10 community members', '🔌', 'uncommon', 200, true, 10),
  ('market-analyzer', 'Market Analyzer', 'View market data for 14 consecutive days', '📊', 'uncommon', 175, true, 14),
  ('lending-pioneer', 'Lending Pioneer', 'Lend tokens 3 times', '💸', 'uncommon', 150, true, 3),

  -- Rare Achievements (Level 3)
  ('nft-cultivator', 'NFT Cultivator', 'Hold 15 different NFTs', '🎋', 'rare', 300, true, 15),
  ('yield-farmer', 'Yield Farmer', 'Earn interest from staking for 30 days', '🌾', 'rare', 350, true, 30),
  ('dao-botanist', 'DAO Botanist', 'Participate in 5 governance votes', '🗳️', 'rare', 400, true, 5),
  ('trade-sequencer', 'Trade Sequencer', 'Complete 20 successful trades', '🔄', 'rare', 300, true, 20),
  ('community-gardener', 'Community Gardener', 'Help 10 new members', '👥', 'rare', 250, true, 10),

  -- Epic Achievements (Level 4)
  ('crypto-forest', 'Crypto Forest', 'Hold 30 different NFTs', '🌲', 'epic', 500, true, 30),
  ('defi-mainframe', 'DeFi Mainframe', 'Have 5 active DeFi positions', '🖥️', 'epic', 600, true, 5),
  ('master-validator', 'Master Validator', 'Stake for 100 days total', '⚡', 'epic', 750, true, 100),
  ('trade-algorithm', 'Trade Algorithm', 'Complete 50 successful trades', '🤖', 'epic', 800, true, 50),
  ('quantum-portfolio', 'Quantum Portfolio', 'Reach 100 SOL in total value', '💎', 'epic', 1000, true, 100),

  -- Legendary Achievements (Level 5)
  ('genesis-tree', 'Genesis Tree', 'Hold 50 different NFTs', '🌳', 'legendary', 1500, true, 50),
  ('blockchain-oracle', 'Blockchain Oracle', 'Reach level 50', '🔮', 'legendary', 2000, true, 50),
  ('defi-architect', 'DeFi Architect', 'Earn 1000 SOL from DeFi', '🏛️', 'legendary', 2500, true, 1000),
  ('neural-network', 'Neural Network', 'Connect with 100 community members', '🧠', 'legendary', 1800, true, 100),
  ('digital-ecosystem', 'Digital Ecosystem', 'Complete all basic and uncommon achievements', '🌍', 'legendary', 3000, false, null)

on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    rank = excluded.rank,
    points = excluded.points,
    requires_progress = excluded.requires_progress,
    total_required = excluded.total_required,
    updated_at = now(); 