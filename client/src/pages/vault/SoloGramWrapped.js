// pages/vault/SoloGramWrapped.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import {
  FaArrowLeft,
  FaHeart,
  FaCamera,
  FaLightbulb,
  FaTag,
  FaCalendarAlt,
  FaStar,
} from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';

const NOIR = {
  ink: '#0a0a0b',
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  salmon: '#e87c5a',
  sage: '#7aab8c',
  gold: '#c9a84c',
};

const SoloGramWrapped = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(0); // count of cards revealed so far

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, thoughtsRes] = await Promise.all([
          axios.get('/api/posts?limit=1000'),
          axios.get('/api/thoughts?limit=1000'),
        ]);

        const posts = postsRes.data?.data || [];
        const thoughts = thoughtsRes.data?.data || [];

        // ── Compute stats ──────────────────────────────────────────────────
        const totalLikes =
          posts.reduce((sum, p) => sum + (p.likes || 0), 0) +
          thoughts.reduce((sum, t) => sum + (t.likes || 0), 0);

        const allDates = [...posts, ...thoughts]
          .map((x) => new Date(x.createdAt))
          .filter(Boolean)
          .sort((a, b) => a - b);

        const firstDate = allDates[0] || new Date();
        const daysActive = differenceInDays(new Date(), firstDate);

        // Most used tags
        const tagCounts = {};
        [...posts, ...thoughts].forEach((x) => {
          (x.tags || []).forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag]) => tag);

        // Most active month
        const monthCounts = {};
        allDates.forEach((d) => {
          const key = format(d, 'MMM yyyy');
          monthCounts[key] = (monthCounts[key] || 0) + 1;
        });
        const topMonth =
          Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          '—';

        // Most liked post
        const topPost = posts.sort(
          (a, b) => (b.likes || 0) - (a.likes || 0)
        )[0];

        // Avg thoughts per week
        const weeks = Math.max(1, daysActive / 7);
        const avgThoughtsPerWeek = (thoughts.length / weeks).toFixed(1);

        setStats({
          totalPosts: posts.length,
          totalThoughts: thoughts.length,
          totalLikes,
          daysActive,
          firstDate,
          topTags,
          topMonth,
          topPost,
          avgThoughtsPerWeek,
        });
      } catch (err) {
        console.error('Failed to fetch wrapped stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Stagger reveal each stat card
  useEffect(() => {
    if (!stats) return;
    const interval = setInterval(() => {
      setRevealed((r) => {
        if (r >= 6) {
          clearInterval(interval);
          return r;
        }
        return r + 1;
      });
    }, 220);
    return () => clearInterval(interval);
  }, [stats]);

  if (loading)
    return (
      <Shell>
        <Inner>
          <LoadingMsg>
            Compiling your story<Blink>_</Blink>
          </LoadingMsg>
        </Inner>
      </Shell>
    );

  return (
    <Shell>
      <Inner>
        <TopBar>
          <BackLink to='/'>
            <FaArrowLeft /> Exit
          </BackLink>
          <Eyebrow>✦ classified ✦</Eyebrow>
        </TopBar>

        <Hero>
          <HeroSub>your year in</HeroSub>
          <HeroTitle>
            SoloGram
            <br />
            Wrapped
          </HeroTitle>
          <HeroRule />
          <HeroDate>since {format(stats.firstDate, 'MMMM d, yyyy')}</HeroDate>
        </Hero>

        <StatsGrid>
          {/* Days active */}
          <StatCard $visible={revealed >= 1} $accent={NOIR.salmon} $span={1}>
            <StatIcon $color={NOIR.salmon}>
              <FaCalendarAlt />
            </StatIcon>
            <BigNum>{stats.daysActive}</BigNum>
            <StatLabel>days of solitude</StatLabel>
          </StatCard>

          {/* Posts */}
          <StatCard $visible={revealed >= 2} $accent={NOIR.sage} $span={1}>
            <StatIcon $color={NOIR.sage}>
              <FaCamera />
            </StatIcon>
            <BigNum>{stats.totalPosts}</BigNum>
            <StatLabel>posts published</StatLabel>
          </StatCard>

          {/* Thoughts */}
          <StatCard $visible={revealed >= 3} $accent={NOIR.gold} $span={1}>
            <StatIcon $color={NOIR.gold}>
              <FaLightbulb />
            </StatIcon>
            <BigNum>{stats.totalThoughts}</BigNum>
            <StatLabel>thoughts recorded</StatLabel>
          </StatCard>

          {/* Likes */}
          <StatCard $visible={revealed >= 4} $accent='#e05c7a' $span={1}>
            <StatIcon $color='#e05c7a'>
              <FaHeart />
            </StatIcon>
            <BigNum>{stats.totalLikes}</BigNum>
            <StatLabel>total likes</StatLabel>
          </StatCard>

          {/* Most active month — full width */}
          <StatCard $visible={revealed >= 5} $accent={NOIR.salmon} $span={2}>
            <StatIcon $color={NOIR.salmon}>
              <FaStar />
            </StatIcon>
            <BigNum $sm>{stats.topMonth}</BigNum>
            <StatLabel>most active month</StatLabel>
            <StatSub>
              {stats.avgThoughtsPerWeek} thoughts/week on average
            </StatSub>
          </StatCard>

          {/* Top tags — full width */}
          {stats.topTags.length > 0 && (
            <StatCard $visible={revealed >= 6} $accent={NOIR.sage} $span={2}>
              <StatIcon $color={NOIR.sage}>
                <FaTag />
              </StatIcon>
              <StatLabel style={{ marginBottom: 12 }}>most used tags</StatLabel>
              <TagRow>
                {stats.topTags.map((tag) => (
                  <TagBadge key={tag}>#{tag}</TagBadge>
                ))}
              </TagRow>
            </StatCard>
          )}
        </StatsGrid>

        {/* Most liked post */}
        {stats.topPost && revealed >= 6 && (
          <TopPostCard>
            <TopPostLabel>✦ your most loved post</TopPostLabel>
            <TopPostTitle>{stats.topPost.title || 'Untitled'}</TopPostTitle>
            <TopPostMeta>
              {stats.topPost.likes} likes ·{' '}
              {format(new Date(stats.topPost.createdAt), 'MMM d, yyyy')}
            </TopPostMeta>
          </TopPostCard>
        )}

        <Footer>
          <FooterText>
            sologram · personal archive · {new Date().getFullYear()}
          </FooterText>
        </Footer>
      </Inner>
    </Shell>
  );
};

export default SoloGramWrapped;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

const heroReveal = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const ruleExpand = keyframes`
  from { width: 0; }
  to   { width: 60px; }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const Shell = styled.div`
  min-height: 100vh;
  background: ${NOIR.ink};
  overflow-x: hidden;

  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
    box-sizing: border-box;
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const Inner = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 0 24px 80px;
  box-sizing: border-box;
`;

// ─── Top bar ──────────────────────────────────────────────────────────────────

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 0;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  text-decoration: none;
  transition: color 0.15s;
  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const Eyebrow = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.2em;
  color: rgba(232, 124, 90, 0.4);
`;

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero = styled.div`
  padding: 48px 0 52px;
  animation: ${heroReveal} 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
`;

const HeroSub = styled.div`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.06em;
  margin-bottom: 8px;
`;

const HeroTitle = styled.h1`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: clamp(3rem, 10vw, 5rem);
  font-weight: 300;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: ${NOIR.warmWhite};
  margin: 0 0 20px;

  /* Salmon tint on "Wrapped" */
  em {
    color: ${NOIR.salmon};
    font-style: italic;
  }
`;

const HeroRule = styled.div`
  height: 1px;
  background: linear-gradient(90deg, ${NOIR.salmon}, ${NOIR.sage}, transparent);
  width: 60px;
  animation: ${ruleExpand} 0.6s ease 0.7s both;
  margin-bottom: 16px;
`;

const HeroDate = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.25);
`;

// ─── Stats grid ───────────────────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
`;

const StatCard = styled.div`
  grid-column: span ${(p) => p.$span || 1};
  padding: 22px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-top: 2px solid ${(p) => p.$accent || NOIR.salmon};
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: ${(p) => (p.$visible ? 'translateY(0)' : 'translateY(14px)')};
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
`;

const StatIcon = styled.div`
  font-size: 0.85rem;
  color: ${(p) => p.$color};
  margin-bottom: 10px;
  opacity: 0.8;
`;

const BigNum = styled.div`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: ${(p) => (p.$sm ? '1.8rem' : '2.8rem')};
  font-weight: 600;
  line-height: 1;
  color: ${NOIR.warmWhite};
  margin-bottom: 6px;
  letter-spacing: -0.02em;
`;

const StatLabel = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
`;

const StatSub = styled.div`
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.2);
  margin-top: 6px;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagBadge = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border: 1px solid rgba(122, 171, 140, 0.3);
  color: ${NOIR.sage};
`;

// ─── Top post ─────────────────────────────────────────────────────────────────

const TopPostCard = styled.div`
  margin-top: 10px;
  padding: 22px 20px;
  background: rgba(232, 124, 90, 0.05);
  border: 1px solid rgba(232, 124, 90, 0.15);
  animation: ${fadeUp} 0.5s ease both;
`;

const TopPostLabel = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${NOIR.salmon};
  opacity: 0.7;
  margin-bottom: 10px;
`;

const TopPostTitle = styled.div`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 1.3rem;
  font-weight: 600;
  font-style: italic;
  color: ${NOIR.warmWhite};
  margin-bottom: 6px;
`;

const TopPostMeta = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.25);
`;

// ─── Loading / footer ─────────────────────────────────────────────────────────

const LoadingMsg = styled.div`
  padding: 120px 0;
  text-align: center;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.3);
`;

const Blink = styled.span`
  animation: ${blink} 1s step-end infinite;
`;

const Footer = styled.div`
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const FooterText = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.12);
  text-align: center;
`;
