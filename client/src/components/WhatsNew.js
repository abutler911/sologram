// components/WhatsNew.js
import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaTimes, FaChevronRight, FaCamera, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../theme';
import axios from 'axios';

const STORAGE_KEY = 'sologram_last_visit';

const WhatsNew = () => {
  const [activity, setActivity] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const fetchActivity = useCallback(async () => {
    try {
      const lastVisit = localStorage.getItem(STORAGE_KEY);
      const since = lastVisit || Date.now() - 7 * 24 * 60 * 60 * 1000;

      const { data } = await axios.get(`/api/activity/recent?since=${since}`);

      if (
        data.success &&
        (data.data.postCount > 0 || data.data.thoughtCount > 0)
      ) {
        setActivity(data.data);
      }
    } catch (err) {
      console.error('[WhatsNew] fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Update last visit when user closes the banner or drawer
  const markVisited = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const dismiss = () => {
    markVisited();
    setDismissed(true);
    setDrawerOpen(false);
  };

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    markVisited();
    setDrawerOpen(false);
    setDismissed(true);
  };

  const goTo = (path) => {
    closeDrawer();
    navigate(path);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (!activity || dismissed) return null;

  const { postCount, thoughtCount, posts, thoughts } = activity;

  // Build banner text
  const parts = [];
  if (postCount > 0)
    parts.push(`${postCount} new post${postCount > 1 ? 's' : ''}`);
  if (thoughtCount > 0)
    parts.push(`${thoughtCount} new thought${thoughtCount > 1 ? 's' : ''}`);
  const bannerText = parts.join(' and ');

  return (
    <>
      {/* Banner */}
      <Banner onClick={openDrawer}>
        <BannerPulse />
        <BannerText>{bannerText} since your last visit</BannerText>
        <BannerActions>
          <BannerArrow>
            <FaChevronRight />
          </BannerArrow>
          <BannerClose
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            aria-label='Dismiss'
          >
            <FaTimes />
          </BannerClose>
        </BannerActions>
      </Banner>

      {/* Drawer overlay */}
      {drawerOpen && (
        <DrawerOverlay onClick={closeDrawer}>
          <Drawer onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle>What's New</DrawerTitle>
              <DrawerClose onClick={closeDrawer} aria-label='Close'>
                <FaTimes />
              </DrawerClose>
            </DrawerHeader>

            <DrawerContent>
              {posts.length > 0 && (
                <DrawerSection>
                  <SectionLabel>
                    <FaCamera /> Posts
                  </SectionLabel>
                  {posts.map((p) => (
                    <DrawerItem
                      key={p._id}
                      onClick={() => goTo(`/post/${p._id}`)}
                    >
                      {p.thumbnail && <ItemThumb src={p.thumbnail} alt='' />}
                      <ItemText>
                        <ItemTitle>{p.title}</ItemTitle>
                        <ItemMeta>
                          {formatDate(p.eventDate || p.createdAt)}
                          {p.tags?.length > 0 &&
                            ` · ${p.tags.slice(0, 2).join(', ')}`}
                        </ItemMeta>
                      </ItemText>
                      <FaChevronRight size={10} color={COLORS.textTertiary} />
                    </DrawerItem>
                  ))}
                </DrawerSection>
              )}

              {thoughts.length > 0 && (
                <DrawerSection>
                  <SectionLabel>
                    <FaLightbulb /> Thoughts
                  </SectionLabel>
                  {thoughts.map((t) => (
                    <DrawerItem key={t._id} onClick={() => goTo('/thoughts')}>
                      <ItemText>
                        <ItemTitle>
                          {t.content.length > 80
                            ? t.content.slice(0, 80) + '...'
                            : t.content}
                        </ItemTitle>
                        <ItemMeta>
                          {formatDate(t.createdAt)}
                          {t.mood && ` · ${t.mood}`}
                        </ItemMeta>
                      </ItemText>
                      <FaChevronRight size={10} color={COLORS.textTertiary} />
                    </DrawerItem>
                  ))}
                </DrawerSection>
              )}
            </DrawerContent>

            <DrawerFooter>
              <MarkReadButton onClick={closeDrawer}>
                Got it — I'm caught up
              </MarkReadButton>
            </DrawerFooter>
          </Drawer>
        </DrawerOverlay>
      )}
    </>
  );
};

export default WhatsNew;

// ── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`;

const pulseDot = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
`;

// ── Banner ──────────────────────────────────────────────────────────────────

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin: 0 0 16px;
  background: rgba(233, 137, 115, 0.08);
  border: 1px solid rgba(233, 137, 115, 0.2);
  border-radius: 12px;
  cursor: pointer;
  animation: ${slideDown} 0.2s ease-out;
  will-change: transform, opacity;

  &:hover {
    background: rgba(233, 137, 115, 0.12);
    border-color: rgba(233, 137, 115, 0.35);
  }
`;

const BannerPulse = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${COLORS.primarySalmon};
  flex-shrink: 0;
  animation: ${pulseDot} 2s ease-in-out infinite;
`;

const BannerText = styled.span`
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
`;

const BannerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BannerArrow = styled.div`
  color: ${COLORS.textTertiary};
  font-size: 0.7rem;
  display: flex;
`;

const BannerClose = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  font-size: 0.75rem;
  display: flex;
  transition: color 0.15s;

  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

// ── Drawer ──────────────────────────────────────────────────────────────────

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 11, 0.6);
  z-index: 1500;
  display: flex;
  justify-content: flex-end;
  animation: ${fadeIn} 0.12s ease;
`;

const Drawer = styled.div`
  width: 360px;
  max-width: 90vw;
  height: 100%;
  background: ${COLORS.cardBackground};
  border-left: 1px solid ${COLORS.border};
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);
  animation: ${slideIn} 0.2s ease-out;
  will-change: transform;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 14px;
  border-bottom: 1px solid ${COLORS.border};
`;

const DrawerTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const DrawerClose = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  font-size: 0.95rem;
  display: flex;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${COLORS.primarySalmon};
    background: ${COLORS.elevatedBackground};
  }
`;

// ── Drawer Content ──────────────────────────────────────────────────────────

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: ${COLORS.border} transparent;
`;

const DrawerSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  padding: 0 4px;
`;

const DrawerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;

  @media (hover: hover) {
    transition: background 0.12s;
    &:hover {
      background: ${COLORS.elevatedBackground};
    }
  }

  &:active {
    background: ${COLORS.elevatedBackground};
  }

  & + & {
    margin-top: 2px;
  }
`;

const ItemThumb = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid ${COLORS.border};
`;

const ItemText = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.div`
  font-size: 0.84rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ItemMeta = styled.div`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
  margin-top: 2px;
`;

// ── Drawer Footer ───────────────────────────────────────────────────────────

const DrawerFooter = styled.div`
  padding: 14px 16px;
  border-top: 1px solid ${COLORS.border};
`;

const MarkReadButton = styled.button`
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 10px;
  background: ${COLORS.elevatedBackground};
  color: ${COLORS.textSecondary};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${COLORS.primarySalmon};
    color: white;
  }
`;
